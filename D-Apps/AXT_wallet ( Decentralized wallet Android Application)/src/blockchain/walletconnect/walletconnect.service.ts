import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import {
  WCDAppMetadata,
  WCProposal,
  WCRequest,
  WCSession,
} from './walletconnect.types';
import { appStorage } from '../../storage/app-storage';

export const DEFAULT_WALLETCONNECT_PROJECT_ID =
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64';

export const AXT_WALLET_METADATA = {
  name: 'AXT Wallet',
  description: 'Non-Custodial Multi-Chain EVM Wallet',
  url: 'https://axtwallet.com',
  icons: ['https://axtwallet.com/icon.png'],
  redirect: {
    native: 'axtwalletapp://',
  },
};

const STORAGE_KEY_SESSION_BINDINGS = 'AXT_WC_SESSION_BINDINGS_V1';

export interface SessionBinding {
  topic: string;
  approvedAccount: string;
  approvedAccountIndex?: number;
  approvedAccountName: string;
  approvedChainIds: number[];
}

/**
 * Validates a WalletConnect v2 pairing URI by parsing its components
 * without relying on a rigid parameter ordering regex.
 */
export function isValidWalletConnectUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed.startsWith('wc:')) return false;

  // Expected WC v2 format: wc:<topic>@<version>?<query-params>
  const afterScheme = trimmed.slice(3);
  const atIdx = afterScheme.indexOf('@');
  if (atIdx <= 0) return false;

  const topic = afterScheme.slice(0, atIdx);
  if (!topic || topic.length < 8) return false;

  const questionIdx = afterScheme.indexOf('?');
  if (questionIdx <= atIdx) return false;

  const version = afterScheme.slice(atIdx + 1, questionIdx);
  if (version !== '2') return false;

  const queryString = afterScheme.slice(questionIdx + 1);
  const params = new URLSearchParams(queryString);

  const symKey = params.get('symKey');
  const relayProtocol = params.get('relay-protocol') || params.get('relayProtocol');

  return Boolean(symKey && symKey.length >= 16 && relayProtocol);
}

export class WalletConnectService {
  private web3wallet: IWeb3Wallet | null = null;
  private isInitializing = false;
  private onProposalCallbacks: ((proposal: WCProposal) => void)[] = [];
  private onRequestCallbacks: ((request: WCRequest) => void)[] = [];
  private onSessionDeleteCallbacks: ((topic: string) => void)[] = [];

  /**
   * Initializes the Web3Wallet client singleton.
   */
  async init(projectId: string = DEFAULT_WALLETCONNECT_PROJECT_ID): Promise<IWeb3Wallet> {
    if (this.web3wallet) return this.web3wallet;
    if (this.isInitializing) {
      // Wait if already initializing
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.web3wallet) return this.web3wallet;
    }

    this.isInitializing = true;

    try {
      const core = new Core({
        projectId,
      });

      this.web3wallet = await Web3Wallet.init({
        core: core as any,
        metadata: AXT_WALLET_METADATA,
      });

      this.setupEventListeners();

      if (__DEV__) {
        console.log('[WalletConnect] Web3Wallet client initialized successfully.');
      }

      return this.web3wallet;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Returns the initialized Web3Wallet instance.
   */
  getClient(): IWeb3Wallet {
    if (!this.web3wallet) {
      throw new Error('WalletConnect client not initialized. Call init() first.');
    }
    return this.web3wallet;
  }

  /**
   * Sets up core WalletConnect event handlers.
   */
  private setupEventListeners(): void {
    if (!this.web3wallet) return;

    // 1. Session Proposal Event
    this.web3wallet.on('session_proposal', (rawProposal) => {
      if (__DEV__) {
        console.log('[WalletConnect] Incoming session proposal:', rawProposal.id);
      }

      const proposal = this.normalizeProposal(rawProposal);
      this.onProposalCallbacks.forEach((cb) => cb(proposal));
    });

    // 2. Session Request Event
    this.web3wallet.on('session_request', (rawRequest) => {
      if (__DEV__) {
        console.log('[WalletConnect] Incoming session request:', rawRequest.id, rawRequest.params.request.method);
      }

      const request = this.normalizeRequest(rawRequest);
      this.onRequestCallbacks.forEach((cb) => cb(request));
    });

    // 3. Session Delete Event
    this.web3wallet.on('session_delete', (data) => {
      if (__DEV__) {
        console.log('[WalletConnect] Session deleted:', data.topic);
      }
      this.removeSessionBinding(data.topic).catch(() => {});
      this.onSessionDeleteCallbacks.forEach((cb) => cb(data.topic));
    });
  }

  /**
   * Parses a raw WalletConnect proposal into a normalized WCProposal object.
   */
  normalizeProposal(raw: any): WCProposal {
    const { id, params } = raw;
    const proposer = params?.proposer?.metadata || {
      name: 'Unknown dApp',
      url: '',
      icons: [],
    };

    const dApp: WCDAppMetadata = {
      name: proposer.name || 'Unknown dApp',
      url: proposer.url || '',
      icons: proposer.icons || [],
      description: proposer.description,
      redirect: proposer.redirect,
    };

    const requiredNamespaces = params?.requiredNamespaces || {};
    const optionalNamespaces = params?.optionalNamespaces || {};

    const requestedChainStrs = new Set<string>([
      ...(requiredNamespaces?.eip155?.chains || []),
      ...(optionalNamespaces?.eip155?.chains || []),
    ]);

    const requestedChains: number[] = [];
    requestedChainStrs.forEach((c) => {
      const parts = c.split(':');
      if (parts[0] === 'eip155' && parts[1]) {
        const idNum = parseInt(parts[1], 10);
        if (!isNaN(idNum)) requestedChains.push(idNum);
      }
    });

    const requestedMethods = [
      ...(requiredNamespaces?.eip155?.methods || []),
      ...(optionalNamespaces?.eip155?.methods || []),
    ];

    return {
      id,
      params,
      dApp,
      requestedChains,
      requestedMethods,
      requiredNamespaces,
      optionalNamespaces,
    };
  }

  /**
   * Normalizes a raw WalletConnect session request into a WCRequest object.
   */
  normalizeRequest(raw: any): WCRequest {
    const { id, topic, params } = raw;
    const chainIdStr = params?.chainId || 'eip155:1';
    const chainId = parseInt(chainIdStr.replace('eip155:', ''), 10) || 1;
    const method = params?.request?.method || '';
    const rpcParams = params?.request?.params;

    const session = this.web3wallet?.getActiveSessions()[topic];
    const peerMeta = session?.peer?.metadata;

    const dApp: WCDAppMetadata | undefined = peerMeta
      ? {
          name: peerMeta.name || 'dApp',
          url: peerMeta.url || '',
          icons: peerMeta.icons || [],
          description: peerMeta.description,
          redirect: peerMeta.redirect,
        }
      : undefined;

    return {
      id,
      topic,
      chainId,
      method,
      params: rpcParams,
      dApp,
      account: '',
    };
  }

  /**
   * Pairs with a WalletConnect URI (wc:...).
   */
  async pair(uri: string): Promise<void> {
    const client = this.getClient();
    const trimmed = uri.trim();
    if (!trimmed.startsWith('wc:') || !isValidWalletConnectUri(trimmed)) {
      throw new Error('Invalid or malformed WalletConnect URI.');
    }

    await client.core.pairing.pair({ uri: trimmed });
  }

  /**
   * Subscribes to incoming session proposals.
   */
  onProposal(cb: (proposal: WCProposal) => void): () => void {
    this.onProposalCallbacks.push(cb);
    return () => {
      this.onProposalCallbacks = this.onProposalCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Subscribes to incoming session requests.
   */
  onRequest(cb: (request: WCRequest) => void): () => void {
    this.onRequestCallbacks.push(cb);
    return () => {
      this.onRequestCallbacks = this.onRequestCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Subscribes to session deletion events.
   */
  onSessionDelete(cb: (topic: string) => void): () => void {
    this.onSessionDeleteCallbacks.push(cb);
    return () => {
      this.onSessionDeleteCallbacks = this.onSessionDeleteCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Saves custom account and chain bindings for an approved session.
   */
  async saveSessionBinding(binding: SessionBinding): Promise<void> {
    const bindings = await this.getSessionBindings();
    const filtered = bindings.filter((b) => b.topic !== binding.topic);
    filtered.push(binding);
    await appStorage.setItem(STORAGE_KEY_SESSION_BINDINGS, JSON.stringify(filtered));
  }

  /**
   * Retrieves all persisted session bindings.
   */
  async getSessionBindings(): Promise<SessionBinding[]> {
    const raw = await appStorage.getItem(STORAGE_KEY_SESSION_BINDINGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Removes a session binding by topic.
   */
  async removeSessionBinding(topic: string): Promise<void> {
    const bindings = await this.getSessionBindings();
    const filtered = bindings.filter((b) => b.topic !== topic);
    await appStorage.setItem(STORAGE_KEY_SESSION_BINDINGS, JSON.stringify(filtered));
  }

  /**
   * Clears all session bindings.
   */
  async clearAllSessionBindings(): Promise<void> {
    await appStorage.deleteItem(STORAGE_KEY_SESSION_BINDINGS);
  }

  /**
   * Returns all active WalletConnect sessions merged with account binding info.
   */
  async getActiveSessions(): Promise<WCSession[]> {
    if (!this.web3wallet) return [];

    const activeRaw = this.web3wallet.getActiveSessions();
    const bindings = await this.getSessionBindings();
    const bindingMap = new Map<string, SessionBinding>();
    bindings.forEach((b) => bindingMap.set(b.topic, b));

    const sessions: WCSession[] = [];

    for (const [topic, s] of Object.entries(activeRaw)) {
      const binding = bindingMap.get(topic);
      const peer = s.peer?.metadata || { name: 'dApp', url: '', icons: [] };

      // Extract chain IDs from eip155 namespace
      const eip155 = s.namespaces?.eip155;
      const chains = eip155?.chains || [];
      const chainIds = chains.map((c: string) => parseInt(c.replace('eip155:', ''), 10)).filter((n: number) => !isNaN(n));

      // Extract account address from eip155 accounts
      const accounts = eip155?.accounts || [];
      let accountAddr = binding?.approvedAccount || '';
      if (!accountAddr && accounts.length > 0) {
        const parts = accounts[0].split(':');
        accountAddr = parts[2] || '';
      }

      sessions.push({
        topic,
        peer: {
          name: peer.name || 'dApp',
          url: peer.url || '',
          icons: peer.icons || [],
          description: peer.description,
          redirect: peer.redirect,
        },
        approvedAccount: accountAddr,
        approvedAccountIndex: binding?.approvedAccountIndex ?? 0,
        approvedAccountName: binding?.approvedAccountName || 'Account 1',
        approvedChainIds: binding?.approvedChainIds?.length ? binding.approvedChainIds : chainIds,
        expiry: s.expiry || 0,
      });
    }

    return sessions;
  }
}

export const walletConnectService = new WalletConnectService();

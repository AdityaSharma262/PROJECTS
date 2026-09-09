import { WCProposal, WCSession } from './walletconnect.types';
import { walletConnectService } from './walletconnect.service';
import { WalletAccount } from '../../wallet/accounts/account.types';
import { NetworkConfig } from '../networks/network.types';

export const SUPPORTED_EIP155_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
];

export const SUPPORTED_EIP155_EVENTS = [
  'chainChanged',
  'accountsChanged',
];

export class WalletConnectSessionService {
  /**
   * Constructs strict, account-bound EIP-155 namespaces for session approval.
   */
  buildNamespaces(
    proposal: WCProposal,
    account: WalletAccount,
    approvedNetworks: NetworkConfig[]
  ): Record<string, any> {
    if (!approvedNetworks.length) {
      throw new Error('At least one supported network must be approved.');
    }

    const chainStrings = approvedNetworks.map((n) => `eip155:${n.chainId}`);
    const accountStrings = approvedNetworks.map((n) => `eip155:${n.chainId}:${account.address}`);

    // Merge methods from proposal with our supported methods
    const requestedMethods = proposal.requestedMethods || [];
    const supportedMethodsSet = new Set(SUPPORTED_EIP155_METHODS);
    const methods = Array.from(
      new Set([...requestedMethods.filter((m) => supportedMethodsSet.has(m)), 'eth_sendTransaction', 'personal_sign'])
    );

    return {
      eip155: {
        chains: chainStrings,
        methods,
        events: SUPPORTED_EIP155_EVENTS,
        accounts: accountStrings,
      },
    };
  }

  /**
   * Approves a session proposal with strict account and network bindings.
   */
  async approveProposal(
    proposal: WCProposal,
    account: WalletAccount,
    approvedNetworks: NetworkConfig[]
  ): Promise<any> {
    const client = walletConnectService.getClient();
    const namespaces = this.buildNamespaces(proposal, account, approvedNetworks);

    const session = await client.approveSession({
      id: proposal.id,
      namespaces,
    });

    // Save session binding
    await walletConnectService.saveSessionBinding({
      topic: session.topic,
      approvedAccount: account.address,
      approvedAccountIndex: account.index,
      approvedAccountName: account.name,
      approvedChainIds: approvedNetworks.map((n) => n.chainId),
    });

    if (__DEV__) {
      console.log(`[WalletConnect] Approved session ${session.topic} for account ${account.name} on ${approvedNetworks.length} chains.`);
    }

    return session;
  }

  /**
   * Rejects a session proposal with standard 4001 error code.
   */
  async rejectProposal(proposalId: number, reason: string = 'User rejected connection'): Promise<void> {
    const client = walletConnectService.getClient();
    await client.rejectSession({
      id: proposalId,
      reason: {
        code: 4001,
        message: reason,
      },
    });

    if (__DEV__) {
      console.log(`[WalletConnect] Rejected proposal ${proposalId}: ${reason}`);
    }
  }

  /**
   * Disconnects an individual active session.
   */
  async disconnectSession(topic: string, reason: string = 'User disconnected'): Promise<void> {
    const client = walletConnectService.getClient();
    try {
      await client.disconnectSession({
        topic,
        reason: {
          code: 6000,
          message: reason,
        },
      });
    } catch {
      // Session may already be closed by peer
    }

    await walletConnectService.removeSessionBinding(topic);

    if (__DEV__) {
      console.log(`[WalletConnect] Disconnected session ${topic}`);
    }
  }

  /**
   * Disconnects and revokes all active sessions.
   */
  async revokeAllSessions(): Promise<void> {
    const sessions = await walletConnectService.getActiveSessions();
    for (const s of sessions) {
      await this.disconnectSession(s.topic, 'Revoked all sessions');
    }
    await walletConnectService.clearAllSessionBindings();

    if (__DEV__) {
      console.log('[WalletConnect] Revoked all active sessions.');
    }
  }
}

export const walletConnectSessionService = new WalletConnectSessionService();

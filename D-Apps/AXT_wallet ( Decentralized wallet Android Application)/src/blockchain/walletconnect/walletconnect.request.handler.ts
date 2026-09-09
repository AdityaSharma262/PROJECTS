import { formatUnits, toUtf8String, isHexString, isAddress } from 'ethers';
import {
  WCRequest,
  WCTxReviewData,
  WCMsgReviewData,
} from './walletconnect.types';
import { walletConnectService, SessionBinding } from './walletconnect.service';
import { NetworkConfig } from '../networks/network.types';
import { trimDecimals } from '../balances/balance.utils';
import { transactionAnalyzer } from '../security/transaction.analyzer';
import { signatureAnalyzer } from '../security/signature.analyzer';

export const SUPPORTED_WC_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
];

export class WalletConnectRequestHandler {
  /**
   * Validates incoming request against session bindings and supported networks.
   */
  async validateRequest(
    request: WCRequest,
    availableNetworks: NetworkConfig[]
  ): Promise<{
    binding: SessionBinding;
    network: NetworkConfig;
  }> {
    // Validate method support first
    if (!SUPPORTED_WC_METHODS.includes(request.method)) {
      throw new Error(`Unsupported method: ${request.method}`);
    }

    const bindings = await walletConnectService.getSessionBindings();
    const binding = bindings.find((b) => b.topic === request.topic);

    if (!binding) {
      throw new Error('No approved session found for this dApp request.');
    }

    // Validate chain is approved for this session
    if (!binding.approvedChainIds.includes(request.chainId)) {
      throw new Error(
        `Chain ID ${request.chainId} is not approved for this dApp session.`
      );
    }

    // Resolve NetworkConfig
    const network = availableNetworks.find((n) => n.chainId === request.chainId);
    if (!network) {
      throw new Error(`Unsupported network chain ID: ${request.chainId}`);
    }

    return { binding, network };
  }

  /**
   * Parses and validates an eth_sendTransaction request into WCTxReviewData.
   */
  async parseTransactionRequest(
    request: WCRequest,
    binding: SessionBinding,
    network: NetworkConfig
  ): Promise<WCTxReviewData> {
    const txObj = Array.isArray(request.params) ? request.params[0] : request.params;
    if (!txObj || typeof txObj !== 'object') {
      throw new Error('Invalid transaction parameters.');
    }

    const from = txObj.from || binding.approvedAccount;
    if (from.toLowerCase() !== binding.approvedAccount.toLowerCase()) {
      throw new Error(
        `Sender address (${from}) does not match approved session account (${binding.approvedAccount}).`
      );
    }

    const to = txObj.to || undefined;
    const data = txObj.data || undefined;
    const isContractInteraction = Boolean(data && data !== '0x' && data !== '0x00');

    let valueWei = 0n;
    if (txObj.value) {
      valueWei = typeof txObj.value === 'string' && txObj.value.startsWith('0x')
        ? BigInt(txObj.value)
        : BigInt(txObj.value.toString());
    }

    let gasLimit: bigint | undefined;
    if (txObj.gas || txObj.gasLimit) {
      const g = txObj.gas || txObj.gasLimit;
      gasLimit = typeof g === 'string' && g.startsWith('0x') ? BigInt(g) : BigInt(g.toString());
    }

    const formattedValue = trimDecimals(
      formatUnits(valueWei, network.nativeCurrency.decimals),
      6
    );

    const dApp = request.dApp || {
      name: 'External dApp',
      url: '',
      icons: [],
    };

    // Run unified transaction analyzer & risk assessment
    const analysis = transactionAnalyzer.analyzeTransaction(
      {
        from,
        to,
        value: valueWei,
        data,
      },
      network,
      { address: from }
    );

    return {
      requestId: request.id,
      topic: request.topic,
      dApp,
      from,
      to,
      valueWei,
      formattedValue,
      symbol: network.nativeCurrency.symbol,
      data,
      isContractInteraction,
      network,
      accountName: binding.approvedAccountName,
      accountIndex: binding.approvedAccountIndex,
      gasLimit,
      analysis,
    };
  }

  /**
   * Parses and validates message signing requests (personal_sign, eth_sign, eth_signTypedData_v4).
   * Dynamically resolves parameter order to identify signer address vs message payload.
   */
  async parseMessageRequest(
    request: WCRequest,
    binding: SessionBinding,
    network: NetworkConfig
  ): Promise<WCMsgReviewData> {
    const method = request.method as
      | 'personal_sign'
      | 'eth_sign'
      | 'eth_signTypedData'
      | 'eth_signTypedData_v3'
      | 'eth_signTypedData_v4';

    const params = Array.isArray(request.params) ? request.params : [request.params];
    let from = '';
    let rawMessage: any = '';
    let displayMessage = '';
    let typedDataDomain: any = undefined;
    let typedDataTypes: any = undefined;
    let typedDataValue: any = undefined;

    // Flexible parameter resolution: detect EVM address position
    if (method === 'personal_sign') {
      if (params.length >= 2) {
        if (typeof params[0] === 'string' && isAddress(params[0])) {
          from = params[0];
          rawMessage = params[1];
        } else if (typeof params[1] === 'string' && isAddress(params[1])) {
          rawMessage = params[0];
          from = params[1];
        } else {
          rawMessage = params[0];
          from = binding.approvedAccount;
        }
      } else {
        rawMessage = params[0];
        from = binding.approvedAccount;
      }

      displayMessage = this.decodeMessageToUtf8(rawMessage);
    } else if (method === 'eth_sign') {
      if (params.length >= 2) {
        if (typeof params[0] === 'string' && isAddress(params[0])) {
          from = params[0];
          rawMessage = params[1];
        } else if (typeof params[1] === 'string' && isAddress(params[1])) {
          rawMessage = params[0];
          from = params[1];
        } else {
          from = params[0];
          rawMessage = params[1];
        }
      } else {
        from = binding.approvedAccount;
        rawMessage = params[0] || '';
      }
      displayMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
    } else if (
      method === 'eth_signTypedData' ||
      method === 'eth_signTypedData_v3' ||
      method === 'eth_signTypedData_v4'
    ) {
      if (params.length >= 2) {
        if (typeof params[0] === 'string' && isAddress(params[0])) {
          from = params[0];
          rawMessage = params[1];
        } else if (typeof params[1] === 'string' && isAddress(params[1])) {
          rawMessage = params[0];
          from = params[1];
        } else {
          rawMessage = params[0];
          from = binding.approvedAccount;
        }
      } else {
        rawMessage = params[0];
        from = binding.approvedAccount;
      }

      let parsedJson = rawMessage;
      if (typeof rawMessage === 'string') {
        try {
          parsedJson = JSON.parse(rawMessage);
        } catch {
          parsedJson = {};
        }
      }

      typedDataDomain = parsedJson?.domain || {};
      typedDataTypes = parsedJson?.types || {};
      typedDataValue = parsedJson?.message || parsedJson?.value || {};

      displayMessage = JSON.stringify(parsedJson, null, 2);
    }

    if (from && from.toLowerCase() !== binding.approvedAccount.toLowerCase()) {
      throw new Error(
        `Signer address (${from}) does not match approved session account (${binding.approvedAccount}).`
      );
    }

    const dApp = request.dApp || {
      name: 'External dApp',
      url: '',
      icons: [],
    };

    // Run unified signature analyzer & risk assessment
    const analysis = signatureAnalyzer.analyzeSignature(
      {
        method,
        from: from || binding.approvedAccount,
        rawMessage,
        dAppName: dApp.name,
        dAppUrl: dApp.url,
      },
      network,
      request.chainId
    );

    return {
      requestId: request.id,
      topic: request.topic,
      dApp,
      method:
        method === 'eth_signTypedData' || method === 'eth_signTypedData_v3'
          ? 'eth_signTypedData_v4'
          : method,
      from: from || binding.approvedAccount,
      rawMessage,
      displayMessage,
      typedDataDomain,
      typedDataTypes,
      typedDataValue,
      network,
      accountName: binding.approvedAccountName,
      accountIndex: binding.approvedAccountIndex,
      analysis,
    };
  }

  /**
   * Helper to decode hex messages to human-readable UTF-8 strings.
   */
  private decodeMessageToUtf8(raw: any): string {
    if (typeof raw !== 'string') {
      return JSON.stringify(raw, null, 2);
    }

    if (isHexString(raw)) {
      try {
        const decoded = toUtf8String(raw);
        // Ensure decoded string does not contain unprintable binary chars
        if (/^[\x20-\x7E\s\u00A0-\uFFFF]*$/.test(decoded)) {
          return decoded;
        }
      } catch {
        // Fallback to raw hex
      }
    }

    return raw;
  }

  /**
   * Sends a successful JSON-RPC response back to the dApp.
   */
  async respondSuccess(topic: string, id: number, result: any): Promise<void> {
    const client = walletConnectService.getClient();
    await client.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result,
      },
    });

    if (__DEV__) {
      console.log(`[WalletConnect] Responded SUCCESS to request ${id}`);
    }
  }

  /**
   * Sends a JSON-RPC error response back to the dApp.
   */
  async respondError(
    topic: string,
    id: number,
    code: number = 4001,
    message: string = 'User rejected request'
  ): Promise<void> {
    const client = walletConnectService.getClient();
    await client.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code,
          message,
        },
      },
    });

    if (__DEV__) {
      console.log(`[WalletConnect] Responded ERROR to request ${id}: [${code}] ${message}`);
    }
  }
}

export const walletConnectRequestHandler = new WalletConnectRequestHandler();

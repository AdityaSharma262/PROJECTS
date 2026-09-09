import { toUtf8String, isHexString, isAddress } from 'ethers';
import { NetworkConfig } from '../networks/network.types';
import {
  SignatureAnalysis,
  SignatureKind,
  SignatureRisk,
  StructuredField,
  EIP712DomainSummary,
} from './security.types';

export interface RawSignatureInput {
  method: string;
  from: string;
  rawMessage: any;
  dAppName?: string;
  dAppUrl?: string;
}

export class SignatureAnalyzer {
  /**
   * Safely attempts to decode a hex string to readable UTF-8 text.
   */
  private decodeUtf8Safe(raw: any): { text: string; isReadable: boolean } {
    if (typeof raw !== 'string') {
      try {
        return { text: JSON.stringify(raw, null, 2), isReadable: true };
      } catch {
        return { text: String(raw), isReadable: false };
      }
    }

    const trimmed = raw.trim();

    if (isHexString(trimmed)) {
      try {
        const decoded = toUtf8String(trimmed);
        // Printable ASCII, whitespace, or printable unicode text
        if (decoded.length > 0 && /^[\x20-\x7E\t\r\n\u00A0-\uFFFF]*$/.test(decoded)) {
          return { text: decoded, isReadable: true };
        }
      } catch {
        // Not valid UTF-8 hex
      }
      return { text: trimmed, isReadable: false };
    }

    // Plain readable text
    return { text: trimmed, isReadable: true };
  }

  /**
   * Formats structured fields preserving nested structures.
   */
  private formatStructuredFields(msgObj: any): StructuredField[] {
    if (!msgObj || typeof msgObj !== 'object') return [];

    const fields: StructuredField[] = [];

    for (const [key, val] of Object.entries(msgObj)) {
      if (val === null || val === undefined) {
        fields.push({ key, value: 'null', isNested: false });
      } else if (typeof val === 'object') {
        fields.push({
          key,
          value: JSON.stringify(val, null, 2),
          isNested: true,
        });
      } else {
        fields.push({
          key,
          value: String(val),
          isNested: false,
        });
      }
    }

    return fields;
  }

  /**
   * Evaluates and normalizes signature requests into a structured security review.
   *
   * @param request - Raw signature request details
   * @param network - Current network configuration
   * @param sessionChainId - Expected chain ID for the session/dApp
   */
  analyzeSignature(
    request: RawSignatureInput,
    network: NetworkConfig,
    sessionChainId?: number
  ): SignatureAnalysis {
    const method = request.method;
    const fromAddress = request.from || '';
    const dAppName = request.dAppName || 'External dApp';
    const rawPayload =
      typeof request.rawMessage === 'string'
        ? request.rawMessage
        : JSON.stringify(request.rawMessage, null, 2);

    const expectedChainId = sessionChainId ?? network.chainId;

    // ─────────────────────────────────────────────────────────────
    // 1. personal_sign
    // ─────────────────────────────────────────────────────────────
    if (method === 'personal_sign') {
      const { text, isReadable } = this.decodeUtf8Safe(request.rawMessage);

      if (isReadable) {
        return {
          kind: 'personal_message',
          risk: 'low',
          method: 'personal_sign',
          title: 'Personal Message Signature',
          summary: `Sign human-readable personal message for ${dAppName}`,
          accountAddress: fromAddress,
          decodedMessage: text,
          rawPayload,
          warnings: [],
        };
      } else {
        return {
          kind: 'personal_message',
          risk: 'medium',
          method: 'personal_sign',
          title: 'Encoded Personal Message',
          summary: `Sign encoded/binary message for ${dAppName}`,
          accountAddress: fromAddress,
          decodedMessage: text,
          rawPayload,
          warnings: [
            'This message contains unreadable or raw binary data. Make sure you trust this dApp before signing.',
          ],
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. eth_sign (High Risk)
    // ─────────────────────────────────────────────────────────────
    if (method === 'eth_sign') {
      const { text } = this.decodeUtf8Safe(request.rawMessage);
      return {
        kind: 'raw_message',
        risk: 'high',
        method: 'eth_sign',
        title: '⚠️ Dangerous Raw Signature (eth_sign)',
        summary: `Sign arbitrary binary hash for ${dAppName}`,
        accountAddress: fromAddress,
        decodedMessage: text,
        rawPayload,
        warnings: [
          'eth_sign allows this dApp to request signatures on arbitrary binary data without clear intent. This can potentially be used to sign unauthorized transactions or compromise wallet assets. Only continue if you trust this dApp.',
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. eth_signTypedData / eth_signTypedData_v4 (EIP-712)
    // ─────────────────────────────────────────────────────────────
    if (
      method === 'eth_signTypedData' ||
      method === 'eth_signTypedData_v4' ||
      method === 'eth_signTypedData_v3'
    ) {
      let parsed: any = request.rawMessage;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = null;
        }
      }

      if (!parsed || typeof parsed !== 'object') {
        return {
          kind: 'unknown',
          risk: 'high',
          method: 'eth_signTypedData_v4',
          title: '⚠️ Malformed Typed Data',
          summary: 'Structured data could not be parsed.',
          accountAddress: fromAddress,
          rawPayload,
          warnings: [
            'The structured data provided by this dApp is malformed or uses an unrecognized format. Review the raw payload carefully.',
          ],
        };
      }

      const domain: EIP712DomainSummary = parsed.domain || {};
      const types = parsed.types || {};
      const message = parsed.message || parsed.value || {};
      const primaryType =
        parsed.primaryType ||
        Object.keys(types).find((k) => k !== 'EIP712Domain') ||
        'TypedData';

      const structuredFields = this.formatStructuredFields(message);
      const warnings: string[] = [];
      let risk: SignatureRisk = 'medium';

      // Chain ID mismatch verification
      if (domain.chainId !== undefined && domain.chainId !== null) {
        try {
          const domainChainId = BigInt(domain.chainId);
          if (domainChainId !== BigInt(expectedChainId)) {
            risk = 'high';
            warnings.push(
              `Chain ID Mismatch: This message specifies chain ID ${domain.chainId}, but your current session is connected to chain ID ${expectedChainId}. Signing may authorize actions on a different network.`
            );
          }
        } catch {
          // Ignore parse errors on chainId
        }
      }

      const domainTitle = domain.name || dAppName;

      return {
        kind: 'typed_data',
        risk,
        method: 'eth_signTypedData_v4',
        title: `Sign Typed Data: ${primaryType}`,
        summary: `Structured EIP-712 data for ${domainTitle}`,
        accountAddress: fromAddress,
        typedDataDomain: domain,
        primaryType,
        structuredFields,
        rawPayload,
        warnings,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Unsupported / Unknown Method
    // ─────────────────────────────────────────────────────────────
    return {
      kind: 'unknown',
      risk: 'high',
      method,
      title: '⚠️ Unsupported Signature Method',
      summary: `Method "${method}" is not recognized or supported.`,
      accountAddress: fromAddress,
      rawPayload,
      warnings: [`The signing method "${method}" is not recognized or supported.`],
    };
  }
}

export const signatureAnalyzer = new SignatureAnalyzer();

import * as Clipboard from 'expo-clipboard';

let sensitiveClipboardTimer: NodeJS.Timeout | null = null;

/**
 * Copies genuinely sensitive text (such as a recovery phrase or exported private key)
 * to the clipboard and schedules an automatic wipe after a designated timeout (default 60s)
 * to minimize residual exposure.
 *
 * NOTE: Normal public addresses, contract addresses, and transaction hashes should NOT
 * use this method.
 */
export async function copySensitiveText(
  secretText: string,
  clearAfterSeconds = 60
): Promise<void> {
  if (sensitiveClipboardTimer) {
    clearTimeout(sensitiveClipboardTimer);
    sensitiveClipboardTimer = null;
  }

  await Clipboard.setStringAsync(secretText);

  sensitiveClipboardTimer = setTimeout(async () => {
    try {
      const currentClipboard = await Clipboard.getStringAsync();
      if (currentClipboard === secretText) {
        await Clipboard.setStringAsync('');
      }
    } catch {
      // Ignore clipboard check errors
    } finally {
      sensitiveClipboardTimer = null;
    }
  }, clearAfterSeconds * 1000);

  if (sensitiveClipboardTimer && typeof sensitiveClipboardTimer.unref === 'function') {
    sensitiveClipboardTimer.unref();
  }
}

export function clearSensitiveClipboardTimer(): void {
  if (sensitiveClipboardTimer) {
    clearTimeout(sensitiveClipboardTimer);
    sensitiveClipboardTimer = null;
  }
}

/**
 * Standard copy for non-sensitive public data (wallet addresses, transaction hashes, contract addresses).
 */
export async function copyPublicText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

import { normalizeMnemonic, validateMnemonicWithReason } from '../../../src/wallet/crypto/mnemonic';

describe('Mnemonic Utilities', () => {
  const valid12Word = 'apple banana cherry date elderberry fig grape honeydew kiwi lemon mango nectarine';

  describe('normalizeMnemonic', () => {
    it('trims leading and trailing spaces', () => {
      expect(normalizeMnemonic('  ' + valid12Word + '  ')).toBe(valid12Word);
    });

    it('converts multiple spaces to a single space', () => {
      const withExtraSpaces = 'apple   banana  cherry date elderberry fig grape honeydew kiwi lemon mango nectarine';
      expect(normalizeMnemonic(withExtraSpaces)).toBe(valid12Word);
    });

    it('replaces line breaks and tabs with spaces', () => {
      const pasted = 'apple\nbanana\tcherry date elderberry fig grape honeydew kiwi lemon mango nectarine';
      expect(normalizeMnemonic(pasted)).toBe(valid12Word);
    });

    it('converts to lowercase', () => {
      expect(normalizeMnemonic('APPLE banana CHErry date elderberry fig grape honeydew kiwi lemon mango nectarine')).toBe(valid12Word);
    });
  });

  describe('validateMnemonicWithReason', () => {
    // Note: We use a real BIP-39 mnemonic for the valid test so it passes the checksum
    const realValidMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('accepts a valid 12-word phrase', () => {
      const result = validateMnemonicWithReason(realValidMnemonic);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.normalizedPhrase).toBe(realValidMnemonic);
      }
    });

    it('accepts a valid phrase with messy formatting', () => {
      const messy = '  ABANDON\nabandon\t abandon  abandon abandon abandon abandon abandon abandon abandon abandon about  ';
      const result = validateMnemonicWithReason(messy);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.normalizedPhrase).toBe(realValidMnemonic);
      }
    });

    it('rejects an empty string', () => {
      const result = validateMnemonicWithReason('   ');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Enter your recovery phrase.');
      }
    });

    it('rejects an invalid word count', () => {
      const elevenWords = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
      const result = validateMnemonicWithReason(elevenWords);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Recovery phrase must contain 12, 15, 18, 21, or 24 words.');
      }
    });

    it('rejects invalid BIP-39 checksum', () => {
      // 12 words but invalid checksum/words
      const invalidChecksum = 'apple banana cherry date elderberry fig grape honeydew kiwi lemon mango nectarine';
      const result = validateMnemonicWithReason(invalidChecksum);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('This recovery phrase is not valid. Please check the words and try again.');
      }
    });
  });
});

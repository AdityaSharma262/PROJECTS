import { describe, it, expect } from '@jest/globals';
import { derivePINKey, deriveMasterKey, encryptAESGCM, decryptAESGCM, AAD } from '../../src/security/encryption';

// Polyfill is used in app, but tests run in node, so noble hashes uses node crypto under the hood automatically for CSPRNG.
const cryptoObj = require('crypto');

function randomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  cryptoObj.getRandomValues(array);
  return array;
}

describe('Encryption Layer', () => {
  const PIN = "123456";
  const SALT = randomBytes(16);
  const DK = randomBytes(32);
  const ITERATIONS = 1000; // Low for fast testing

  it('derives a 32-byte PK from PIN', async () => {
    const pk = await derivePINKey(PIN, SALT, ITERATIONS);
    expect(pk.length).toBe(32);
  });

  it('PK derivation is deterministic', async () => {
    const pk1 = await derivePINKey(PIN, SALT, ITERATIONS);
    const pk2 = await derivePINKey(PIN, SALT, ITERATIONS);
    expect(pk1).toEqual(pk2);
  });

  it('derives a 32-byte MEK', async () => {
    const pk = await derivePINKey(PIN, SALT, ITERATIONS);
    const mek = deriveMasterKey(DK, pk, SALT);
    expect(mek.length).toBe(32);
  });

  it('encrypts and decrypts payload via AES-GCM', async () => {
    const pk = await derivePINKey(PIN, SALT, ITERATIONS);
    const mek = deriveMasterKey(DK, pk, SALT);
    const nonce = randomBytes(12);
    
    const plaintext = new TextEncoder().encode("secret message");
    
    const { ciphertext, tag } = encryptAESGCM(plaintext, mek, nonce);
    
    expect(ciphertext.length).toBe(plaintext.length);
    expect(tag.length).toBe(16);

    const decrypted = decryptAESGCM(ciphertext, mek, nonce, tag);
    expect(new TextDecoder().decode(decrypted)).toBe("secret message");
  });

  it('fails decryption on wrong MEK', async () => {
    const pk = await derivePINKey(PIN, SALT, ITERATIONS);
    const mek = deriveMasterKey(DK, pk, SALT);
    const wrongMek = deriveMasterKey(randomBytes(32), pk, SALT); // Different DK
    const nonce = randomBytes(12);
    
    const plaintext = new TextEncoder().encode("secret message");
    const { ciphertext, tag } = encryptAESGCM(plaintext, mek, nonce);
    
    expect(() => decryptAESGCM(ciphertext, wrongMek, nonce, tag)).toThrow();
  });

  it('fails decryption if ciphertext is modified', () => {
    const mek = randomBytes(32);
    const nonce = randomBytes(12);
    const plaintext = new TextEncoder().encode("secret message");
    const { ciphertext, tag } = encryptAESGCM(plaintext, mek, nonce);
    
    // Modify ciphertext
    ciphertext[0] ^= 1;
    
    expect(() => decryptAESGCM(ciphertext, mek, nonce, tag)).toThrow();
  });

  it('fails decryption if tag is modified', () => {
    const mek = randomBytes(32);
    const nonce = randomBytes(12);
    const plaintext = new TextEncoder().encode("secret message");
    const { ciphertext, tag } = encryptAESGCM(plaintext, mek, nonce);
    
    tag[0] ^= 1;
    
    expect(() => decryptAESGCM(ciphertext, mek, nonce, tag)).toThrow();
  });

  it('different encryptions produce different ciphertexts (nonce reuse not allowed conceptually, but handled by fresh generation)', () => {
    const mek = randomBytes(32);
    const nonce1 = randomBytes(12);
    const nonce2 = randomBytes(12);
    const plaintext = new TextEncoder().encode("secret message");
    
    const enc1 = encryptAESGCM(plaintext, mek, nonce1);
    const enc2 = encryptAESGCM(plaintext, mek, nonce2);
    
    expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
  });
});

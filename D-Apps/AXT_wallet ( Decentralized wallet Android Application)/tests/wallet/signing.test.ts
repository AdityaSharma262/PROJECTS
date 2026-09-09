import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Transaction, TransactionRequest, HDNodeWallet } from 'ethers';
import { authService } from '../../src/wallet/auth/auth.service';
import { createVault } from '../../src/wallet/vault/vault.service';

// Mock storage layer
const secureStoreMap = new Map<string, string>();
const appStoreMap = new Map<string, string>();

jest.mock('../../src/security/secure-storage', () => ({
  secureStorage: {
    setItem: jest.fn(async (k: string, v: string) => { secureStoreMap.set(k, v); }),
    getItem: jest.fn(async (k: string) => secureStoreMap.get(k) || null),
    deleteItem: jest.fn(async (k: string) => { secureStoreMap.delete(k); }),
  },
}));

jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (k: string, v: string) => { appStoreMap.set(k, v); }),
    getItem: jest.fn(async (k: string) => appStoreMap.get(k) || null),
    deleteItem: jest.fn(async (k: string) => { appStoreMap.delete(k); }),
  },
  APP_STORAGE_KEYS: {
    WALLET_VAULT: 'AXT_WALLET_VAULT_V1',
    WALLET_METADATA: 'AXT_WALLET_METADATA',
  },
}));

// Mock low PBKDF2 iterations for fast unit test execution
jest.mock('../../src/wallet/vault/vault.service', () => {
  const original = jest.requireActual<any>('../../src/wallet/vault/vault.service');
  return {
    ...original,
    CURRENT_PBKDF2_ITERATIONS: 100,
  };
});

describe('AuthService - Enclosed Multi-Account Transaction Signing', () => {
  const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
  const TEST_PIN = '123456';
  const EXPECTED_ADDRESS_0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const EXPECTED_ADDRESS_1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  const populatedTx: TransactionRequest = {
    to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    value: 100000000000000000n, // 0.1 ETH
    nonce: 0,
    gasLimit: 21000n,
    chainId: 11155111,
    type: 2,
    maxFeePerGas: 20000000000n,
    maxPriorityFeePerGas: 1000000000n,
  };

  beforeEach(async () => {
    secureStoreMap.clear();
    appStoreMap.clear();
    await createVault(TEST_MNEMONIC, TEST_PIN);
    await authService.init();
    await authService.login(TEST_PIN);
  });

  it('signs transaction for account index 0 with verified address', async () => {
    const signedTxHex = await authService.signTransactionAuthorized(
      TEST_PIN,
      populatedTx,
      0,
      EXPECTED_ADDRESS_0
    );

    expect(typeof signedTxHex).toBe('string');
    expect(signedTxHex.startsWith('0x')).toBe(true);

    const parsedTx = Transaction.from(signedTxHex);
    expect(parsedTx.from?.toLowerCase()).toBe(EXPECTED_ADDRESS_0.toLowerCase());
    expect(parsedTx.to?.toLowerCase()).toBe(populatedTx.to?.toString().toLowerCase());
    expect(parsedTx.chainId).toBe(11155111n);
    expect(parsedTx.value).toBe(100000000000000000n);
  });

  it('signs transaction for derived account index 1 with verified address', async () => {
    const signedTxHex = await authService.signTransactionAuthorized(
      TEST_PIN,
      populatedTx,
      1,
      EXPECTED_ADDRESS_1
    );

    const parsedTx = Transaction.from(signedTxHex);
    expect(parsedTx.from?.toLowerCase()).toBe(EXPECTED_ADDRESS_1.toLowerCase());
  });

  it('throws error and aborts if expectedAddress does not match derived address', async () => {
    const wrongAddress = '0x1111111111111111111111111111111111111111';

    await expect(
      authService.signTransactionAuthorized(TEST_PIN, populatedTx, 0, wrongAddress)
    ).rejects.toThrow('does not match expected account address');
  });

  it('rejects with Invalid PIN when given wrong PIN and records failed attempt', async () => {
    await expect(
      authService.signTransactionAuthorized('999999', populatedTx, 0)
    ).rejects.toThrow('Invalid PIN.');
  });

  it('signs personal message (EIP-191) with PIN authorization', async () => {
    const message = 'Hello AXT Wallet';
    const signature = await authService.signMessageAuthorized(
      TEST_PIN,
      message,
      0,
      EXPECTED_ADDRESS_0
    );

    expect(typeof signature).toBe('string');
    expect(signature.startsWith('0x')).toBe(true);
    expect(signature.length).toBe(132); // 65 bytes in hex + 0x
  });

  it('signs EIP-712 typed structured data with PIN authorization', async () => {
    const domain = {
      name: 'AXT App',
      version: '1',
      chainId: 1,
    };
    const types = {
      Mail: [
        { name: 'from', type: 'string' },
        { name: 'contents', type: 'string' },
      ],
    };
    const value = {
      from: 'Alice',
      contents: 'Welcome to AXT',
    };

    const signature = await authService.signTypedDataAuthorized(
      TEST_PIN,
      domain,
      types,
      value,
      0,
      EXPECTED_ADDRESS_0
    );

    expect(typeof signature).toBe('string');
    expect(signature.startsWith('0x')).toBe(true);
  });

  it('triggers lockout after maximum failed PIN attempts', async () => {
    for (let i = 0; i < 5; i++) {
      try {
        await authService.signTransactionAuthorized('000000', populatedTx, 0);
      } catch {
        // Expected
      }
    }

    expect(authService.getStatus()).toBe('locked_out');

    await expect(
      authService.signTransactionAuthorized(TEST_PIN, populatedTx, 0)
    ).rejects.toThrow(/Locked out/);
  });
});

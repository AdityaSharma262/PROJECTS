import { describe, it, expect } from '@jest/globals';
import { walletConnectSessionService } from '../../src/blockchain/walletconnect/walletconnect.session.service';
import { WCProposal } from '../../src/blockchain/walletconnect/walletconnect.types';
import { ETHEREUM, BASE } from '../../src/blockchain/networks/networks';
import { WalletAccount } from '../../src/wallet/accounts/account.types';

describe('WalletConnectSessionService — Account & Chain Binding', () => {
  const mockAccount: WalletAccount = {
    id: 'acc-2',
    name: 'Account 2',
    address: '0x2222222222222222222222222222222222222222',
    index: 1,
    type: 'hd',
    createdAt: 1700000000,
  };

  const mockProposal: WCProposal = {
    id: 999,
    params: {},
    dApp: {
      name: 'OpenSea',
      url: 'https://opensea.io',
      icons: [],
    },
    requestedChains: [1, 8453],
    requestedMethods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
    requiredNamespaces: {},
    optionalNamespaces: {},
  };

  it('constructs strict account-bound and chain-bound eip155 namespaces', () => {
    const namespaces = walletConnectSessionService.buildNamespaces(
      mockProposal,
      mockAccount,
      [ETHEREUM, BASE]
    );

    expect(namespaces.eip155).toBeDefined();
    expect(namespaces.eip155.chains).toEqual(['eip155:1', 'eip155:8453']);
    expect(namespaces.eip155.accounts).toEqual([
      `eip155:1:${mockAccount.address}`,
      `eip155:8453:${mockAccount.address}`,
    ]);
    expect(namespaces.eip155.methods).toContain('eth_sendTransaction');
    expect(namespaces.eip155.methods).toContain('personal_sign');
    expect(namespaces.eip155.methods).toContain('eth_signTypedData_v4');
    expect(namespaces.eip155.events).toEqual(['chainChanged', 'accountsChanged']);
  });

  it('throws when no approved networks are supplied', () => {
    expect(() =>
      walletConnectSessionService.buildNamespaces(mockProposal, mockAccount, [])
    ).toThrow('At least one supported network must be approved');
  });
});

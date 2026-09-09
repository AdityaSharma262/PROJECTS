import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WalletAccount } from '../wallet/accounts/account.types';
import { accountStorage } from '../storage/account-storage';
import { authService } from '../wallet/auth/auth.service';
import { useAuth } from './AuthContext';

export interface AccountContextValue {
  accounts: WalletAccount[];
  activeAccount: WalletAccount | null;
  isLoading: boolean;
  selectAccount: (accountId: string) => Promise<void>;
  createAccount: (pin: string, customName?: string) => Promise<WalletAccount>;
  importAccount: (pin: string, privateKey: string, customName?: string) => Promise<WalletAccount>;
  deleteAccount: (accountId: string) => Promise<void>;
  renameAccount: (accountId: string, newName: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { status, refreshAuthState } = useAuth();
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<WalletAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // Loads accounts and active account from public storage
  const refreshAccounts = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    refreshPromiseRef.current = (async () => {
      try {
        const storedAccounts = await accountStorage.getAccounts();
        const currentActive = await accountStorage.getActiveAccount();
        setAccounts(storedAccounts);
        setActiveAccount(currentActive);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
        refreshPromiseRef.current = null;
      }
    })();
    return refreshPromiseRef.current;
  }, []);

  // Reload accounts when status changes (e.g. login/unlock triggers migration)
  useEffect(() => {
    refreshAccounts();
  }, [status, refreshAccounts]);

  // Select / Switch active account
  const selectAccount = useCallback(
    async (accountId: string) => {
      const switched = await authService.switchAccount(accountId);
      setActiveAccount(switched);
      await refreshAccounts();
      refreshAuthState();
    },
    [refreshAccounts, refreshAuthState]
  );

  // Create next HD account with PIN authorization
  const createAccount = useCallback(
    async (pin: string, customName?: string): Promise<WalletAccount> => {
      const newAccount = await authService.createAccountAuthorized(pin, customName);
      await refreshAccounts();
      refreshAuthState();
      return newAccount;
    },
    [refreshAccounts, refreshAuthState]
  );

  // Import existing private-key account with PIN authorization
  const importAccount = useCallback(
    async (pin: string, privateKey: string, customName?: string): Promise<WalletAccount> => {
      const newAccount = await authService.importAccountAuthorized(pin, privateKey, customName);
      await refreshAccounts();
      refreshAuthState();
      return newAccount;
    },
    [refreshAccounts, refreshAuthState]
  );

  // Delete account (and remove encrypted vault if imported)
  const deleteAccount = useCallback(
    async (accountId: string) => {
      await authService.deleteAccountAuthorized(accountId);
      await refreshAccounts();
      refreshAuthState();
    },
    [refreshAccounts, refreshAuthState]
  );

  // Rename account
  const renameAccount = useCallback(
    async (accountId: string, newName: string) => {
      await accountStorage.updateAccountName(accountId, newName);
      await refreshAccounts();
    },
    [refreshAccounts]
  );

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        isLoading,
        selectAccount,
        createAccount,
        importAccount,
        deleteAccount,
        renameAccount,
        refreshAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error('useAccount must be used inside AccountProvider');
  }
  return ctx;
}

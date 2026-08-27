import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../wallet/auth/auth.service';
import { AuthStatus, WalletSession } from '../wallet/auth/auth.types';

/**
 * AuthContext exposes only non-sensitive application state:
 * - Wallet address (public key, safe to display)
 * - Authentication status
 *
 * SECURITY RULES (DO NOT VIOLATE):
 * - Never place mnemonic, privateKey, DK, PK, MEK, or PIN into this context.
 * - Never place vault data or decrypted secrets into this context.
 * - The wallet address is a public value and is safe to store/display.
 */
interface AuthContextValue {
  status: AuthStatus;
  session: WalletSession | null;
  /** Re-initialize auth state from services (e.g. after vault creation) */
  refreshAuthState: () => void;
  /** Lock the wallet and clear the session */
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [session, setSession] = useState<WalletSession | null>(null);

  const refreshAuthState = useCallback(() => {
    const newStatus = authService.getStatus();
    const newSession = authService.getSession();
    setStatus(newStatus);
    setSession(newSession);
  }, []);

  const initializeAuth = useCallback(async () => {
    await authService.init();
    refreshAuthState();
  }, [refreshAuthState]);

  const lock = useCallback(() => {
    authService.logout();
    setStatus('locked');
    setSession(null);
  }, []);

  useEffect(() => {
    // On every app mount, treat the wallet as locked — never auto-restore.
    // Wrapped in async IIFE to satisfy react-hooks/set-state-in-effect lint rule.
    (async () => { await initializeAuth(); })();
  }, [initializeAuth]);

  return (
    <AuthContext.Provider value={{ status, session, refreshAuthState, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

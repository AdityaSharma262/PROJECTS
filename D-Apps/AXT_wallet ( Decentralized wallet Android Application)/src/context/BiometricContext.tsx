import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { biometricService } from '../wallet/biometric/biometric.service';
import { BiometricStatus } from '../wallet/biometric/biometric.types';

interface BiometricContextValue {
  biometricStatus: BiometricStatus;
  isLoading: boolean;
  refreshStatus: () => Promise<BiometricStatus>;
  enableBiometrics: (pin: string) => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  authenticate: (promptMessage?: string) => Promise<boolean>;
}

const DEFAULT_STATUS: BiometricStatus = {
  isAvailable: false,
  isEnrolled: false,
  isEnabled: false,
  supportedTypes: [],
  primaryTypeName: 'Face id & FingerPrint',
};

const BiometricContext = createContext<BiometricContextValue | null>(null);

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshStatus = useCallback(async (): Promise<BiometricStatus> => {
    try {
      const status = await biometricService.checkStatus();
      setBiometricStatus(status);
      return status;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const enableBiometrics = useCallback(
    async (pin: string): Promise<boolean> => {
      const success = await biometricService.enable(pin);
      if (success) {
        await refreshStatus();
      }
      return success;
    },
    [refreshStatus]
  );

  const disableBiometrics = useCallback(async (): Promise<void> => {
    await biometricService.disable();
    await refreshStatus();
  }, [refreshStatus]);

  const authenticate = useCallback(
    async (promptMessage?: string): Promise<boolean> => {
      return await biometricService.authenticate(promptMessage);
    },
    []
  );

  return (
    <BiometricContext.Provider
      value={{
        biometricStatus,
        isLoading,
        refreshStatus,
        enableBiometrics,
        disableBiometrics,
        authenticate,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric(): BiometricContextValue {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
}

import * as LocalAuthentication from 'expo-local-authentication';
import { biometricStorage } from '../../storage/biometric-storage';
import { BiometricStatus, BiometricType } from './biometric.types';

export class BiometricService {
  /**
   * Checks the current device hardware capabilities, enrollment, and user preference.
   */
  async checkStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      const isEnabledInStorage = await biometricStorage.isBiometricEnabled();

      const supportedTypesRaw = hasHardware
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];

      const supportedTypes: BiometricType[] = supportedTypesRaw.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'facial_recognition';
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'iris';
          default:
            return 'generic';
        }
      });

      let primaryTypeName = 'Face id & FingerPrint';
      if (supportedTypes.includes('facial_recognition') || supportedTypes.includes('fingerprint')) {
        primaryTypeName = 'Face id & FingerPrint';
      } else if (supportedTypes.includes('iris')) {
        primaryTypeName = 'Iris Recognition';
      } else if (!hasHardware) {
        primaryTypeName = 'Not Available';
      }

      const isEnabled = Boolean(hasHardware && isEnrolled && isEnabledInStorage);

      return {
        isAvailable: hasHardware,
        isEnrolled,
        isEnabled,
        supportedTypes,
        primaryTypeName,
      };
    } catch {
      return {
        isAvailable: false,
        isEnrolled: false,
        isEnabled: false,
        supportedTypes: [],
        primaryTypeName: 'Not Available',
      };
    }
  }

  /**
   * Prompts the user with native OS biometric dialog.
   *
   * @param promptMessage - Message shown in the system biometric dialog
   * @param cancelLabel - Label for cancel action
   */
  async authenticate(
    promptMessage: string = 'Authorize with Face id & FingerPrint',
    cancelLabel: string = 'Cancel'
  ): Promise<boolean> {
    try {
      const status = await this.checkStatus();
      if (!status.isAvailable || !status.isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        disableDeviceFallback: true,
      });

      return result.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Enables biometric unlock by storing the authorized PIN credential in hardware SecureStore.
   */
  async enable(pin: string): Promise<boolean> {
    const status = await this.checkStatus();
    if (!status.isAvailable || !status.isEnrolled) {
      throw new Error('Biometric hardware is not available or not enrolled on this device.');
    }

    await biometricStorage.storeBiometricCredential(pin);
    return true;
  }

  /**
   * Disables biometric unlock and securely deletes stored credentials.
   */
  async disable(): Promise<void> {
    await biometricStorage.clearBiometricStorage();
  }

  /**
   * Retrieves the biometric vault credential from hardware SecureStore.
   */
  async getCredential(): Promise<string | null> {
    const isEnabled = await biometricStorage.isBiometricEnabled();
    if (!isEnabled) return null;
    return await biometricStorage.getBiometricCredential();
  }

  /**
   * Purges all biometric state on wallet reset.
   */
  async clear(): Promise<void> {
    await biometricStorage.clearBiometricStorage();
  }
}

export const biometricService = new BiometricService();

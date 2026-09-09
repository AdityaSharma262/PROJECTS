export type BiometricType =
  | 'fingerprint'
  | 'facial_recognition'
  | 'iris'
  | 'generic'
  | 'none';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  isEnabled: boolean;
  supportedTypes: BiometricType[];
  primaryTypeName: string; // e.g. "Face id & FingerPrint", "Biometric ID"
}

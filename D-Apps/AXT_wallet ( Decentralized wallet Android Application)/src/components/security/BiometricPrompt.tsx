import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useBiometric } from '@/context/BiometricContext';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface BiometricPromptProps {
  onAuthenticate: () => void | Promise<void>;
  onFallbackToPin?: () => void;
  title?: string;
  actionLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  showPinFallback?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BiometricPrompt({
  onAuthenticate,
  onFallbackToPin,
  title,
  actionLabel,
  disabled = false,
  loading = false,
  showPinFallback = false,
  style,
}: BiometricPromptProps) {
  const { biometricStatus } = useBiometric();

  if (!biometricStatus.isEnabled) {
    return null;
  }

  const getIcon = () => {
    if (biometricStatus.supportedTypes.includes('facial_recognition')) {
      return '👤';
    }
    if (biometricStatus.supportedTypes.includes('fingerprint')) {
      return '👆';
    }
    return '🛡️';
  };

  const label =
    actionLabel ||
    (biometricStatus.primaryTypeName === 'Face id & FingerPrint'
      ? 'Authorize with Face id & FingerPrint'
      : biometricStatus.primaryTypeName === 'Face ID'
      ? 'Authorize with Face id & FingerPrint'
      : biometricStatus.primaryTypeName === 'Fingerprint'
      ? 'Authorize with Face id & FingerPrint'
      : `Authorize with ${biometricStatus.primaryTypeName}`);

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}

      <TouchableOpacity
        style={[
          styles.biometricBtn,
          disabled && styles.biometricBtnDisabled,
        ]}
        onPress={onAuthenticate}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.background} size="small" />
        ) : (
          <>
            <Text style={styles.icon}>{getIcon()}</Text>
            <Text style={styles.btnText}>{label}</Text>
          </>
        )}
      </TouchableOpacity>

      {showPinFallback && onFallbackToPin && (
        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={onFallbackToPin}
          disabled={disabled || loading}
        >
          <Text style={styles.fallbackText}>Use PIN Instead</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  title: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
  },
  biometricBtnDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 18,
  },
  btnText: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  fallbackBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  fallbackText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});

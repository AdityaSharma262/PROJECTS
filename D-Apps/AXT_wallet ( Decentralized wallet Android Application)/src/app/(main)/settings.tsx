import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { PinPad } from '@/components/ui/PinPad';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useWalletConnect } from '@/context/WalletConnectContext';
import { useBiometric } from '@/context/BiometricContext';
import { authService } from '@/wallet/auth/auth.service';

import { SwipeableTabScreen } from '@/components/ui/SwipeableTabScreen';

export default function SettingsScreen() {
  const router = useRouter();
  const { lock } = useAuth();
  const { sessions } = useWalletConnect();
  const { biometricStatus, enableBiometrics, disableBiometrics } = useBiometric();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      if (!biometricStatus.isAvailable) {
        Alert.alert(
          'Biometrics Unavailable',
          'Biometric hardware is not available on this device.'
        );
        return;
      }
      if (!biometricStatus.isEnrolled) {
        Alert.alert(
          'No Biometrics Enrolled',
          'Please set up Face id & FingerPrint in your device settings first.'
        );
        return;
      }
      setPinError(null);
      setShowPinModal(true);
    } else {
      await disableBiometrics();
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setIsEnabling(true);
    setPinError(null);

    try {
      // Validate PIN against the vault before enabling
      await authService.login(pin);
      await enableBiometrics(pin);
      setShowPinModal(false);
    } catch (err: any) {
      setPinError('Incorrect PIN. Please try again.');
    } finally {
      setIsEnabling(false);
    }
  };

  const getBiometricIcon = () => {
    if (
      biometricStatus.supportedTypes.includes('facial_recognition') &&
      biometricStatus.supportedTypes.includes('fingerprint')
    ) {
      return '👤 / 👆';
    }
    if (biometricStatus.supportedTypes.includes('facial_recognition')) {
      return '👤';
    }
    if (biometricStatus.supportedTypes.includes('fingerprint')) {
      return '👆';
    }
    return '🛡️';
  };

  return (
    <SwipeableTabScreen rightRoute="/(main)/activity">
      <Screen noSafeArea>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={Typography.title}>Settings</Text>
          </View>

          {/* ── Wallet & Connections ────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet & Connections</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => router.push('/(main)/connected-dapps')}
              >
                <Text style={styles.itemText}>🔗 Connected dApps</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{sessions.length}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Security & Biometrics ──────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => router.push('/(main)/manage-recovery')}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemText}>🔑 Manage Wallet Recovery</Text>
                  <Text style={styles.itemSubtext}>View your secret recovery phrase</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Biometric Toggle Row */}
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemText}>
                    {getBiometricIcon()} {biometricStatus.primaryTypeName} Unlock
                  </Text>
                  <Text style={styles.itemSubtext}>
                    {biometricStatus.isAvailable
                      ? biometricStatus.isEnrolled
                        ? biometricStatus.isEnabled
                          ? 'Enabled for quick unlock and signing'
                          : 'Disabled'
                        : 'Not enrolled in device settings'
                      : 'Hardware not available'}
                  </Text>
                </View>
                <Switch
                  value={biometricStatus.isEnabled}
                  onValueChange={handleToggleBiometrics}
                  disabled={!biometricStatus.isAvailable || !biometricStatus.isEnrolled}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={biometricStatus.isEnabled ? '#fff' : '#888'}
                />
              </View>

              <View style={styles.divider} />
              <Text style={styles.item}>Auto-lock Timer (60s Background)</Text>
            </View>

            {/* Privacy Note */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🔒</Text>
              <Text style={styles.infoText}>
                AXT Wallet uses your device's native hardware security enclave. Your biometric data never leaves your device and is never accessible to AXT Wallet.
              </Text>
            </View>
          </View>

          {/* ── Application Info ───────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => router.push('/(main)/about')}
              >
                <Text style={styles.itemText}>ℹ️ About AXT Wallet</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => router.push('/(main)/terms')}
              >
                <Text style={styles.itemText}>📄 Terms & Conditions</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>Version</Text>
                <Text style={styles.versionText}>1.0.0</Text>
              </View>
            </View>
          </View>

          {/* ── Lock Wallet Button ─────────────────────────── */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.lockButton} onPress={lock}>
              <Text style={styles.lockButtonText}>🔒 Lock Wallet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── PIN Verification Modal for Enabling Biometrics ── */}
        <Modal
          visible={showPinModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!isEnabling) setShowPinModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Verify PIN</Text>
              <Text style={styles.modalSubtitle}>
                {isEnabling
                  ? `Verifying PIN and enabling ${biometricStatus.primaryTypeName}…`
                  : `Enter your current PIN to enable ${biometricStatus.primaryTypeName} authentication.`}
              </Text>

              {isEnabling ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                  <Text style={styles.loadingText}>Validating PIN & enabling…</Text>
                </View>
              ) : (
                <PinPad
                  onComplete={handlePinSubmit}
                  disabled={isEnabling}
                  errorMessage={pinError || undefined}
                />
              )}

              {!isEnabling && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowPinModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </Screen>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.sm,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    overflow: 'hidden',
  },
  item: { ...Typography.body, padding: Spacing.md },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemText: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemSubtext: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    ...Typography.body,
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  versionText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  lockButton: {
    backgroundColor: 'rgba(255,76,76,0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  lockButtonText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  cancelBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});

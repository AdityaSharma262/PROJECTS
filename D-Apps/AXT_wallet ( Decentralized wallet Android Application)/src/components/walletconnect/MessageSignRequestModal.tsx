import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWalletConnect } from '@/context/WalletConnectContext';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { PinPad } from '@/components/ui/PinPad';
import { SignatureAnalysisCard } from '@/components/security/SignatureAnalysisCard';
import { useBiometric } from '@/context/BiometricContext';
import { BiometricPrompt } from '@/components/security/BiometricPrompt';

export function MessageSignRequestModal() {
  const {
    pendingMsgRequest,
    approveMessageRequest,
    approveMessageRequestWithBiometrics,
    rejectMessageRequest,
    clearPendingMsgRequest,
  } = useWalletConnect();

  const { biometricStatus } = useBiometric();

  const [showPinPad, setShowPinPad] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pendingMsgRequest) {
      setShowPinPad(false);
      setPinError(null);
      setIsSubmitting(false);
    }
  }, [pendingMsgRequest]);

  if (!pendingMsgRequest) return null;

  const msg = pendingMsgRequest;

  const handleReject = async () => {
    try {
      await rejectMessageRequest(msg.requestId, 'User rejected signing request');
    } finally {
      clearPendingMsgRequest();
    }
  };

  const handleBiometricSubmit = async () => {
    setIsSubmitting(true);
    setPinError(null);
    try {
      await approveMessageRequestWithBiometrics(msg.requestId);
    } catch (err: any) {
      setPinError(err?.message || 'Biometric authorization failed.');
      setShowPinPad(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setPinError(null);
    setIsSubmitting(true);
    try {
      await approveMessageRequest(msg.requestId, pin);
      setShowPinPad(false);
    } catch (err: any) {
      setPinError(err?.message || 'Invalid PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={!!pendingMsgRequest}
      transparent
      animationType="slide"
      onRequestClose={handleReject}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Signature Request</Text>
            <TouchableOpacity onPress={handleReject} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* dApp Banner */}
            <View style={styles.dAppBanner}>
              <Text style={styles.dAppLabel}>Requesting dApp:</Text>
              <Text style={styles.dAppName}>{msg.dApp.name}</Text>
              <Text style={styles.dAppUrl}>{msg.dApp.url || 'External Application'}</Text>
            </View>

            {/* Structured Security & Signature Analysis */}
            {msg.analysis && (
              <SignatureAnalysisCard
                analysis={msg.analysis}
                network={msg.network}
                accountName={msg.accountName}
              />
            )}

            {/* Biometric Quick Sign */}
            {biometricStatus.isEnabled && (
              <BiometricPrompt
                onAuthenticate={handleBiometricSubmit}
                actionLabel={`Sign with ${biometricStatus.primaryTypeName}`}
                disabled={isSubmitting}
                loading={isSubmitting}
                style={{ marginTop: Spacing.md }}
              />
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.signBtn]}
              onPress={() => setShowPinPad(true)}
            >
              <Text style={styles.signBtnText}>
                {biometricStatus.isEnabled ? 'Authorize with PIN' : 'Approve & Sign'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PIN Authorization Modal */}
        <Modal
          visible={showPinPad}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPinPad(false)}
        >
          <View style={styles.pinOverlay}>
            <View style={styles.pinModal}>
              <Text style={styles.pinTitle}>Enter PIN to Sign</Text>
              <Text style={styles.pinSubtitle}>
                Authorizing signature for {msg.dApp.name}
              </Text>

              {pinError && <Text style={styles.pinErrorText}>⚠️ {pinError}</Text>}

              {isSubmitting ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Signing message…</Text>
                </View>
              ) : (
                <PinPad
                  onComplete={handlePinSubmit}
                  disabled={isSubmitting}
                />
              )}

              <TouchableOpacity
                style={styles.cancelPinBtn}
                onPress={() => setShowPinPad(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelPinText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.xl,
    borderTopRightRadius: Spacing.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  dAppBanner: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  dAppLabel: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dAppName: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  dAppUrl: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  methodBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodBadgeText: {
    color: '#A29BFE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  networkName: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  messageBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  messageLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  messageScroll: {
    maxHeight: 180,
  },
  messageText: {
    ...Typography.body,
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  accountLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  accountValue: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
  },
  securityNotice: {
    backgroundColor: 'rgba(0, 208, 78, 0.08)',
    borderRadius: Spacing.md,
    padding: Spacing.md,
  },
  securityNoticeText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rejectBtnText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  signBtn: {
    backgroundColor: Colors.primary,
  },
  signBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pinModal: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  pinTitle: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  pinSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  pinErrorText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.error || '#FF4D4D',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  loadingBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
  },
  cancelPinBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  cancelPinText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

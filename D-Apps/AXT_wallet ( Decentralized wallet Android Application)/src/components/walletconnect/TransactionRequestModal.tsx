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
import { evmProviderService } from '@/blockchain/providers/provider.service';
import { gasService } from '@/blockchain/transactions/gas.service';
import { TransactionAnalysisCard } from '@/components/security/TransactionAnalysisCard';
import { useBiometric } from '@/context/BiometricContext';
import { BiometricPrompt } from '@/components/security/BiometricPrompt';

export function TransactionRequestModal() {
  const {
    pendingTxRequest,
    approveTransactionRequest,
    approveTransactionRequestWithBiometrics,
    rejectTransactionRequest,
    clearPendingTxRequest,
  } = useWalletConnect();

  const { biometricStatus } = useBiometric();

  const [showPinPad, setShowPinPad] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string>('Estimating…');

  useEffect(() => {
    if (pendingTxRequest) {
      setShowPinPad(false);
      setPinError(null);
      setIsSubmitting(false);

      // Estimate gas fee
      const fetchEstimate = async () => {
        try {
          const provider = evmProviderService.getProvider();
          const est = await gasService.estimateTransactionFee(
            provider,
            pendingTxRequest.from,
            pendingTxRequest.to || pendingTxRequest.from,
            pendingTxRequest.valueWei,
            pendingTxRequest.network,
            pendingTxRequest.data
          );
          setEstimatedFee(est.formattedFee);
        } catch {
          setEstimatedFee('Estimated at broadcast');
        }
      };

      fetchEstimate();
    }
  }, [pendingTxRequest]);

  if (!pendingTxRequest) return null;

  const tx = pendingTxRequest;

  const handleReject = async () => {
    try {
      await rejectTransactionRequest(tx.requestId, 'User rejected transaction');
    } finally {
      clearPendingTxRequest();
    }
  };

  const handleBiometricSubmit = async () => {
    setIsSubmitting(true);
    setPinError(null);
    try {
      await approveTransactionRequestWithBiometrics(tx.requestId);
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
      await approveTransactionRequest(tx.requestId, pin);
      setShowPinPad(false);
    } catch (err: any) {
      setPinError(err?.message || 'Invalid PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={!!pendingTxRequest}
      transparent
      animationType="slide"
      onRequestClose={handleReject}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Review Transaction</Text>
            <TouchableOpacity onPress={handleReject} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* dApp Banner */}
            <View style={styles.dAppBanner}>
              <Text style={styles.dAppLabel}>Requesting dApp:</Text>
              <Text style={styles.dAppName}>{tx.dApp.name}</Text>
              <Text style={styles.dAppUrl}>{tx.dApp.url || 'External Application'}</Text>
            </View>

            {/* Structured Security & Transaction Analysis */}
            {tx.analysis && (
              <TransactionAnalysisCard
                analysis={tx.analysis}
                network={tx.network}
                estimatedFee={estimatedFee}
              />
            )}

            {/* Account Info */}
            <View style={styles.accountCard}>
              <Text style={styles.accountCardLabel}>Signing Account:</Text>
              <Text style={styles.accountCardValue}>
                {tx.accountName} ({tx.from.slice(0, 6)}...{tx.from.slice(-4)})
              </Text>
            </View>

            {/* Biometric Quick Sign */}
            {biometricStatus.isEnabled && (
              <BiometricPrompt
                onAuthenticate={handleBiometricSubmit}
                actionLabel={`Authorize with ${biometricStatus.primaryTypeName}`}
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
              style={[styles.btn, styles.approveBtn]}
              onPress={() => setShowPinPad(true)}
            >
              <Text style={styles.approveBtnText}>
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
              <Text style={styles.pinTitle}>Enter PIN to Authorize</Text>
              <Text style={styles.pinSubtitle}>
                Signing transaction for {tx.dApp.name}
              </Text>

              {pinError && <Text style={styles.pinErrorText}>⚠️ {pinError}</Text>}

              {isSubmitting ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Signing & Broadcasting…</Text>
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
  accountCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountCardLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  accountCardValue: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  valueLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  valueText: {
    ...Typography.title,
    fontSize: 26,
    color: Colors.text,
    marginVertical: 4,
  },
  contractBadge: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  contractBadgeText: {
    color: '#F0A500',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
  },
  detailValueMono: {
    ...Typography.body,
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.text,
  },
  detailValueFee: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  networkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  netDotMainnet: {
    backgroundColor: '#00D04E',
  },
  netDotTestnet: {
    backgroundColor: '#F0A500',
  },
  netDotCustom: {
    backgroundColor: '#6C5CE7',
  },
  calldataBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  calldataLabel: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  calldataText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
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
  approveBtn: {
    backgroundColor: Colors.primary,
  },
  approveBtnText: {
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

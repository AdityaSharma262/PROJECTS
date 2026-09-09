import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { isAddress, formatEther, formatUnits } from 'ethers';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PinPad } from '@/components/ui/PinPad';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useNetwork } from '@/context/NetworkContext';
import { useWalletAssets } from '@/blockchain/hooks/useWalletAssets';
import { useGasEstimate } from '@/blockchain/hooks/useGasEstimate';
import { useSendTransaction } from '@/blockchain/hooks/useSendTransaction';
import { ImportTokenModal } from '@/components/tokens/ImportTokenModal';
import { TokenConfig, WalletAsset } from '@/blockchain/tokens/token.types';
import { trimDecimals } from '@/blockchain/balances/balance.utils';
import { TransactionAnalysisCard } from '@/components/security/TransactionAnalysisCard';
import { useBiometric } from '@/context/BiometricContext';
import { BiometricPrompt } from '@/components/security/BiometricPrompt';
import { formatAddress } from '@/utils/address';



export default function SendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tokenAddress?: string }>();
  const { session } = useAuth();
  const { activeAccount } = useAccount();
  const { activeNetwork } = useNetwork();
  const { biometricStatus } = useBiometric();

  const senderAddress = activeAccount?.address || session?.address;
  const senderIndex = activeAccount?.index ?? 0;

  const {
    assets,
    nativeAsset,
    tokenAssets,
    refresh: refreshAssets,
    importCustomToken,
  } = useWalletAssets(senderAddress, activeNetwork);

  // Selected asset: default to native or route param
  const [selectedAsset, setSelectedAsset] = useState<WalletAsset | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [recipientInput, setRecipientInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Initialize selected asset from params or native
  useEffect(() => {
    if (assets.length === 0) return;

    if (params.tokenAddress && params.tokenAddress !== 'native') {
      const found = assets.find(
        (a) =>
          a.type === 'erc20' &&
          a.tokenConfig?.contractAddress.toLowerCase() ===
            params.tokenAddress?.toLowerCase()
      );
      if (found) {
        setSelectedAsset(found);
        return;
      }
    }

    if (!selectedAsset) {
      setSelectedAsset(nativeAsset || assets[0]);
    } else {
      // Keep current selection updated with latest balance
      const updated = assets.find((a) =>
        a.type === 'native'
          ? selectedAsset.type === 'native'
          : a.tokenConfig?.contractAddress.toLowerCase() ===
            selectedAsset.tokenConfig?.contractAddress.toLowerCase()
      );
      if (updated) setSelectedAsset(updated);
    }
  }, [assets, nativeAsset, params.tokenAddress]);

  const isErc20 = selectedAsset?.type === 'erc20';
  const selectedTokenConfig = selectedAsset?.tokenConfig;

  const {
    feeEstimate,
    isEstimating,
    error: gasError,
    maxSendableUnits,
  } = useGasEstimate(
    senderAddress,
    recipientInput,
    amountInput,
    activeNetwork,
    nativeAsset?.rawBalance,
    selectedTokenConfig,
    selectedAsset?.rawBalance
  );

  const {
    status,
    isBusy,
    txHash,
    txRecord,
    analysis,
    error: sendError,
    startReview,
    cancelReview,
    submitWithPin,
    submitWithBiometrics,
    reset,
  } = useSendTransaction(senderAddress, senderIndex);

  // Biometric submission
  const handleBiometricSubmit = useCallback(async () => {
    const success = await submitWithBiometrics(activeNetwork);
    if (success) {
      refreshAssets();
    }
  }, [submitWithBiometrics, activeNetwork, refreshAssets]);

  // Paste address from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setRecipientInput(text.trim());
      }
    } catch {
      // Clipboard access failure
    }
  }, []);

  // Set maximum sendable amount
  const handleMax = useCallback(() => {
    if (!selectedAsset) return;

    if (isErc20) {
      // For ERC-20: MAX is full token balance
      const formatted = formatUnits(selectedAsset.rawBalance, selectedAsset.decimals);
      setAmountInput(trimDecimals(formatted, 6));
    } else {
      // For Native: MAX is balance minus maximum possible fee
      if (maxSendableUnits > 0n) {
        const formatted = formatEther(maxSendableUnits);
        setAmountInput(trimDecimals(formatted, 6));
      }
    }
  }, [selectedAsset, isErc20, maxSendableUnits]);

  // Open review modal
  const handleProceedToReview = useCallback(() => {
    if (!feeEstimate) return;
    const ok = startReview(
      recipientInput,
      amountInput,
      feeEstimate,
      selectedTokenConfig,
      activeNetwork
    );
    if (ok) {
      // Review step active
    }
  }, [feeEstimate, recipientInput, amountInput, selectedTokenConfig, activeNetwork, startReview]);

  // Submit transaction with PIN
  const handlePinSubmit = useCallback(
    async (pin: string) => {
      setShowPinModal(false);
      const success = await submitWithPin(pin, activeNetwork);
      if (success) {
        refreshAssets();
      }
    },
    [submitWithPin, activeNetwork, refreshAssets]
  );

  const handleOpenExplorer = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const handleSendAnother = useCallback(() => {
    reset();
    setRecipientInput('');
    setAmountInput('');
  }, [reset]);

  const handleImportToken = async (token: TokenConfig) => {
    const res = await importCustomToken(token.contractAddress);
    if (res.success && res.token) {
      // Auto-select imported token
      const newAsset: WalletAsset = {
        type: 'erc20',
        name: res.token.name,
        symbol: res.token.symbol,
        decimals: res.token.decimals,
        rawBalance: 0n,
        formattedBalance: '0.0',
        chainId: activeNetwork.chainId,
        tokenConfig: res.token,
      };
      setSelectedAsset(newAsset);
      setShowAssetPicker(false);
    }
  };

  const isInputValid =
    isAddress(recipientInput.trim()) &&
    amountInput.trim().length > 0 &&
    !isNaN(Number(amountInput)) &&
    Number(amountInput) > 0 &&
    !gasError &&
    feeEstimate !== null;

  // ── SUCCESS BROADCAST SCREEN ──────────────────────────────────────────────
  if (status === 'success' && txHash) {
    const explorerUrl = `${activeNetwork.explorerUrl}/tx/${txHash}`;
    const displaySymbol = selectedAsset?.symbol || activeNetwork.nativeCurrency.symbol;

    return (
      <Screen style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.successScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successWrapper}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Transaction Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Your transaction has been submitted to {activeNetwork.name}.
            </Text>

            <View style={styles.successCard}>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Asset</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>{selectedAsset?.name}</Text>
              </View>

              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Amount</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>
                  {amountInput} {displaySymbol}
                </Text>
              </View>

              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>To</Text>
                <Text style={styles.successRowValue} numberOfLines={1}>{formatAddress(recipientInput)}</Text>
              </View>

              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Tx Hash</Text>
                <Text style={styles.successRowHash} numberOfLines={1}>{formatAddress(txHash)}</Text>
              </View>

              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Status</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pending Confirmation</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.explorerButton}
              onPress={() => handleOpenExplorer(explorerUrl)}
            >
              <Text style={styles.explorerButtonText}>View on Block Explorer ↗</Text>
            </TouchableOpacity>

            <View style={styles.successActionButtons}>
              <Button
                title="Send Another"
                variant="secondary"
                onPress={handleSendAnother}
                style={styles.actionBtn}
              />
              <Button
                title="Back to Wallet"
                onPress={() => router.replace('/(main)')}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // ── MAIN SEND FORM ────────────────────────────────────────────────────────
  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Send Crypto</Text>

          <View style={styles.networkBadge}>
            <View style={[styles.networkDot, activeNetwork.isTestnet && styles.networkDotTestnet]} />
            <Text style={styles.networkBadgeText}>{activeNetwork.shortName}</Text>
          </View>
        </View>

        {/* ── Asset Selector Card ────────────────────────────── */}
        <Text style={styles.inputLabel}>Asset</Text>
        <TouchableOpacity
          style={styles.assetSelectorCard}
          onPress={() => setShowAssetPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.assetSelectorLeft}>
            <View style={[styles.assetIcon, isErc20 ? styles.tokenIcon : styles.nativeIcon]}>
              <Text style={styles.assetIconText}>
                {selectedAsset?.symbol.slice(0, 3) || 'ETH'}
              </Text>
            </View>
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.assetSelectorName}>{selectedAsset?.name || 'Ethereum'}</Text>
                {selectedTokenConfig?.isCustom && (
                  <View style={styles.customTag}>
                    <Text style={styles.customTagText}>Custom</Text>
                  </View>
                )}
              </View>
              <Text style={styles.assetSelectorBalance}>
                Balance: {selectedAsset?.formattedBalance || '0.00'} {selectedAsset?.symbol}
              </Text>
            </View>
          </View>

          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>

        {/* ── Recipient Input ────────────────────────────────── */}
        <Text style={styles.inputLabel}>Recipient Address</Text>
        <View style={styles.recipientRow}>
          <View style={styles.inputFlex}>
            <Input
              value={recipientInput}
              onChangeText={setRecipientInput}
              placeholder="0x... EVM address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        </View>

        {/* ── Amount Input ──────────────────────────────────── */}
        <View style={styles.amountLabelRow}>
          <Text style={styles.inputLabel}>Amount</Text>
          <Text style={styles.availableBalanceText}>
            Avail: {selectedAsset?.formattedBalance || '0.00'} {selectedAsset?.symbol}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <View style={styles.inputFlex}>
            <Input
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder="0.0"
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
            <Text style={styles.maxText}>MAX</Text>
          </TouchableOpacity>
        </View>

        {/* ── Fee Estimation Card ────────────────────────────── */}
        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Network Fee ({activeNetwork.nativeCurrency.symbol})</Text>
            {isEstimating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : feeEstimate ? (
              <Text style={styles.feeValue}>{feeEstimate.formattedFee}</Text>
            ) : (
              <Text style={styles.feePlaceholder}>—</Text>
            )}
          </View>

          {feeEstimate && (
            <View style={styles.feeSubRow}>
              <Text style={styles.feeSubLabel}>
                Max Fee: {feeEstimate.formattedMaxFee} ({feeEstimate.feeModel.toUpperCase()})
              </Text>
            </View>
          )}

          {isErc20 && feeEstimate && (
            <View style={styles.erc20GasNotice}>
              <Text style={styles.erc20GasNoticeText}>
                ℹ️ Network fee is paid in {activeNetwork.nativeCurrency.symbol}.
              </Text>
            </View>
          )}
        </View>

        {/* Validation Errors */}
        {gasError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{gasError}</Text>
          </View>
        )}

        {sendError && status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{sendError}</Text>
          </View>
        )}

        {/* ── Proceed Button ─────────────────────────────────── */}
        <View style={styles.bottomSection}>
          <Button
            title="Review Transaction"
            onPress={handleProceedToReview}
            disabled={!isInputValid || isBusy}
            style={styles.reviewButton}
          />
        </View>
      </ScrollView>

      {/* ── Asset Selection Modal ────────────────────────────── */}
      <Modal
        visible={showAssetPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssetPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Asset to Send</Text>
              <TouchableOpacity onPress={() => setShowAssetPicker(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.assetList}>
              {assets.map((asset) => {
                const isSelected =
                  selectedAsset?.symbol === asset.symbol &&
                  selectedAsset?.type === asset.type;
                return (
                  <TouchableOpacity
                    key={asset.tokenConfig?.contractAddress || asset.symbol}
                    style={[styles.assetOption, isSelected && styles.assetOptionSelected]}
                    onPress={() => {
                      setSelectedAsset(asset);
                      setShowAssetPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.assetOptionLeft}>
                      <View
                        style={[
                          styles.assetIcon,
                          asset.type === 'native' ? styles.nativeIcon : styles.tokenIcon,
                        ]}
                      >
                        <Text style={styles.assetIconText}>
                          {asset.symbol.slice(0, 3)}
                        </Text>
                      </View>
                      <View>
                        <View style={styles.nameRow}>
                          <Text style={styles.assetOptionName}>{asset.name}</Text>
                          {asset.tokenConfig?.isCustom && (
                            <View style={styles.customTag}>
                              <Text style={styles.customTagText}>Custom</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.assetOptionSymbol}>{asset.symbol}</Text>
                      </View>
                    </View>

                    <Text style={styles.assetOptionBalance}>
                      {asset.formattedBalance} {asset.symbol}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.pickerImportAction}
              onPress={() => {
                setShowAssetPicker(false);
                setShowImportModal(true);
              }}
            >
              <Text style={styles.pickerImportActionText}>+ Import Custom Token</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Custom Token Import Modal ────────────────────────── */}
      <ImportTokenModal
        visible={showImportModal}
        network={activeNetwork}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportToken}
      />

      {/* ── Review Transaction Modal ─────────────────────────── */}
      <Modal
        visible={status === 'reviewing'}
        transparent
        animationType="slide"
        onRequestClose={cancelReview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContainer}>
            <Text style={styles.reviewModalTitle}>Confirm Transaction</Text>
            <Text style={styles.reviewModalSubtitle}>
              Please review all transfer details carefully.
            </Text>

            {analysis ? (
              <TransactionAnalysisCard
                analysis={analysis}
                network={activeNetwork}
                estimatedFee={feeEstimate?.formattedFee}
              />
            ) : (
              <>
                <View style={styles.reviewAmountCard}>
                  <Text style={styles.reviewAmountLabel}>You are sending</Text>
                  <Text style={styles.reviewAmountValue}>
                    {amountInput} {selectedAsset?.symbol}
                  </Text>
                  <Text style={styles.reviewAssetName}>{selectedAsset?.name}</Text>
                </View>

                <View style={styles.reviewDetailsCard}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewRowLabel}>Network</Text>
                    <Text style={styles.reviewRowValue}>{activeNetwork.name}</Text>
                  </View>

                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewRowLabel}>Recipient</Text>
                    <Text style={styles.reviewRowValue}>{formatAddress(recipientInput)}</Text>
                  </View>

                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewRowLabel}>Estimated Gas Fee</Text>
                    <Text style={styles.reviewRowValue}>{feeEstimate?.formattedFee}</Text>
                  </View>

                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewRowLabel}>Max Possible Fee</Text>
                    <Text style={styles.reviewRowValue}>{feeEstimate?.formattedMaxFee}</Text>
                  </View>

                  {isErc20 && (
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewRowLabel}>Gas Token</Text>
                      <Text style={styles.reviewRowValue}>
                        {activeNetwork.nativeCurrency.symbol} (Native)
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {biometricStatus.isEnabled && (
              <BiometricPrompt
                onAuthenticate={handleBiometricSubmit}
                actionLabel={`Authorize with ${biometricStatus.primaryTypeName}`}
                disabled={isBusy}
                loading={isBusy}
                style={{ marginTop: Spacing.sm }}
              />
            )}

            <View style={styles.reviewActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={cancelReview}
                style={styles.reviewCancelBtn}
              />
              <Button
                title={biometricStatus.isEnabled ? "Authorize with PIN" : "Confirm & Authorize"}
                onPress={() => setShowPinModal(true)}
                style={styles.reviewConfirmBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PIN Entry Authorization Sheet ────────────────────── */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pinModalContainer}>
            <Text style={styles.pinTitle}>Enter PIN to Authorize</Text>
            <Text style={styles.pinSubtitle}>
              Decrypts vault and signs {amountInput} {selectedAsset?.symbol} transfer.
            </Text>

            <PinPad
              onComplete={handlePinSubmit}
              disabled={isBusy}
            />

            <TouchableOpacity
              style={styles.pinCancelButton}
              onPress={() => setShowPinModal(false)}
              disabled={isBusy}
            >
              <Text style={styles.pinCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Busy Signing / Broadcasting Overlay ──────────────── */}
      {isBusy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.busyText}>
            {status === 'revalidating' && 'Revalidating live network fees & nonce...'}
            {status === 'signing' && 'Authorizing & signing transaction...'}
            {status === 'broadcasting' && 'Broadcasting transaction to blockchain...'}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: Colors.text,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D04E',
  },
  networkDotTestnet: {
    backgroundColor: '#F0A500',
  },
  networkBadgeText: {
    ...Typography.body,
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
  },
  inputLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  assetSelectorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  assetSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  nativeIcon: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  tokenIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: Colors.border,
  },
  assetIconText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetSelectorName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
  },
  customTag: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  customTagText: {
    color: '#F0A500',
    fontSize: 9,
    fontWeight: 'bold',
  },
  assetSelectorBalance: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  selectorArrow: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  inputFlex: {
    flex: 1,
  },
  pasteButton: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pasteText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  availableBalanceText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  maxButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  feeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  feeValue: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
    fontSize: 13,
  },
  feePlaceholder: {
    color: Colors.textSecondary,
  },
  feeSubRow: {
    marginTop: 6,
  },
  feeSubLabel: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  erc20GasNotice: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  erc20GasNoticeText: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.error || '#FF4D4D',
    fontSize: 13,
  },
  bottomSection: {
    marginTop: Spacing.md,
  },
  reviewButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pickerTitle: {
    ...Typography.title,
    fontSize: 18,
  },
  closeIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  assetList: {
    marginBottom: Spacing.md,
  },
  assetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assetOptionSelected: {
    backgroundColor: 'rgba(0, 208, 78, 0.08)',
    borderRadius: Spacing.sm,
  },
  assetOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  assetOptionName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
  },
  assetOptionSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  assetOptionBalance: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.text,
  },
  pickerImportAction: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pickerImportActionText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewModalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  reviewModalTitle: {
    ...Typography.title,
    fontSize: 20,
    textAlign: 'center',
  },
  reviewModalSubtitle: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  reviewAmountCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  reviewAmountLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewAmountValue: {
    ...Typography.title,
    fontSize: 26,
    color: Colors.primary,
    marginVertical: 4,
  },
  reviewAssetName: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reviewDetailsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewRowLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reviewRowValue: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reviewCancelBtn: {
    flex: 1,
  },
  reviewConfirmBtn: {
    flex: 1.5,
  },
  pinModalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  pinTitle: {
    ...Typography.title,
    fontSize: 18,
    textAlign: 'center',
  },
  pinSubtitle: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  pinCancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pinCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  busyText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
    fontSize: 14,
  },
  successScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successWrapper: {
    width: '100%',
    maxWidth: 460,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    alignSelf: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successCheckmark: {
    fontSize: 36,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  successTitle: {
    ...Typography.title,
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  successCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successRowLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  successRowValue: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 13,
    color: Colors.text,
  },
  successRowHash: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  pendingBadge: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: '#F0A500',
    fontSize: 11,
    fontWeight: 'bold',
  },
  explorerButton: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  explorerButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  successActionButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});

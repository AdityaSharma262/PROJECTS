import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { isAddress } from 'ethers';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spacing, Typography, Colors } from '../../constants/theme';
import { evmProviderService } from '../../blockchain/providers/provider.service';
import { tokenService } from '../../blockchain/tokens/token.service';
import { TokenConfig } from '../../blockchain/tokens/token.types';
import { NetworkConfig } from '../../blockchain/networks/network.types';
import { TokenIcon } from './TokenIcon';

interface ImportTokenModalProps {
  visible: boolean;
  network: NetworkConfig;
  onClose: () => void;
  onImport: (token: TokenConfig) => Promise<void>;
}

export function ImportTokenModal({
  visible,
  network,
  onClose,
  onImport,
}: ImportTokenModalProps) {
  const [addressInput, setAddressInput] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedToken, setInspectedToken] = useState<TokenConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setAddressInput(text.trim());
      }
    } catch {
      // Ignore
    }
  }, []);

  const resetState = useCallback(() => {
    setAddressInput('');
    setIsInspecting(false);
    setInspectedToken(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Inspect address automatically when a valid address is entered
  useEffect(() => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      setInspectedToken(null);
      setError(null);
      return;
    }

    if (!isAddress(trimmed)) {
      setInspectedToken(null);
      setError('Please enter a valid 42-character EVM address.');
      return;
    }

    let isCurrent = true;
    setError(null);
    setIsInspecting(true);

    const timer = setTimeout(async () => {
      try {
        if (!evmProviderService.isConnected()) {
          await evmProviderService.initialize(network);
        }
        const provider = evmProviderService.getProvider();
        const result = await tokenService.fetchTokenMetadata(
          provider,
          trimmed,
          network.chainId
        );

        if (!isCurrent) return;

        if (result.success && result.token) {
          setInspectedToken(result.token);
          setError(null);
        } else {
          setInspectedToken(null);
          setError(result.error || 'Unable to find contract on this network.');
        }
      } catch (err: any) {
        if (!isCurrent) return;
        setInspectedToken(null);
        setError(err?.message || 'Failed to inspect token contract.');
      } finally {
        if (isCurrent) {
          setIsInspecting(false);
        }
      }
    }, 400);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [addressInput, network]);

  const handleConfirmImport = async () => {
    if (!inspectedToken || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onImport(inspectedToken);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Import Custom Token</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.networkTag}>
              <View style={styles.networkDot} />
              <Text style={styles.networkName}>Network: {network.name}</Text>
            </View>

            <Text style={styles.label}>Token Contract Address</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <Input
                  value={addressInput}
                  onChangeText={setAddressInput}
                  placeholder="0x..."
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
                <Text style={styles.pasteText}>Paste</Text>
              </TouchableOpacity>
            </View>

            {isInspecting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Inspecting token contract on-chain...</Text>
              </View>
            )}

            {error && !isInspecting && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {inspectedToken && !isInspecting && (
              <View style={styles.tokenPreview}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <TokenIcon
                    symbol={inspectedToken.symbol}
                    name={inspectedToken.name}
                    tokenConfig={inspectedToken}
                    size={36}
                  />
                  <Text style={styles.previewHeading}>Token Details Found</Text>
                </View>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Name:</Text>
                  <Text style={styles.previewValue}>{inspectedToken.name}</Text>
                </View>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Symbol:</Text>
                  <Text style={styles.previewValue}>{inspectedToken.symbol}</Text>
                </View>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Decimals:</Text>
                  <Text style={styles.previewValue}>{inspectedToken.decimals}</Text>
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={isSubmitting ? 'Importing...' : 'Import Token'}
                onPress={handleConfirmImport}
                disabled={!inspectedToken || isInspecting || isSubmitting}
                style={styles.importButton}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
  },
  closeIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  networkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: Spacing.lg,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0A500',
  },
  networkName: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  label: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputWrapper: {
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error || '#FF4D4D',
    fontSize: 13,
  },
  tokenPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewHeading: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.primary,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  previewValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    fontSize: 13,
  },
  buttonContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  importButton: {
    width: '100%',
  },
});

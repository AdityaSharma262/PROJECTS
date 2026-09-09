import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { isAddress } from 'ethers';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spacing, Typography, Colors } from '../../constants/theme';
import { evmProviderService } from '../../blockchain/providers/provider.service';
import { nftService } from '../../blockchain/nft/nft.service';
import { NFTItem } from '../../blockchain/nft/nft.types';
import { NetworkConfig } from '../../blockchain/networks/network.types';
import { getNftCompositeId } from '../../storage/nft-storage';

interface ImportNftModalProps {
  visible: boolean;
  network: NetworkConfig;
  ownerAddress: string;
  existingNfts: NFTItem[];
  onClose: () => void;
  onImport: (nft: NFTItem) => Promise<void>;
}

export function ImportNftModal({
  visible,
  network,
  ownerAddress,
  existingNfts,
  onClose,
  onImport,
}: ImportNftModalProps) {
  const [contractAddress, setContractAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedNft, setInspectedNft] = useState<NFTItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePasteContract = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setContractAddress(text.trim());
    } catch {
      // Ignore
    }
  }, []);

  const handlePasteTokenId = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setTokenId(text.trim());
    } catch {
      // Ignore
    }
  }, []);

  const resetState = useCallback(() => {
    setContractAddress('');
    setTokenId('');
    setIsInspecting(false);
    setInspectedNft(null);
    setError(null);
    setIsSubmitting(false);
    setImageError(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleInspect = async () => {
    const cleanContract = contractAddress.trim();
    const cleanId = tokenId.trim();

    if (!cleanContract) {
      setError('Please enter a contract address.');
      return;
    }
    if (!isAddress(cleanContract)) {
      setError('Please enter a valid 42-character EVM contract address.');
      return;
    }
    if (!cleanId) {
      setError('Please enter a Token ID.');
      return;
    }

    // Check duplicate import
    const compositeId = getNftCompositeId(network.chainId, cleanContract, cleanId);
    if (existingNfts.some((n) => n.id.toLowerCase() === compositeId.toLowerCase())) {
      setError('This NFT is already imported into your wallet.');
      return;
    }

    setError(null);
    setIsInspecting(true);
    setInspectedNft(null);
    setImageError(false);

    try {
      if (!evmProviderService.isConnected() || evmProviderService.getActiveNetwork()?.chainId !== network.chainId) {
        await evmProviderService.initialize(network);
      }
      const provider = evmProviderService.getProvider();

      const result = await nftService.inspectNft(
        provider,
        cleanContract,
        cleanId,
        ownerAddress,
        network.chainId
      );

      if (result.success && result.nft) {
        setInspectedNft(result.nft);
      } else {
        setError(result.error || 'NFT verification failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Inspection failed. Please verify details and network.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!inspectedNft) return;

    setIsSubmitting(true);
    try {
      await onImport(inspectedNft);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to import NFT.');
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
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Import NFT</Text>
                <Text style={styles.networkBadge}>
                  on {network.name} (Chain ID: {network.chainId})
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Contract Address Input */}
              <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Contract Address</Text>
                  <TouchableOpacity onPress={handlePasteContract}>
                    <Text style={styles.pasteText}>Paste</Text>
                  </TouchableOpacity>
                </View>
                <Input
                  value={contractAddress}
                  onChangeText={(text) => {
                    setContractAddress(text);
                    setInspectedNft(null);
                    setError(null);
                  }}
                  placeholder="0x..."
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Token ID Input */}
              <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Token ID</Text>
                  <TouchableOpacity onPress={handlePasteTokenId}>
                    <Text style={styles.pasteText}>Paste</Text>
                  </TouchableOpacity>
                </View>
                <Input
                  value={tokenId}
                  onChangeText={(text) => {
                    setTokenId(text);
                    setInspectedNft(null);
                    setError(null);
                  }}
                  placeholder="e.g. 1, 42, 108"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Inspect Button */}
              {!inspectedNft && (
                <Button
                  title={isInspecting ? 'Verifying on-chain…' : 'Find & Verify NFT'}
                  onPress={handleInspect}
                  disabled={isInspecting || !contractAddress || !tokenId}
                  loading={isInspecting}
                  style={styles.findBtn}
                />
              )}

              {/* Error Callout */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Preview Card */}
              {inspectedNft && (
                <View style={styles.previewCard}>
                  <View style={styles.previewImageContainer}>
                    {inspectedNft.imageUrl && !imageError ? (
                      <Image
                        source={{ uri: inspectedNft.imageUrl }}
                        style={styles.previewImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <View style={styles.previewPlaceholder}>
                        <Text style={styles.previewPlaceholderIcon}>🖼️</Text>
                      </View>
                    )}
                    <View style={styles.previewStandardBadge}>
                      <Text style={styles.previewStandardText}>
                        {inspectedNft.standard}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewDetails}>
                    <Text style={styles.previewCollection} numberOfLines={1}>
                      {inspectedNft.collectionName}
                    </Text>
                    <Text style={styles.previewName} numberOfLines={2}>
                      {inspectedNft.name}
                    </Text>

                    <View style={styles.verifiedRow}>
                      <Text style={styles.verifiedBadge}>✓ Ownership Verified</Text>
                      {inspectedNft.standard === 'ERC-1155' && inspectedNft.balance && (
                        <Text style={styles.balanceText}>
                          Balance: {inspectedNft.balance}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            {inspectedNft && (
              <View style={styles.actionRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleClose}
                  style={styles.actionBtn}
                  disabled={isSubmitting}
                />
                <Button
                  title={isSubmitting ? 'Importing…' : 'Import NFT'}
                  onPress={handleConfirmImport}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.actionBtn}
                />
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.xl,
    borderTopRightRadius: Spacing.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
  },
  networkBadge: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pasteText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  findBtn: {
    marginVertical: Spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 76, 0.3)',
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    fontSize: 13,
    flex: 1,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  previewImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderIcon: {
    fontSize: 48,
  },
  previewStandardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewStandardText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  previewDetails: {
    padding: Spacing.md,
  },
  previewCollection: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewName: {
    ...Typography.body,
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  balanceText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});

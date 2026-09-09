import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { NFTItem } from '../../blockchain/nft/nft.types';
import { NetworkConfig } from '../../blockchain/networks/network.types';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Button } from '../ui/Button';

interface NftDetailModalProps {
  nft: NFTItem | null;
  network: NetworkConfig;
  onClose: () => void;
  onRemove: (contractAddress: string, tokenId: string) => Promise<void>;
}

export function NftDetailModal({
  nft,
  network,
  onClose,
  onRemove,
}: NftDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!nft) return null;

  const handleCopyContract = async () => {
    await Clipboard.setStringAsync(nft.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExplorer = () => {
    if (!network.explorerUrl) return;
    const base = network.explorerUrl.replace(/\/+$/, '');
    const url = `${base}/token/${nft.contractAddress}?a=${nft.tokenId}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleConfirmRemove = () => {
    Alert.alert(
      'Remove NFT Reference',
      'This only removes the NFT from your local wallet display. It does not affect on-chain ownership.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await onRemove(nft.contractAddress, nft.tokenId);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={!!nft}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.collectionTitle} numberOfLines={1}>
                {nft.collectionName}
              </Text>
              <Text style={styles.networkSubtext}>on {network.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Image Preview */}
            <View style={styles.imageContainer}>
              {nft.imageUrl && !imageError ? (
                <Image
                  source={{ uri: nft.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>🖼️</Text>
                </View>
              )}
              <View style={styles.standardBadge}>
                <Text style={styles.standardBadgeText}>{nft.standard}</Text>
              </View>
            </View>

            {/* Title & Token ID */}
            <View style={styles.titleSection}>
              <Text style={styles.nftName}>{nft.name || `#${nft.tokenId}`}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>Token ID: #{nft.tokenId}</Text>
                </View>
                {nft.standard === 'ERC-1155' && nft.balance && (
                  <View style={styles.balanceBadge}>
                    <Text style={styles.balanceBadgeText}>Owned: {nft.balance}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Contract Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>Contract Address</Text>
              <View style={styles.addressRow}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {nft.contractAddress}
                </Text>
                <TouchableOpacity onPress={handleCopyContract} style={styles.copyBtn}>
                  <Text style={styles.copyText}>{copied ? '✓ Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
              {network.explorerUrl && (
                <TouchableOpacity
                  onPress={handleOpenExplorer}
                  style={styles.explorerBtn}
                >
                  <Text style={styles.explorerText}>↗ View on Block Explorer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Description */}
            {Boolean(nft.description) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{nft.description}</Text>
              </View>
            )}

            {/* Attributes / Traits */}
            {nft.attributes && nft.attributes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attributes & Traits</Text>
                <View style={styles.traitsGrid}>
                  {nft.attributes.map((attr, idx) => (
                    <View key={idx} style={styles.traitCard}>
                      <Text style={styles.traitType} numberOfLines={1}>
                        {attr.trait_type}
                      </Text>
                      <Text style={styles.traitValue} numberOfLines={1}>
                        {attr.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Remove from Wallet Button */}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleConfirmRemove}
            >
              <Text style={styles.removeBtnText}>🗑️ Remove NFT from Wallet</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.xl,
    borderTopRightRadius: Spacing.xl,
    padding: Spacing.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  collectionTitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  networkSubtext: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.primary,
    marginTop: 1,
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
    paddingBottom: Spacing.xl,
  },
  imageContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#000',
    borderRadius: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  standardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  standardBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  nftName: {
    ...Typography.title,
    fontSize: 22,
    color: Colors.text,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  idBadge: {
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  balanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  balanceBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoCardLabel: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addressText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    fontFamily: 'monospace',
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderRadius: 4,
  },
  copyText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  explorerBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  explorerText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  traitCard: {
    backgroundColor: 'rgba(0, 208, 78, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.25)',
    borderRadius: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: '45%',
    flexGrow: 1,
  },
  traitType: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  traitValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: 'bold',
    marginTop: 2,
  },
  removeBtn: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 76, 0.4)',
    backgroundColor: 'rgba(255, 76, 76, 0.08)',
    alignItems: 'center',
  },
  removeBtnText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: 'bold',
    fontSize: 13,
  },
});

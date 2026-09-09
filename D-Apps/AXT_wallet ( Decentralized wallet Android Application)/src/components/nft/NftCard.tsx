import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { NFTItem } from '../../blockchain/nft/nft.types';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface NftCardProps {
  nft: NFTItem;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function NftCard({ nft, onPress, style }: NftCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Thumbnail Container */}
      <View style={styles.imageContainer}>
        {nft.imageUrl && !imageError ? (
          <Image
            source={{ uri: nft.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
          </View>
        )}

        {/* Standard Badge */}
        <View style={styles.standardBadge}>
          <Text style={styles.standardBadgeText}>{nft.standard}</Text>
        </View>

        {/* Balance Badge for ERC-1155 */}
        {nft.standard === 'ERC-1155' && nft.balance && nft.balance !== '1' && (
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceBadgeText}>x{nft.balance}</Text>
          </View>
        )}
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Text style={styles.collectionName} numberOfLines={1}>
          {nft.collectionName}
        </Text>
        <Text style={styles.nftName} numberOfLines={1}>
          {nft.name || `#${nft.tokenId}`}
        </Text>
        <View style={styles.idRow}>
          <Text style={styles.tokenIdLabel}>ID:</Text>
          <Text style={styles.tokenIdText} numberOfLines={1}>
            #{nft.tokenId}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    width: '100%',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    fontSize: 40,
    opacity: 0.6,
  },
  standardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  standardBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  balanceBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: Spacing.md,
  },
  collectionName: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nftName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokenIdLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tokenIdText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useNetwork } from '@/context/NetworkContext';
import { useWalletAssets } from '@/blockchain/hooks/useWalletAssets';
import { useWalletNfts } from '@/blockchain/hooks/useWalletNfts';
import { ImportTokenModal } from '@/components/tokens/ImportTokenModal';
import { ImportNftModal } from '@/components/nft/ImportNftModal';
import { NftDetailModal } from '@/components/nft/NftDetailModal';
import { NftCard } from '@/components/nft/NftCard';
import { useNativeTokenPrice } from '@/blockchain/hooks/useNativeTokenPrice';
import { useTokenPrices } from '@/blockchain/hooks/useTokenPrices';
import { priceService } from '@/blockchain/prices/price.service';
import { TokenConfig } from '@/blockchain/tokens/token.types';
import { NFTItem } from '@/blockchain/nft/nft.types';
import { Button } from '@/components/ui/Button';
import { SwipeableTabScreen } from '@/components/ui/SwipeableTabScreen';
import { TokenIcon } from '@/components/tokens/TokenIcon';

type TabType = 'tokens' | 'nfts';

export default function AssetsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { activeAccount } = useAccount();
  const { activeNetwork } = useNetwork();
  
  const targetAddress = activeAccount?.address || session?.address;

  // Active Tab: Tokens | NFTs
  const [activeTab, setActiveTab] = useState<TabType>('tokens');

  // Tokens hook
  const {
    assets,
    nativeAsset,
    tokenAssets,
    status: tokenStatus,
    refresh: refreshTokens,
    importCustomToken,
  } = useWalletAssets(targetAddress, activeNetwork);

  // Native price hook
  const { price: nativeUnitPrice, refresh: refreshNativePrice } =
    useNativeTokenPrice(activeNetwork);

  // Token prices hook
  const tokensList = React.useMemo(
    () =>
      tokenAssets
        .map((a) => a.tokenConfig)
        .filter(Boolean) as TokenConfig[],
    [tokenAssets]
  );
  const {
    getFormattedHoldingUsd,
    refresh: refreshTokensPrices,
  } = useTokenPrices(tokensList, activeNetwork);

  // Native holding USD calculation
  const nativeHoldingUsd = priceService.calculateHoldingUsdValue(
    nativeAsset?.formattedBalance || '0',
    nativeUnitPrice
  );
  const nativeHoldingUsdDisplay = priceService.formatUsdValue(nativeHoldingUsd);

  // NFTs hook
  const {
    nfts,
    ownedNfts,
    status: nftStatus,
    refresh: refreshNfts,
    importNft,
    removeNft,
  } = useWalletNfts(targetAddress, activeNetwork);

  const [importTokenModalVisible, setImportTokenModalVisible] = useState(false);
  const [importNftModalVisible, setImportNftModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoading =
    (activeTab === 'tokens' ? tokenStatus === 'loading' : nftStatus === 'loading') &&
    !isRefreshing;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'tokens') {
        await Promise.all([
          refreshTokens(),
          refreshNativePrice(),
          refreshTokensPrices(),
        ]);
      } else {
        await refreshNfts();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, refreshTokens, refreshNativePrice, refreshTokensPrices, refreshNfts]);

  const handleImportToken = async (token: TokenConfig) => {
    await importCustomToken(token.contractAddress);
  };

  const handleImportNft = async (nft: NFTItem) => {
    await importNft(nft);
  };

  const handleAssetPress = (symbol: string, contractAddress?: string) => {
    router.push({
      pathname: '/actions/send',
      params: contractAddress ? { tokenAddress: contractAddress } : { tokenAddress: 'native' },
    });
  };

  return (
    <SwipeableTabScreen rightRoute="/(main)" leftRoute="/(main)/activity">
      <Screen style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={Typography.title}>Assets</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {activeTab === 'tokens'
                ? `${assets.length} ${assets.length === 1 ? 'token' : 'tokens'}`
                : `${ownedNfts.length} ${ownedNfts.length === 1 ? 'NFT' : 'NFTs'}`}{' '}
              on {activeNetwork.shortName}
            </Text>
          </View>

          <View style={styles.networkTag}>
            <View style={[styles.networkDot, activeNetwork.isTestnet && styles.networkDotTestnet]} />
            <Text style={styles.networkTagText} numberOfLines={1}>{activeNetwork.name}</Text>
          </View>
        </View>

        {/* ── Tab Switcher (Tokens vs NFTs) ──────────────────────── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tokens' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tokens')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'tokens' && styles.tabButtonTextActive]}>
              🪙 Tokens ({assets.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'nfts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('nfts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'nfts' && styles.tabButtonTextActive]}>
              🖼️ NFTs ({ownedNfts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TOKENS TAB CONTENT ─────────────────────────────────── */}
        {activeTab === 'tokens' && (
          <>
            {/* Native Asset Card */}
            {nativeAsset && (
              <TouchableOpacity
                style={styles.assetCard}
                onPress={() => handleAssetPress(nativeAsset.symbol)}
                activeOpacity={0.7}
              >
                <View style={styles.assetInfo}>
                  <TokenIcon
                    symbol={nativeAsset.symbol}
                    name={nativeAsset.name}
                    isNative
                    size={40}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.assetName} numberOfLines={1}>{nativeAsset.name}</Text>
                      <View style={styles.nativeBadge}>
                        <Text style={styles.nativeBadgeText}>Native</Text>
                      </View>
                    </View>
                    <Text style={styles.assetSymbol} numberOfLines={1}>{nativeAsset.symbol}</Text>
                  </View>
                </View>

                <View style={styles.assetBalance}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Text style={styles.assetBalanceAmount} numberOfLines={1}>
                        {nativeAsset.formattedBalance} {nativeAsset.symbol}
                      </Text>
                      {!activeNetwork.isTestnet && nativeUnitPrice !== null && (
                        <Text style={styles.assetUsdAmount} numberOfLines={1}>
                          ≈ {nativeHoldingUsdDisplay}
                        </Text>
                      )}
                    </>
                  )}
                  <Text style={styles.assetNetwork}>{activeNetwork.shortName}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Section Title: ERC-20 Tokens */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tokens</Text>
              <TouchableOpacity
                style={styles.importAction}
                onPress={() => setImportTokenModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.importActionText}>+ Import Token</Text>
              </TouchableOpacity>
            </View>

            {/* Token Cards */}
            {tokenAssets.map((tokenItem) => {
              const formattedHoldingUsd = tokenItem.tokenConfig
                ? getFormattedHoldingUsd(tokenItem.tokenConfig, tokenItem.formattedBalance)
                : '—';

              return (
                <TouchableOpacity
                  key={tokenItem.tokenConfig?.contractAddress || tokenItem.symbol}
                  style={styles.assetCard}
                  onPress={() =>
                    handleAssetPress(tokenItem.symbol, tokenItem.tokenConfig?.contractAddress)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.assetInfo}>
                    <TokenIcon
                      symbol={tokenItem.symbol}
                      name={tokenItem.name}
                      tokenConfig={tokenItem.tokenConfig}
                      size={40}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.assetName} numberOfLines={1}>{tokenItem.name}</Text>
                        {tokenItem.tokenConfig?.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.assetSymbol} numberOfLines={1}>{tokenItem.symbol}</Text>
                    </View>
                  </View>

                  <View style={styles.assetBalance}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <Text style={styles.assetBalanceAmount} numberOfLines={1}>
                          {tokenItem.formattedBalance} {tokenItem.symbol}
                        </Text>
                        {!activeNetwork.isTestnet && formattedHoldingUsd !== '—' && (
                          <Text style={styles.assetUsdAmount} numberOfLines={1}>
                            ≈ {formattedHoldingUsd}
                          </Text>
                        )}
                      </>
                    )}
                    <Text style={styles.assetNetwork}>{activeNetwork.shortName}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {tokenAssets.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tokens found</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setImportTokenModalVisible(true)}
                >
                  <Text style={styles.emptyButtonText}>+ Import Custom Token</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── NFTS TAB CONTENT ───────────────────────────────────── */}
        {activeTab === 'nfts' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>NFT Collectibles</Text>
              <TouchableOpacity
                style={styles.importAction}
                onPress={() => setImportNftModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.importActionText}>+ Import NFT</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading NFTs…</Text>
              </View>
            ) : ownedNfts.length > 0 ? (
              <View style={styles.nftGrid}>
                {ownedNfts.map((nftItem) => (
                  <NftCard
                    key={nftItem.id}
                    nft={nftItem}
                    onPress={() => setSelectedNft(nftItem)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🖼️</Text>
                <Text style={styles.emptyTitle}>No NFTs in Wallet</Text>
                <Text style={styles.emptyText}>
                  Import your ERC-721 or ERC-1155 collectibles to view them here.
                </Text>
                <Button
                  title="+ Import NFT"
                  onPress={() => setImportNftModalVisible(true)}
                  style={{ marginTop: Spacing.md }}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Modals ────────────────────────────────────────────── */}
      <ImportTokenModal
        visible={importTokenModalVisible}
        network={activeNetwork}
        onClose={() => setImportTokenModalVisible(false)}
        onImport={handleImportToken}
      />

      <ImportNftModal
        visible={importNftModalVisible}
        network={activeNetwork}
        ownerAddress={targetAddress || ''}
        existingNfts={nfts}
        onClose={() => setImportNftModalVisible(false)}
        onImport={handleImportNft}
      />

      <NftDetailModal
        nft={selectedNft}
        network={activeNetwork}
        onClose={() => setSelectedNft(null)}
        onRemove={removeNft}
      />
    </Screen>
  </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  networkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    flexShrink: 1,
    maxWidth: '45%',
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  networkDotTestnet: {
    backgroundColor: '#F0A500',
  },
  networkTagText: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Spacing.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  tabButtonText: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    color: Colors.text,
  },
  importAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  importActionText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeIcon: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  assetIconText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tokenIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenIconText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 11,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetName: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
    fontSize: 15,
  },
  nativeBadge: {
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nativeBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  customBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  assetSymbol: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  assetBalance: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  assetBalanceAmount: {
    ...Typography.body,
    fontWeight: 'bold',
    color: Colors.text,
    fontSize: 14,
  },
  assetUsdAmount: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 1,
  },
  assetNetwork: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 208, 78, 0.08)',
  },
  emptyButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  nftGrid: {
    width: '100%',
  },
});

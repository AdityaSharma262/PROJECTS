import { transactionHistoryService } from '@/blockchain/history/history.service';
import { UnifiedTransactionRecord } from '@/blockchain/history/history.types';
import { priceService } from '@/blockchain/prices/price.service';
import { useTokenPrices } from '@/blockchain/hooks/useTokenPrices';
import { TokenConfig } from '@/blockchain/tokens/token.types';
import { useNativeTokenPrice } from '@/blockchain/hooks/useNativeTokenPrice';
import { useWalletAssets } from '@/blockchain/hooks/useWalletAssets';
import { AccountSelectorModal } from '@/components/accounts/AccountSelectorModal';
import { NetworkSelectorModal } from '@/components/networks/NetworkSelectorModal';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAccount } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { formatAddress } from '@/utils/address';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PairingInputModal } from '@/components/walletconnect/PairingInputModal';
import { SwipeableTabScreen } from '@/components/ui/SwipeableTabScreen';
import { TokenIcon } from '@/components/tokens/TokenIcon';
import { ChainIcon } from '@/components/networks/ChainIcon';



function formatBalance(formatted: string): string {
  // Trim to 6 decimal places for display
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  return num.toFixed(6).replace(/\.?0+$/, '');
}

export default function WalletHome() {
  const router = useRouter();
  const { session, lock } = useAuth();
  const { activeAccount } = useAccount();
  const { activeNetwork } = useNetwork();
  const { price: nativeUnitPrice, displayText: nativePriceDisplay, refresh: refreshPrice } =
    useNativeTokenPrice(activeNetwork);

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentTxs, setRecentTxs] = useState<UnifiedTransactionRecord[]>([]);

  const targetAddress = activeAccount?.address || session?.address;

  const {
    assets,
    nativeAsset,
    tokenAssets,
    status,
    error,
    refresh,
  } = useWalletAssets(targetAddress, activeNetwork);

  // Derive tokens list for price resolution
  const tokensList = useMemo(
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

  // Calculate live native USD holding value
  const nativeHoldingUsd = priceService.calculateHoldingUsdValue(
    nativeAsset?.formattedBalance || '0',
    nativeUnitPrice
  );
  const nativeHoldingUsdDisplay = priceService.formatUsdValue(nativeHoldingUsd);

  const loadRecentTxs = useCallback(async () => {
    if (!targetAddress) return;
    try {
      const result = await transactionHistoryService.getUnifiedHistory(
        targetAddress,
        activeNetwork,
        1,
        3
      );
      setRecentTxs(result.records.slice(0, 3));
    } catch {
      // Ignore
    }
  }, [targetAddress, activeNetwork]);

  useEffect(() => {
    loadRecentTxs();
  }, [loadRecentTxs]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refresh(),
        refreshPrice(),
        refreshTokensPrices(),
        loadRecentTxs(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, refreshPrice, refreshTokensPrices, loadRecentTxs]);

  const displayAddress = targetAddress ? formatAddress(targetAddress) : '—';
  const accountName = activeAccount?.name || 'Account 1';
  const accountIndexDisplay =
    activeAccount?.type === 'imported'
      ? '🔑'
      : activeAccount
      ? `${(activeAccount.index ?? 0) + 1}`
      : '1';
  const isLoading = (status === 'loading' || status === 'idle') && !isRefreshing;

  return (
    <SwipeableTabScreen leftRoute="/(main)/assets">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
      {/* ── Top Header ───────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.addressPill}
            onPress={() => setShowAccountModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{accountIndexDisplay}</Text>
            </View>
            <View style={{ gap: 1, flexShrink: 1, maxWidth: 130 }}>
              <Text style={styles.accountPillName} numberOfLines={1}>{accountName}</Text>
              <Text style={styles.addressText} numberOfLines={1}>{displayAddress}</Text>
            </View>
            <Text style={styles.copyIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {/* Network badge — tappable to open full network management modal */}
          <TouchableOpacity
            style={styles.networkBadge}
            onPress={() => setShowNetworkModal(true)}
            activeOpacity={0.75}
          >
            <ChainIcon network={activeNetwork} size={14} />
            <Text style={styles.networkBadgeText} numberOfLines={1}>{activeNetwork.shortName}</Text>
            <Text style={styles.networkBadgeArrow}>▼</Text>
          </TouchableOpacity>

          {/* WalletConnect button */}
          <TouchableOpacity
            style={styles.lockButton}
            onPress={() => setShowPairingModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.lockIcon}>🔗</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lockButton}
            onPress={lock}
            activeOpacity={0.7}
          >
            <Text style={styles.lockIcon}>🔒</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Account Selector Modal ───────────────────────── */}
      <AccountSelectorModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />

      {/* ── Network Selector Modal ───────────────────────── */}
      <NetworkSelectorModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
      />

      {/* ── WalletConnect Pairing Input Modal ───────────── */}
      <PairingInputModal
        visible={showPairingModal}
        onClose={() => setShowPairingModal(false)}
      />

      {/* ── Balance Card ────────────────────────────────── */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Native Balance</Text>

        {isLoading && (
          <View style={styles.balanceLoadingRow}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.balanceLoadingText}>Fetching balances…</Text>
          </View>
        )}

        {!isLoading && nativeAsset && (
          <>
            <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatBalance(nativeAsset.formattedBalance)}
            </Text>
            <Text style={styles.balanceSymbol}>{nativeAsset.symbol}</Text>
            {!activeNetwork.isTestnet && nativeUnitPrice !== null && (
              <Text style={styles.balanceUsdValue} numberOfLines={1}>
                ≈ {nativeHoldingUsdDisplay} USD
              </Text>
            )}
            <Text style={styles.balanceUpdated} numberOfLines={1}>
              {nativePriceDisplay}
            </Text>
          </>
        )}

        {status === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Action Buttons ──────────────────────────────── */}
      <View style={styles.actionsContainer}>
        <Button
          title="Send"
          onPress={() => router.push('/actions/send')}
          style={styles.actionButton}
        />
        <Button
          title="Receive"
          variant="secondary"
          onPress={() => router.push('/actions/receive')}
          style={styles.actionButton}
        />
      </View>

      {/* ── Assets / Tokens ─────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={Typography.subtitle}>Tokens/Assets</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/assets')}>
            <Text style={styles.viewAllText}>View All ({assets.length})</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Native Token Always at the Top */}
        {nativeAsset && (
          <TouchableOpacity
            style={styles.assetCard}
            onPress={() => router.push('/(main)/assets')}
            activeOpacity={0.7}
          >
            <View style={styles.assetInfo}>
              <TokenIcon
                symbol={nativeAsset.symbol}
                name={nativeAsset.name}
                isNative
                size={40}
              />
              <View style={styles.assetDetails}>
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
                <ActivityIndicator color={Colors.primary} size="small" />
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
              <Text style={styles.assetNetwork} numberOfLines={1}>{activeNetwork.shortName}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 2. All Imported / Active ERC-20 Tokens */}
        {tokenAssets.map((tokenItem) => {
          const formattedHoldingUsd = tokenItem.tokenConfig
            ? getFormattedHoldingUsd(tokenItem.tokenConfig, tokenItem.formattedBalance)
            : '—';

          return (
            <TouchableOpacity
              key={tokenItem.tokenConfig?.contractAddress || tokenItem.symbol}
              style={styles.assetCard}
              onPress={() => router.push('/(main)/assets')}
              activeOpacity={0.7}
            >
              <View style={styles.assetInfo}>
                <TokenIcon
                  symbol={tokenItem.symbol}
                  name={tokenItem.name}
                  tokenConfig={tokenItem.tokenConfig}
                  size={40}
                />
                <View style={styles.assetDetails}>
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
                  <ActivityIndicator color={Colors.primary} size="small" />
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
                <Text style={styles.assetNetwork} numberOfLines={1}>{activeNetwork.shortName}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Recent Activity ─────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={Typography.subtitle}>Recent Activity</Text>
          {recentTxs.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(main)/activity')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTxs.length === 0 ? (
          <Text style={styles.emptyState}>No transactions yet</Text>
        ) : (
          recentTxs.map((tx) => {
            const isIncoming = tx.direction === 'incoming';
            const isSelf = tx.direction === 'self';
            const isPending = tx.status === 'pending';
            const isFailed = tx.status === 'failed';

            const counterparty = isIncoming
              ? `From: ${formatAddress(tx.from)}`
              : `To: ${formatAddress(tx.to)}`;

            const title = isSelf
              ? `Self-Transfer ${tx.assetSymbol}`
              : isIncoming
                ? `Received ${tx.assetSymbol}`
                : `Sent ${tx.assetSymbol}`;

            const cleanAmount = (tx.formattedAmount || '0')
              .replace(new RegExp(`\\s*${tx.assetSymbol}$`, 'i'), '')
              .trim();

            const amountDisplay = isSelf
              ? `${cleanAmount} ${tx.assetSymbol}`
              : isIncoming
                ? `+${cleanAmount} ${tx.assetSymbol}`
                : `-${cleanAmount} ${tx.assetSymbol}`;

            return (
              <TouchableOpacity
                key={tx.id || tx.hash}
                style={styles.recentTxCard}
                onPress={() => tx.explorerUrl && Linking.openURL(tx.explorerUrl)}
                activeOpacity={0.7}
              >
                <View style={styles.recentTxLeft}>
                  <View
                    style={[
                      styles.recentTxIcon,
                      isIncoming && { backgroundColor: 'rgba(0, 208, 78, 0.12)', borderColor: 'rgba(0, 208, 78, 0.3)' },
                      isSelf && { backgroundColor: 'rgba(0, 153, 255, 0.12)', borderColor: 'rgba(0, 153, 255, 0.3)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentTxIconText,
                        isIncoming && { color: Colors.primary },
                        isSelf && { color: '#3399FF' },
                      ]}
                    >
                      {isSelf ? '⇄' : isIncoming ? '↓' : '↑'}
                    </Text>
                  </View>
                  <View style={styles.recentTxDetails}>
                    <Text style={styles.recentTxTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.recentTxAddress} numberOfLines={1}>{counterparty}</Text>
                  </View>
                </View>
                <View style={styles.recentTxRight}>
                  <Text
                    style={[
                      styles.recentTxAmount,
                      isIncoming && { color: Colors.primary },
                      isFailed && { color: Colors.error, textDecorationLine: 'line-through' },
                    ]}
                    numberOfLines={1}
                  >
                    {amountDisplay}
                  </Text>
                  <Text
                    style={[
                      styles.recentTxStatus,
                      isPending && { color: '#F0A500' },
                      tx.status === 'confirmed' && { color: Colors.primary },
                      isFailed && { color: Colors.error },
                    ]}
                    numberOfLines={1}
                  >
                    {isPending ? '⏳ Pending' : tx.status === 'confirmed' ? '✓ Confirmed' : '✕ Failed'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    flexShrink: 1,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,208,78,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  accountPillName: {
    ...Typography.body,
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addressText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  copyIcon: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginLeft: 2,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.primary,
  },
  address: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },

  // Network Badge
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  networkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#888',
  },
  networkDotTestnet: {
    backgroundColor: '#F0A500',
  },
  networkBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 65,
  },
  networkBadgeArrow: {
    color: Colors.textSecondary,
    fontSize: 8,
  },
  lockButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 13,
  },

  // Network Picker
  networkPicker: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  networkOptionActive: {
    backgroundColor: 'rgba(0,208,78,0.07)',
  },
  networkOptionName: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 13,
  },
  networkOptionSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  networkOptionDetails: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  networkOptionCheck: {
    color: Colors.primary,
    fontSize: 16,
    marginLeft: 'auto',
  },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 140,
    justifyContent: 'center',
  },
  balanceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontSize: 13,
  },
  balanceAmount: {
    color: Colors.text,
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  balanceSymbol: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
  },
  balanceUsdValue: {
    ...Typography.subtitle,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  balanceUpdated: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  balanceLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  balanceLoadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    fontSize: 13,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: { flex: 1 },

  // Assets
  section: { marginBottom: Spacing.xl },
  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  assetDetails: {
    flex: 1,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,208,78,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,208,78,0.3)',
    flexShrink: 0,
  },
  tokenAssetIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: Colors.border,
  },
  assetIconText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tokenIconText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
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
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  assetBalance: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  assetBalanceAmount: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
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
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  emptyState: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  recentTxCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentTxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  recentTxDetails: {
    flex: 1,
  },
  recentTxIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,208,78,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,208,78,0.2)',
    flexShrink: 0,
  },
  recentTxIconText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentTxTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 13,
    color: Colors.text,
  },
  recentTxAddress: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  recentTxRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  recentTxAmount: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 13,
    color: Colors.text,
  },
  recentTxStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});


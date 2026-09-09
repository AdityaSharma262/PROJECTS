import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';

import { Screen } from '@/components/ui/Screen';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useNetwork } from '@/context/NetworkContext';
import {
  useTransactionHistory,
  HistoryFilter,
} from '@/blockchain/hooks/useTransactionHistory';
import { UnifiedTransactionRecord } from '@/blockchain/history/history.types';
import { SwipeableTabScreen } from '@/components/ui/SwipeableTabScreen';
import { formatAddress } from '@/utils/address';



export default function ActivityScreen() {
  const { session } = useAuth();
  const { activeAccount } = useAccount();
  const { activeNetwork } = useNetwork();

  const targetAddress = activeAccount?.address || session?.address;

  const {
    filteredTransactions,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    filter,
    setFilter,
    error,
    refresh,
    loadMore,
  } = useTransactionHistory(targetAddress, activeNetwork);

  const filterTabs: { key: HistoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'incoming', label: 'Incoming ↓' },
    { key: 'outgoing', label: 'Outgoing ↑' },
    { key: 'tokens', label: 'Tokens 🪙' },
  ];

  const renderTransactionItem = ({ item }: { item: UnifiedTransactionRecord }) => {
    const isIncoming = item.direction === 'incoming';
    const isSelf = item.direction === 'self';
    const isPending = item.status === 'pending';
    const isFailed = item.status === 'failed';

    const counterparty = isIncoming
      ? `From: ${formatAddress(item.from)}`
      : `To: ${formatAddress(item.to)}`;

    const title = isSelf
      ? `Self-Transfer ${item.assetSymbol}`
      : isIncoming
      ? `Received ${item.assetSymbol}`
      : `Sent ${item.assetSymbol}`;

    const cleanAmount = (item.formattedAmount || '0')
      .replace(new RegExp(`\\s*${item.assetSymbol}$`, 'i'), '')
      .trim();

    const formattedAmountDisplay = isSelf
      ? `${cleanAmount} ${item.assetSymbol}`
      : isIncoming
      ? `+${cleanAmount} ${item.assetSymbol}`
      : `-${cleanAmount} ${item.assetSymbol}`;

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => {
          if (item.explorerUrl) {
            Linking.openURL(item.explorerUrl).catch(() => {});
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.txLeft}>
          <View
            style={[
              styles.iconCircle,
              isIncoming && styles.iconCircleIncoming,
              isSelf && styles.iconCircleSelf,
            ]}
          >
            <Text
              style={[
                styles.iconText,
                isIncoming && styles.iconTextIncoming,
                isSelf && styles.iconTextSelf,
              ]}
            >
              {isSelf ? '⇄' : isIncoming ? '↓' : '↑'}
            </Text>
          </View>

          <View style={styles.txDetails}>
            <View style={styles.titleRow}>
              <Text style={styles.txTitle} numberOfLines={1}>{title}</Text>
              {item.assetType === 'erc20' && (
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>Token</Text>
                </View>
              )}
            </View>
            <Text style={styles.txAddress} numberOfLines={1}>{counterparty}</Text>
            <Text style={styles.txDate} numberOfLines={1}>
              {new Date(item.timestamp).toLocaleDateString()} •{' '}
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              isIncoming && styles.txAmountIncoming,
              isFailed && styles.txAmountFailed,
            ]}
            numberOfLines={1}
          >
            {formattedAmountDisplay}
          </Text>

          <View
            style={[
              styles.statusBadge,
              isPending && styles.statusBadgePending,
              item.status === 'confirmed' && styles.statusBadgeConfirmed,
              isFailed && styles.statusBadgeFailed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isPending && styles.statusTextPending,
                item.status === 'confirmed' && styles.statusTextConfirmed,
                isFailed && styles.statusTextFailed,
              ]}
              numberOfLines={1}
            >
              {isPending
                ? '⏳ Pending'
                : item.status === 'confirmed'
                ? '✓ Confirmed'
                : '✕ Failed'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerLoaderText}>Loading older transactions…</Text>
      </View>
    );
  };

  return (
    <SwipeableTabScreen rightRoute="/(main)/assets" leftRoute="/(main)/settings">
      <Screen style={styles.container}>
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={Typography.title}>Activity</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            On-Chain History for {activeNetwork.shortName}
          </Text>
        </View>

        <View style={styles.networkTag}>
          <View
            style={[
              styles.networkDot,
              activeNetwork.isTestnet && styles.networkDotTestnet,
            ]}
          />
          <Text style={styles.networkTagText} numberOfLines={1}>{activeNetwork.name}</Text>
        </View>
      </View>

      {/* ── Filter Tabs ───────────────────────────────────────── */}
      <View style={{ marginBottom: Spacing.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Transaction List ──────────────────────────────────── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Discovering on-chain activity…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? `No on-chain activity detected on ${activeNetwork.name} yet.`
                  : `No ${filter} transactions found for this account.`}
              </Text>
            </View>
          }
        />
      )}
      </Screen>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  networkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  networkTagText: {
    ...Typography.body,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl * 2,
  },
  txCard: {
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
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconCircleIncoming: {
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  iconCircleSelf: {
    backgroundColor: 'rgba(0, 153, 255, 0.12)',
    borderColor: 'rgba(0, 153, 255, 0.3)',
  },
  iconText: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: 'bold',
  },
  iconTextIncoming: {
    color: Colors.primary,
  },
  iconTextSelf: {
    color: '#3399FF',
  },
  txDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  txTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
    flexShrink: 1,
  },
  tokenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    flexShrink: 0,
  },
  tokenBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  txAddress: {
    ...Typography.body,
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txDate: {
    ...Typography.body,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  txAmount: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  txAmountIncoming: {
    color: Colors.primary,
  },
  txAmountFailed: {
    color: Colors.error || '#FF4D4D',
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
  },
  statusBadgeConfirmed: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
  },
  statusBadgeFailed: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusTextPending: {
    color: '#F0A500',
  },
  statusTextConfirmed: {
    color: Colors.primary,
  },
  statusTextFailed: {
    color: Colors.error || '#FF4D4D',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  footerLoaderText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  emptyState: {
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.text,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

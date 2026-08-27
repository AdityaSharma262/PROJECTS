import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useWalletBalance } from '@/blockchain/hooks/useWalletBalance';
import { SUPPORTED_NETWORKS, NetworkConfig } from '@/blockchain/networks';
import * as Clipboard from 'expo-clipboard';

function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(formatted: string): string {
  // Trim to 6 decimal places for display
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  return num.toFixed(6).replace(/\.?0+$/, '');
}

export default function WalletHome() {
  const router = useRouter();
  const { session, lock } = useAuth();

  const [activeNetwork, setActiveNetworkConfig] = useState<NetworkConfig>(SUPPORTED_NETWORKS[0]);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { balance, status, error, refresh } = useWalletBalance(
    session?.address,
    activeNetwork
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refresh();
    // Pull-to-refresh visual reset (balance hook handles actual loading)
    setTimeout(() => setIsRefreshing(false), 1500);
  }, [refresh]);

  const displayAddress = session?.address ? formatAddress(session.address) : '—';
  const isLoading = status === 'connecting' || status === 'loading';

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>AXT Wallet</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={[styles.address, { marginTop: 0 }]}>{displayAddress}</Text>
            {session?.address && (
              <TouchableOpacity 
                onPress={async () => await Clipboard.setStringAsync(session.address)}
                style={{ marginLeft: Spacing.xs, padding: 2 }}
                activeOpacity={0.6}
              >
                <Text style={{ fontSize: 12 }}>📋</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* Network badge — tappable to switch networks */}
          <TouchableOpacity
            style={styles.networkBadge}
            onPress={() => setShowNetworkPicker(prev => !prev)}
            activeOpacity={0.75}
          >
            <View style={[styles.networkDot, activeNetwork.isTestnet && styles.networkDotTestnet]} />
            <Text style={styles.networkBadgeText}>{activeNetwork.shortName}</Text>
            <Text style={styles.networkBadgeArrow}>▼</Text>
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

      {/* ── Network Picker Dropdown ─────────────────────── */}
      {showNetworkPicker && (
        <View style={styles.networkPicker}>
          {SUPPORTED_NETWORKS.map(net => (
            <TouchableOpacity
              key={net.chainId}
              style={[
                styles.networkOption,
                net.chainId === activeNetwork.chainId && styles.networkOptionActive,
              ]}
              onPress={() => {
                setActiveNetworkConfig(net);
                setShowNetworkPicker(false);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.networkDot, net.isTestnet && styles.networkDotTestnet]} />
              <View>
                <Text style={styles.networkOptionName}>{net.name}</Text>
                <Text style={styles.networkOptionSymbol}>{net.nativeCurrency.symbol}</Text>
              </View>
              {net.chainId === activeNetwork.chainId && (
                <Text style={styles.networkOptionCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Balance Card ────────────────────────────────── */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Native Balance</Text>

        {isLoading && (
          <View style={styles.balanceLoadingRow}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.balanceLoadingText}>Fetching balance…</Text>
          </View>
        )}

        {status === 'success' && balance && (
          <>
            <Text style={styles.balanceAmount}>
              {formatBalance(balance.formatted)}
            </Text>
            <Text style={styles.balanceSymbol}>{balance.symbol}</Text>
            <Text style={styles.balanceUpdated}>
              Updated {new Date(balance.lastUpdatedAt).toLocaleTimeString()}
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

        {status === 'idle' && (
          <Text style={styles.balanceLoadingText}>Connecting…</Text>
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

      {/* ── Assets ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={Typography.subtitle}>Assets</Text>
        <View style={styles.assetCard}>
          <View style={styles.assetInfo}>
            <View style={styles.assetIcon}>
              <Text style={styles.assetIconText}>
                {activeNetwork.nativeCurrency.symbol.slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={styles.assetName}>{activeNetwork.nativeCurrency.name}</Text>
              <Text style={styles.assetSymbol}>{activeNetwork.nativeCurrency.symbol}</Text>
            </View>
          </View>
          <View style={styles.assetBalance}>
            {isLoading
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : (
                <Text style={styles.assetBalanceAmount}>
                  {status === 'success' && balance
                    ? `${formatBalance(balance.formatted)} ${balance.symbol}`
                    : '—'}
                </Text>
              )
            }
            <Text style={styles.assetNetwork}>{activeNetwork.shortName}</Text>
          </View>
        </View>
      </View>

      {/* ── Recent Activity ─────────────────────────────── */}
      <View style={styles.section}>
        <Text style={Typography.subtitle}>Recent Activity</Text>
        <Text style={styles.emptyState}>No transactions yet</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
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
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
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
    fontSize: 12,
    fontWeight: '600',
  },
  networkBadgeArrow: {
    color: Colors.textSecondary,
    fontSize: 9,
  },
  lockButton: {
    padding: 4,
  },
  lockIcon: {
    fontSize: 20,
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
  balanceUpdated: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: Spacing.sm,
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
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  },
  assetIconText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  assetName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
  },
  assetSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  assetBalance: { alignItems: 'flex-end' },
  assetBalanceAmount: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 13,
  },
  assetNetwork: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
  },

  emptyState: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

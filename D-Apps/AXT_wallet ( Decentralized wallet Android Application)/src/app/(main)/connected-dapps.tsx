import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useWalletConnect } from '@/context/WalletConnectContext';
import { useNetwork } from '@/context/NetworkContext';
import { PairingInputModal } from '@/components/walletconnect/PairingInputModal';
import { WCSession } from '@/blockchain/walletconnect';

export default function ConnectedDAppsScreen() {
  const router = useRouter();
  const { sessions, disconnectSession, revokeAllSessions, refreshSessions } = useWalletConnect();
  const { allNetworks } = useNetwork();

  const [showPairingModal, setShowPairingModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSessions();
    setIsRefreshing(false);
  };

  const handleDisconnectSession = (session: WCSession) => {
    Alert.alert(
      'Disconnect dApp',
      `Are you sure you want to disconnect from ${session.peer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectSession(session.topic);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to disconnect.');
            }
          },
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    Alert.alert(
      'Revoke All Sessions',
      'Are you sure you want to disconnect all connected dApps? You will need to reconnect to them individually.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeAllSessions();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to revoke sessions.');
            }
          },
        },
      ]
    );
  };

  const getNetworkName = (chainId: number): string => {
    const found = allNetworks.find((n) => n.chainId === chainId);
    return found ? found.name : `Chain ${chainId}`;
  };

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.navigate('/(main)/settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connected dApps</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowPairingModal(true)}
        >
          <Text style={styles.addBtnText}>+ Connect</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔗</Text>
            <Text style={styles.emptyTitle}>No Connected dApps</Text>
            <Text style={styles.emptyText}>
              Connect your AXT Wallet to Web3 dApps on desktop or mobile to sign transactions securely.
            </Text>
            <TouchableOpacity
              style={styles.connectPrimaryBtn}
              onPress={() => setShowPairingModal(true)}
            >
              <Text style={styles.connectPrimaryBtnText}>Connect to dApp</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.sectionSubtitle}>
              Active Sessions ({sessions.length})
            </Text>

            {sessions.map((session) => {
              const iconUri = session.peer.icons?.[0] || null;

              return (
                <View key={session.topic} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionLeft}>
                      <View style={styles.dAppIconWrapper}>
                        {iconUri ? (
                          <Image source={{ uri: iconUri }} style={styles.dAppIcon} />
                        ) : (
                          <Text style={styles.dAppIconPlaceholder}>🌐</Text>
                        )}
                      </View>
                      <View style={styles.dAppDetails}>
                        <Text style={styles.dAppName} numberOfLines={1}>{session.peer.name}</Text>
                        <Text style={styles.dAppUrl} numberOfLines={1}>{session.peer.url || 'External dApp'}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.disconnectBtn}
                      onPress={() => handleDisconnectSession(session)}
                    >
                      <Text style={styles.disconnectBtnText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Connected Account & Chains Info */}
                  <View style={styles.infoRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeLabel}>Account:</Text>
                      <Text style={styles.badgeValue} numberOfLines={1}>
                        {session.approvedAccountName} (
                        {session.approvedAccount.slice(0, 6)}...
                        {session.approvedAccount.slice(-4)})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chainsContainer}>
                    <Text style={styles.chainsLabel}>Approved Networks:</Text>
                    <View style={styles.chainChipsRow}>
                      {session.approvedChainIds.map((chainId) => (
                        <View key={chainId} style={styles.chainChip}>
                          <Text style={styles.chainChipText}>
                            {getNetworkName(chainId)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Revoke All Sessions Button */}
            <TouchableOpacity style={styles.revokeAllBtn} onPress={handleRevokeAll}>
              <Text style={styles.revokeAllText}>🗑️ Revoke All Sessions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Pairing Input Modal */}
      <PairingInputModal
        visible={showPairingModal}
        onClose={() => setShowPairingModal(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 24,
    lineHeight: 26,
    textAlign: 'center',
    marginTop: -2,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
  },
  addBtn: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Spacing.md,
  },
  addBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  sectionSubtitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  list: {
    gap: Spacing.md,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  dAppIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dAppIcon: {
    width: 44,
    height: 44,
  },
  dAppIconPlaceholder: {
    fontSize: 20,
  },
  dAppDetails: {
    flex: 1,
  },
  dAppName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.text,
  },
  dAppUrl: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  disconnectBtn: {
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Spacing.sm,
  },
  disconnectBtnText: {
    color: Colors.error || '#FF4D4D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.sm,
  },
  badgeLabel: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  badgeValue: {
    ...Typography.body,
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
  },
  chainsContainer: {
    marginTop: 2,
  },
  chainsLabel: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  chainChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chainChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chainChipText: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.text,
  },
  revokeAllBtn: {
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.25)',
    borderRadius: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  revokeAllText: {
    color: Colors.error || '#FF4D4D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
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
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  connectPrimaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
  },
  connectPrimaryBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

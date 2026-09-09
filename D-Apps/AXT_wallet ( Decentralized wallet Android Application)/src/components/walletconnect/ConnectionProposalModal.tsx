import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useWalletConnect } from '@/context/WalletConnectContext';
import { useAccount } from '@/context/AccountContext';
import { useNetwork } from '@/context/NetworkContext';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { WalletAccount } from '@/wallet/accounts/account.types';
import { NetworkConfig } from '@/blockchain/networks/network.types';

export function ConnectionProposalModal() {
  const { pendingProposal, approveProposal, rejectProposal, clearPendingProposal } =
    useWalletConnect();
  const { accounts, activeAccount } = useAccount();
  const { allNetworks } = useNetwork();

  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<NetworkConfig[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (pendingProposal) {
      // Default to active account
      setSelectedAccount(activeAccount || accounts[0]);

      // Resolve requested networks matching our supported networks
      const requested = pendingProposal.requestedChains || [];
      const matched = allNetworks.filter(
        (n) => requested.length === 0 || requested.includes(n.chainId)
      );

      // If no chains matched, fallback to all supported default mainnets
      setSelectedNetworks(matched.length > 0 ? matched : allNetworks.slice(0, 3));
    }
  }, [pendingProposal, activeAccount, accounts, allNetworks]);

  if (!pendingProposal) return null;

  const dApp = pendingProposal.dApp;
  const iconUri = dApp.icons && dApp.icons.length > 0 ? dApp.icons[0] : null;

  const handleApprove = async () => {
    if (!selectedAccount) return;
    setIsApproving(true);
    try {
      await approveProposal(pendingProposal, selectedAccount, selectedNetworks);
    } catch (err: any) {
      if (__DEV__) console.warn('[ConnectionProposalModal] Approval failed:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      await rejectProposal(pendingProposal.id, 'User rejected connection');
    } finally {
      clearPendingProposal();
    }
  };

  return (
    <Modal
      visible={!!pendingProposal}
      transparent
      animationType="slide"
      onRequestClose={handleReject}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Connect to dApp</Text>
            <TouchableOpacity onPress={handleReject} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* dApp Profile Card */}
            <View style={styles.dAppCard}>
              <View style={styles.iconWrapper}>
                {iconUri ? (
                  <Image source={{ uri: iconUri }} style={styles.dAppIcon} />
                ) : (
                  <Text style={styles.iconPlaceholder}>🌐</Text>
                )}
              </View>
              <Text style={styles.dAppName}>{dApp.name}</Text>
              <Text style={styles.dAppUrl}>{dApp.url || 'External Application'}</Text>
            </View>

            {/* Account Binding Selector */}
            <Text style={styles.sectionTitle}>Connect Account</Text>
            <View style={styles.accountsList}>
              {accounts.map((acc) => {
                const isSelected = selectedAccount?.id === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accountOption, isSelected && styles.accountOptionActive]}
                    onPress={() => setSelectedAccount(acc)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.accountAvatar, acc.type === 'imported' && { backgroundColor: 'rgba(108, 92, 231, 0.15)', borderColor: '#6C5CE7' }]}>
                      <Text style={styles.avatarText}>
                        {acc.type === 'imported' ? '🔑' : (acc.index ?? 0) + 1}
                      </Text>
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountNameText}>{acc.name}</Text>
                      <Text style={styles.accountAddressText}>
                        {acc.address.slice(0, 6)}...{acc.address.slice(-4)}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Approved Networks */}
            <Text style={styles.sectionTitle}>Available Networks ({selectedNetworks.length})</Text>
            <View style={styles.networkTagsRow}>
              {selectedNetworks.map((net) => (
                <View key={net.chainId} style={styles.networkTag}>
                  <View
                    style={[
                      styles.netDot,
                      net.isTestnet
                        ? styles.netDotTestnet
                        : net.isCustom
                        ? styles.netDotCustom
                        : styles.netDotMainnet,
                    ]}
                  />
                  <Text style={styles.networkTagText}>{net.name}</Text>
                </View>
              ))}
            </View>

            {/* Explicit Permissions Box */}
            <View style={styles.permissionsBox}>
              <Text style={styles.permHeader}>Requested Permissions:</Text>
              <Text style={styles.permItem}>• View wallet balance and activity</Text>
              <Text style={styles.permItem}>• Request approval for transactions and message signatures</Text>
              <Text style={styles.permWarning}>
                🔒 The dApp will NOT have permission to sign transactions automatically.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={isApproving}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.connectBtn, isApproving && styles.btnDisabled]}
              onPress={handleApprove}
              disabled={isApproving}
            >
              <Text style={styles.connectBtnText}>
                {isApproving ? 'Connecting…' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.xl,
    borderTopRightRadius: Spacing.xl,
    padding: Spacing.lg,
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
    color: Colors.text,
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
    paddingBottom: Spacing.lg,
  },
  dAppCard: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  dAppIcon: {
    width: 60,
    height: 60,
  },
  iconPlaceholder: {
    fontSize: 28,
  },
  dAppName: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  dAppUrl: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  accountsList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
  },
  accountOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 208, 78, 0.06)',
  },
  accountAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountNameText: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
  },
  accountAddressText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkIcon: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  networkTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  networkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  netDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  netDotMainnet: {
    backgroundColor: '#00D04E',
  },
  netDotTestnet: {
    backgroundColor: '#F0A500',
  },
  netDotCustom: {
    backgroundColor: '#6C5CE7',
  },
  networkTagText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
  },
  permissionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
  },
  permHeader: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
  },
  permItem: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  permWarning: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.primary,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rejectBtnText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  connectBtn: {
    backgroundColor: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  connectBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNetwork } from '@/context/NetworkContext';
import { NetworkConfig } from '@/blockchain/networks/network.types';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { AddCustomNetworkModal } from './AddCustomNetworkModal';
import { EditCustomNetworkModal } from './EditCustomNetworkModal';
import { ChainIcon } from './ChainIcon';

interface NetworkSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NetworkSelectorModal({
  visible,
  onClose,
}: NetworkSelectorModalProps) {
  const {
    activeNetwork,
    mainnets,
    testnets,
    customNetworks,
    setNetwork,
    deleteCustomNetwork,
  } = useNetwork();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<NetworkConfig | null>(null);

  const handleSelectNetwork = (net: NetworkConfig) => {
    setNetwork(net);
    onClose();
  };

  const handleDeleteConfirm = (net: NetworkConfig) => {
    Alert.alert(
      'Delete Network',
      `Are you sure you want to delete ${net.name} (Chain ID: ${net.chainId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomNetwork(net.chainId);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete network.');
            }
          },
        },
      ]
    );
  };

  const renderNetworkItem = (item: NetworkConfig) => {
    const isActive = item.chainId === activeNetwork.chainId;

    return (
      <TouchableOpacity
        key={item.chainId}
        style={[styles.networkCard, isActive && styles.networkCardActive]}
        onPress={() => handleSelectNetwork(item)}
        activeOpacity={0.7}
      >
        <View style={styles.networkCardLeft}>
          <ChainIcon network={item} size={28} />
          <View style={styles.networkInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.networkName}>{item.name}</Text>
              {item.isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>
            <Text style={styles.networkDetails}>
              Chain ID: {item.chainId} • {item.nativeCurrency.symbol}
            </Text>
          </View>
        </View>

        <View style={styles.networkCardRight}>
          {item.isCustom && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setEditingNetwork(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleDeleteConfirm(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}

          {isActive && <Text style={styles.checkIcon}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Network</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Network Categories */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Mainnets Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Mainnets</Text>
              {mainnets.map(renderNetworkItem)}
            </View>

            {/* 2. Testnets Section */}
            <View style={styles.section}>
              <View style={styles.testnetHeaderRow}>
                <Text style={styles.sectionHeader}>Testnets</Text>
                <View style={styles.testnetBannerPill}>
                  <Text style={styles.testnetBannerText}>🧪 Testnet Assets</Text>
                </View>
              </View>
              {testnets.map(renderNetworkItem)}
            </View>

            {/* 3. Custom Networks Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Custom Networks</Text>
              {customNetworks.length === 0 ? (
                <View style={styles.emptyCustomBox}>
                  <Text style={styles.emptyCustomText}>
                    No custom networks added yet.
                  </Text>
                </View>
              ) : (
                customNetworks.map(renderNetworkItem)
              )}
            </View>
          </ScrollView>

          {/* Bottom Add Network Button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add Custom Network</Text>
          </TouchableOpacity>

          {/* Add Custom Network Sub-Modal */}
          <AddCustomNetworkModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
          />

          {/* Edit Custom Network Sub-Modal */}
          <EditCustomNetworkModal
            visible={!!editingNetwork}
            network={editingNetwork}
            onClose={() => setEditingNetwork(null)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.xl,
    borderTopRightRadius: Spacing.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '85%',
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
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  testnetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  testnetBannerPill: {
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },
  testnetBannerText: {
    color: '#F0A500',
    fontSize: 10,
    fontWeight: 'bold',
  },
  networkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  networkCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 208, 78, 0.06)',
  },
  networkCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  networkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  networkDotMainnet: {
    backgroundColor: '#00D04E',
  },
  networkDotTestnet: {
    backgroundColor: '#F0A500',
  },
  networkDotCustom: {
    backgroundColor: '#6C5CE7',
  },
  networkInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  networkName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
  },
  customBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  customBadgeText: {
    color: '#A29BFE',
    fontSize: 10,
    fontWeight: 'bold',
  },
  networkDetails: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  networkCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconBtn: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 13,
  },
  checkIcon: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  emptyCustomBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyCustomText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

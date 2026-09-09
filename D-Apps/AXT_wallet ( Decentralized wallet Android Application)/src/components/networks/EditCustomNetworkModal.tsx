import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNetwork } from '@/context/NetworkContext';
import { NetworkConfig } from '@/blockchain/networks/network.types';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface EditCustomNetworkModalProps {
  visible: boolean;
  network: NetworkConfig | null;
  onClose: () => void;
}

export function EditCustomNetworkModal({
  visible,
  network,
  onClose,
}: EditCustomNetworkModalProps) {
  const { updateCustomNetwork } = useNetwork();

  const [name, setName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [symbol, setSymbol] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');

  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (network) {
      setName(network.name);
      setRpcUrl(network.rpcUrl);
      setSymbol(network.nativeCurrency.symbol);
      setExplorerUrl(network.explorerUrl || '');
      setErrorMessage(null);
    }
  }, [network]);

  if (!network) return null;

  const handleSave = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedRpc = rpcUrl.trim();
    const trimmedSymbol = symbol.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMessage('Please enter a network name.');
      return;
    }
    if (!trimmedRpc) {
      setErrorMessage('Please enter an RPC URL.');
      return;
    }
    if (!trimmedSymbol) {
      setErrorMessage('Please enter a native currency symbol.');
      return;
    }

    setIsValidating(true);

    try {
      await updateCustomNetwork(network.chainId, {
        name: trimmedName,
        rpcUrl: trimmedRpc,
        symbol: trimmedSymbol,
        explorerUrl: explorerUrl.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to update custom network. Please verify parameters.'
      );
    } finally {
      setIsValidating(false);
    }
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
          <View style={styles.header}>
            <Text style={styles.title}>Edit Custom Network</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={isValidating}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* Chain ID (Read-only) */}
            <Text style={styles.label}>Chain ID (Immutable)</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{network.chainId}</Text>
            </View>

            {/* Network Name */}
            <Text style={styles.label}>Network Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Network Name"
              placeholderTextColor={Colors.textSecondary}
              editable={!isValidating}
            />

            {/* RPC URL */}
            <Text style={styles.label}>RPC URL *</Text>
            <TextInput
              style={styles.input}
              value={rpcUrl}
              onChangeText={setRpcUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isValidating}
            />

            {/* Native Symbol */}
            <Text style={styles.label}>Native Currency Symbol *</Text>
            <TextInput
              style={styles.input}
              value={symbol}
              onChangeText={setSymbol}
              placeholder="e.g. ETH"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="characters"
              editable={!isValidating}
            />

            {/* Block Explorer URL */}
            <Text style={styles.label}>Block Explorer URL (Optional)</Text>
            <TextInput
              style={styles.input}
              value={explorerUrl}
              onChangeText={setExplorerUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isValidating}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={isValidating}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.saveBtn, isValidating && styles.btnDisabled]}
              onPress={handleSave}
              disabled={isValidating}
            >
              {isValidating ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={styles.saveBtnText}>Verifying…</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  formContent: {
    paddingBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error || '#FF4D4D',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error || '#FF4D4D',
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  readOnlyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  readOnlyText: {
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});

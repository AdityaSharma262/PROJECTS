import React, { useState } from 'react';
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
import { Colors, Spacing, Typography } from '@/constants/theme';

interface AddCustomNetworkModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddCustomNetworkModal({
  visible,
  onClose,
}: AddCustomNetworkModalProps) {
  const { addCustomNetwork } = useNetwork();

  const [name, setName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [chainIdInput, setChainIdInput] = useState('');
  const [symbol, setSymbol] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');

  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = () => {
    setName('');
    setRpcUrl('');
    setChainIdInput('');
    setSymbol('');
    setExplorerUrl('');
    setErrorMessage(null);
    setIsValidating(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAdd = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedRpc = rpcUrl.trim();
    const trimmedSymbol = symbol.trim().toUpperCase();
    const chainId = parseInt(chainIdInput.trim(), 10);

    if (!trimmedName) {
      setErrorMessage('Please enter a network name.');
      return;
    }
    if (!trimmedRpc) {
      setErrorMessage('Please enter an RPC URL.');
      return;
    }
    if (isNaN(chainId) || chainId <= 0) {
      setErrorMessage('Please enter a valid positive numeric Chain ID.');
      return;
    }
    if (!trimmedSymbol) {
      setErrorMessage('Please enter a native currency symbol (e.g. ETH, BNB).');
      return;
    }

    setIsValidating(true);

    try {
      await addCustomNetwork({
        name: trimmedName,
        rpcUrl: trimmedRpc,
        chainId,
        symbol: trimmedSymbol,
        explorerUrl: explorerUrl.trim() || undefined,
      });

      handleClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to add custom network. Please verify parameters.'
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
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Custom Network</Text>
            <TouchableOpacity
              onPress={handleClose}
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
            <Text style={styles.helperText}>
              Connect to any EVM-compatible blockchain by specifying its RPC endpoint.
              The wallet will verify the Chain ID before saving.
            </Text>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* Network Name */}
            <Text style={styles.label}>Network Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Polygon zkEVM"
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

            {/* Chain ID */}
            <Text style={styles.label}>Chain ID *</Text>
            <TextInput
              style={styles.input}
              value={chainIdInput}
              onChangeText={setChainIdInput}
              placeholder="e.g. 1101"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
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
              onPress={handleClose}
              disabled={isValidating}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.addBtn, isValidating && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={isValidating}
            >
              {isValidating ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={styles.addBtnText}>Verifying…</Text>
                </View>
              ) : (
                <Text style={styles.addBtnText}>Add Network</Text>
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
  helperText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: Spacing.md,
    lineHeight: 16,
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
  addBtn: {
    backgroundColor: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useWalletConnect } from '@/context/WalletConnectContext';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface PairingInputModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PairingInputModal({ visible, onClose }: PairingInputModalProps) {
  const { connect } = useWalletConnect();
  const [uri, setUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUri(text.trim());
      setErrorMessage(null);
    }
  };

  const handleConnect = async () => {
    const trimmed = uri.trim();
    if (!trimmed) {
      setErrorMessage('Please enter or paste a WalletConnect URI.');
      return;
    }

    if (!trimmed.startsWith('wc:')) {
      setErrorMessage('Invalid URI. A WalletConnect URI must start with "wc:".');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await connect(trimmed);
      setUri('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect. Please check the URI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUri('');
    setErrorMessage(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect to dApp</Text>
            <TouchableOpacity onPress={handleClose} disabled={isLoading} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            Paste a WalletConnect pairing URI (wc:...) from your desktop or mobile browser to connect.
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={uri}
              onChangeText={(t) => {
                setUri(t);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="wc:..."
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />

            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste} disabled={isLoading}>
              <Text style={styles.pasteBtnText}>📋 Paste</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.connectBtn, isLoading && styles.btnDisabled]}
              onPress={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={styles.connectBtnText}>Connecting…</Text>
                </View>
              ) : (
                <Text style={styles.connectBtnText}>Connect</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.xl,
    borderTopRightRadius: Spacing.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  helperText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
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
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pasteBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pasteBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});

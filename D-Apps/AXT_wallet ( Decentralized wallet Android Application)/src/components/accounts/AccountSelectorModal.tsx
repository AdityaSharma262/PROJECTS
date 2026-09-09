import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAccount } from '@/context/AccountContext';
import { WalletAccount } from '@/wallet/accounts/account.types';
import { accountService } from '@/wallet/accounts/account.service';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { PinPad } from '@/components/ui/PinPad';
import { formatAddress } from '@/utils/address';

interface AccountSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}



type AddFlowState = 'idle' | 'chooser' | 'create_pin' | 'import_form' | 'import_pin';

export function AccountSelectorModal({ visible, onClose }: AccountSelectorModalProps) {
  const {
    accounts,
    activeAccount,
    selectAccount,
    createAccount,
    importAccount,
    deleteAccount,
    renameAccount,
  } = useAccount();

  const [flowState, setFlowState] = useState<AddFlowState>('idle');
  const [newAccountName, setNewAccountName] = useState('');
  const [importKeyInput, setImportKeyInput] = useState('');
  const [importDerivedAddress, setImportDerivedAddress] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Renaming state
  const [editingAccount, setEditingAccount] = useState<WalletAccount | null>(null);
  const [renamedTitle, setRenamedTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion confirmation state
  const [accountToDelete, setAccountToDelete] = useState<WalletAccount | null>(null);

  // Validate private key live during typing
  useEffect(() => {
    if (flowState !== 'import_form') return;

    const trimmed = importKeyInput.trim();
    if (!trimmed) {
      setImportDerivedAddress(null);
      setImportError(null);
      return;
    }

    try {
      const { address } = accountService.validatePrivateKey(trimmed);
      setImportDerivedAddress(address);

      const isDuplicate = accounts.some(
        (a) => a.address.toLowerCase() === address.toLowerCase()
      );
      if (isDuplicate) {
        setImportError('An account with this address already exists in the wallet.');
      } else {
        setImportError(null);
      }
    } catch (err: any) {
      setImportDerivedAddress(null);
      setImportError(err?.message || 'Invalid private key format.');
    }
  }, [importKeyInput, flowState, accounts]);

  const handleSelect = async (account: WalletAccount) => {
    await selectAccount(account.id);
    onClose();
  };

  const handleCopy = async (address: string, id: string) => {
    await Clipboard.setStringAsync(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartAdd = () => {
    setFlowState('chooser');
  };

  const handleChooseCreateHD = () => {
    const nextIndex = accounts.filter((a) => a.type === 'hd').length + 1;
    setNewAccountName(`Account ${nextIndex}`);
    setPinError(null);
    setFlowState('create_pin');
  };

  const handleChooseImport = () => {
    const importCount = accounts.filter((a) => a.type === 'imported').length + 1;
    setNewAccountName(`Imported Account ${importCount}`);
    setImportKeyInput('');
    setImportDerivedAddress(null);
    setImportError(null);
    setPinError(null);
    setFlowState('import_form');
  };

  const handlePasteKey = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setImportKeyInput(text.trim());
    }
  };

  const handleProceedToImportPin = () => {
    if (!importDerivedAddress || importError) return;
    setPinError(null);
    setFlowState('import_pin');
  };

  const handleCreatePinComplete = async (enteredPin: string) => {
    if (enteredPin.length !== 6 || isProcessing) return;

    setIsProcessing(true);
    setPinError(null);

    try {
      await createAccount(enteredPin, newAccountName);
      setFlowState('idle');
      onClose();
    } catch (err: any) {
      setPinError(err?.message || 'Failed to create account. Please check your PIN.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportPinComplete = async (enteredPin: string) => {
    if (enteredPin.length !== 6 || isProcessing) return;

    setIsProcessing(true);
    setPinError(null);

    try {
      await importAccount(enteredPin, importKeyInput.trim(), newAccountName);
      setImportKeyInput('');
      setFlowState('idle');
      onClose();
    } catch (err: any) {
      setPinError(err?.message || 'Failed to import account. Please check your PIN.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRename = (account: WalletAccount) => {
    setEditingAccount(account);
    setRenamedTitle(account.name);
  };

  const handleSaveRename = async () => {
    if (editingAccount && renamedTitle.trim()) {
      await renameAccount(editingAccount.id, renamedTitle.trim());
      setEditingAccount(null);
      setRenamedTitle('');
    }
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete) {
      try {
        await deleteAccount(accountToDelete.id);
        setAccountToDelete(null);
      } catch {
        // Ignore
      }
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
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Accounts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account List */}
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isActive = item.id === activeAccount?.id;
              const isCopied = copiedId === item.id;
              const isImported = item.type === 'imported';

              return (
                <TouchableOpacity
                  style={[styles.accountCard, isActive && styles.accountCardActive]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountLeft}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isImported && styles.avatarCircleImported,
                        isActive && styles.avatarCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isImported && styles.avatarTextImported,
                          isActive && styles.avatarTextActive,
                        ]}
                      >
                        {isImported ? '🔑' : (item.index ?? 0) + 1}
                      </Text>
                    </View>

                    <View style={styles.accountInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.accountName} numberOfLines={1}>{item.name}</Text>
                        {isImported && (
                          <View style={styles.importedBadge}>
                            <Text style={styles.importedBadgeText}>Imported</Text>
                          </View>
                        )}
                        {isActive && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleCopy(item.address, item.id)}
                        style={styles.addressRow}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.accountAddress}>
                          {formatAddress(item.address)}
                        </Text>
                        <Text style={styles.copyIcon}>{isCopied ? '✓' : '⧉'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.accountRight}>
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => handleStartRename(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.actionIcon}>✏️</Text>
                    </TouchableOpacity>

                    {isImported && (
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => setAccountToDelete(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.actionIcon}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Add Account Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleStartAdd}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add Account</Text>
          </TouchableOpacity>

          {/* ── Sub-Modal: Add Option Chooser ────────────────────────── */}
          {flowState === 'chooser' && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pinOverlay}>
                <View style={styles.pinSheet}>
                  <Text style={styles.pinTitle}>Add Account</Text>
                  <Text style={styles.pinSubtitle}>
                    Choose how you would like to add an account to your wallet.
                  </Text>

                  <TouchableOpacity
                    style={styles.chooserOption}
                    onPress={handleChooseCreateHD}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chooserIconCircle}>
                      <Text style={styles.chooserIconText}>➕</Text>
                    </View>
                    <View style={styles.chooserInfo}>
                      <Text style={styles.chooserTitle}>Create New Account</Text>
                      <Text style={styles.chooserDesc}>
                        Derives a new address from your existing recovery phrase.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chooserOption}
                    onPress={handleChooseImport}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.chooserIconCircle, { backgroundColor: 'rgba(108, 92, 231, 0.15)', borderColor: '#6C5CE7' }]}>
                      <Text style={styles.chooserIconText}>🔑</Text>
                    </View>
                    <View style={styles.chooserInfo}>
                      <Text style={styles.chooserTitle}>Import Existing Account</Text>
                      <Text style={styles.chooserDesc}>
                        Import an external EVM wallet using its private key.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelPinButton}
                    onPress={() => setFlowState('idle')}
                  >
                    <Text style={styles.cancelPinText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* ── Sub-Modal: Create HD Account PIN Sheet ──────────────── */}
          {flowState === 'create_pin' && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pinOverlay}>
                <View style={styles.pinSheet}>
                  <Text style={styles.pinTitle}>Enter PIN to Create Account</Text>
                  <Text style={styles.pinSubtitle}>
                    Deriving {newAccountName} securely from your recovery phrase.
                  </Text>

                  {isProcessing ? (
                    <View style={styles.creatingRow}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.creatingText}>Deriving HD account…</Text>
                    </View>
                  ) : (
                    <PinPad
                      onComplete={handleCreatePinComplete}
                      errorMessage={pinError}
                      disabled={isProcessing}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.cancelPinButton}
                    onPress={() => setFlowState('idle')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.cancelPinText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* ── Sub-Modal: Import Private Key Form ───────────────────── */}
          {flowState === 'import_form' && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pinOverlay}>
                <View style={[styles.pinSheet, { maxHeight: '92%' }]}>
                  <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                    <Text style={styles.pinTitle}>Import Account</Text>
                    <Text style={styles.pinSubtitle}>
                      Paste the private key of your existing EVM wallet. It will be encrypted with your PIN.
                    </Text>

                    <Text style={styles.inputLabel}>Account Name</Text>
                    <TextInput
                      style={styles.renameInput}
                      value={newAccountName}
                      onChangeText={setNewAccountName}
                      placeholder="e.g. Trading Wallet"
                      placeholderTextColor={Colors.textSecondary}
                      maxLength={30}
                    />

                    <View style={styles.keyLabelRow}>
                      <Text style={styles.inputLabel}>Private Key</Text>
                      <TouchableOpacity onPress={handlePasteKey} activeOpacity={0.7}>
                        <Text style={styles.pasteText}>📋 Paste</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={[styles.keyInput, importError ? { borderColor: Colors.error } : null]}
                      value={importKeyInput}
                      onChangeText={setImportKeyInput}
                      placeholder="0x... (64 hex characters)"
                      placeholderTextColor={Colors.textSecondary}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      multiline={false}
                    />

                    {/* Derived Address Preview */}
                    {importDerivedAddress && (
                      <View style={styles.previewBox}>
                        <Text style={styles.previewLabel}>Public Address:</Text>
                        <Text style={styles.previewAddress} numberOfLines={1}>
                          {importDerivedAddress}
                        </Text>
                      </View>
                    )}

                    {/* Error Notice */}
                    {importError && (
                      <Text style={styles.errorNotice}>{importError}</Text>
                    )}

                    <View style={styles.renameActionRow}>
                      <TouchableOpacity
                        style={[styles.dialogButton, styles.dialogButtonCancel]}
                        onPress={() => setFlowState('idle')}
                      >
                        <Text style={styles.dialogButtonCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.dialogButton,
                          styles.dialogButtonSave,
                          (!importDerivedAddress || !!importError) && { opacity: 0.5 },
                        ]}
                        onPress={handleProceedToImportPin}
                        disabled={!importDerivedAddress || !!importError}
                      >
                        <Text style={styles.dialogButtonSaveText}>Continue</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}

          {/* ── Sub-Modal: Import PIN Confirmation Sheet ─────────────── */}
          {flowState === 'import_pin' && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pinOverlay}>
                <View style={styles.pinSheet}>
                  <Text style={styles.pinTitle}>Enter PIN to Import</Text>
                  <Text style={styles.pinSubtitle}>
                    Encrypting and securing private key for {newAccountName}.
                  </Text>

                  {isProcessing ? (
                    <View style={styles.creatingRow}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.creatingText}>Encrypting private key…</Text>
                    </View>
                  ) : (
                    <PinPad
                      onComplete={handleImportPinComplete}
                      errorMessage={pinError}
                      disabled={isProcessing}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.cancelPinButton}
                    onPress={() => setFlowState('import_form')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.cancelPinText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* ── Sub-Modal: Rename Account Dialog ────────────────── */}
          {editingAccount && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pinOverlay}>
                <View style={styles.pinSheet}>
                  <Text style={styles.pinTitle}>Rename Account</Text>
                  <TextInput
                    style={styles.renameInput}
                    value={renamedTitle}
                    onChangeText={setRenamedTitle}
                    placeholder="Account Name"
                    placeholderTextColor={Colors.textSecondary}
                    autoFocus
                    maxLength={30}
                  />
                  <View style={styles.renameActionRow}>
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonCancel]}
                      onPress={() => setEditingAccount(null)}
                    >
                      <Text style={styles.dialogButtonCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonSave]}
                      onPress={handleSaveRename}
                    >
                      <Text style={styles.dialogButtonSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* ── Sub-Modal: Delete Account Confirmation ───────────── */}
          {accountToDelete && (
            <Modal visible transparent animationType="fade">
              <View style={styles.pinOverlay}>
                <View style={styles.pinSheet}>
                  <Text style={[styles.pinTitle, { color: Colors.error }]}>Remove Imported Account?</Text>
                  <Text style={[styles.pinSubtitle, { textAlign: 'center', lineHeight: 18 }]}>
                    Are you sure you want to remove "{accountToDelete.name}" ({formatAddress(accountToDelete.address)})?
                    {'\n\n'}This will delete the encrypted private key from this device. Make sure you have backed up your private key.
                  </Text>
                  <View style={styles.renameActionRow}>
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonCancel]}
                      onPress={() => setAccountToDelete(null)}
                    >
                      <Text style={styles.dialogButtonCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dialogButton, { backgroundColor: Colors.error }]}
                      onPress={handleConfirmDelete}
                    >
                      <Text style={[styles.dialogButtonSaveText, { color: '#FFF' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  accountCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 208, 78, 0.06)',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarCircleImported: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderColor: 'rgba(108, 92, 231, 0.35)',
  },
  avatarCircleActive: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderColor: Colors.primary,
  },
  avatarText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarTextImported: {
    fontSize: 13,
  },
  avatarTextActive: {
    color: Colors.primary,
  },
  accountInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  accountName: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text,
    maxWidth: 130,
  },
  activeBadge: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  importedBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  importedBadgeText: {
    color: '#A29BFE',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  accountAddress: {
    ...Typography.body,
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  copyIcon: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  actionIconButton: {
    padding: Spacing.xs,
  },
  actionIcon: {
    fontSize: 15,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pinSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pinSubtitle: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  chooserOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    width: '100%',
  },
  chooserIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  chooserIconText: {
    fontSize: 20,
  },
  chooserInfo: {
    flex: 1,
  },
  chooserTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.text,
  },
  chooserDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  keyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  pasteText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  keyInput: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: Spacing.md,
  },
  previewBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 208, 78, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.25)',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  previewAddress: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorNotice: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  creatingRow: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  creatingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  cancelPinButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelPinText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  renameInput: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  renameActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialogButtonCancelText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  dialogButtonSave: {
    backgroundColor: Colors.primary,
  },
  dialogButtonSaveText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

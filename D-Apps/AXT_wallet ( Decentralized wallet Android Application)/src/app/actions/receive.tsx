import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { QRCodeView } from '@/components/ui/QRCodeView';
import { ChainIcon } from '@/components/networks/ChainIcon';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useNetwork } from '@/context/NetworkContext';

export default function ReceiveScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { activeAccount } = useAccount();
  const { activeNetwork } = useNetwork();
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

  const address = activeAccount?.address || session?.address || '';
  const accountName = activeAccount?.name || 'Account 1';
  const isTablet = width >= 600;
  const qrSize = Math.min(width - 96, 200);

  const handleCopy = useCallback(async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [address]);

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 540, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Network Badge */}
          <View style={styles.networkBadge}>
            <ChainIcon network={activeNetwork} size={16} />
            <Text style={styles.networkName}>{activeNetwork.name}</Text>
          </View>

          <Text style={styles.title}>
            Receive {activeNetwork.nativeCurrency.name}
          </Text>
          <Text style={styles.subtitle}>
            Share your address to receive native {activeNetwork.nativeCurrency.symbol} on {activeNetwork.name}.
          </Text>

          {/* Dynamic QR Code Card */}
          <View style={styles.qrCard}>
            <View style={styles.qrWrapper}>
              {address ? (
                <QRCodeView
                  value={address}
                  size={qrSize}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <View style={[styles.qrBox, { width: qrSize, height: qrSize }]}>
                  <Text style={styles.qrIcon}>📱</Text>
                  <Text style={styles.qrLabel}>No Address</Text>
                </View>
              )}
            </View>
            <Text style={styles.scanHint}>Scan QR code to send funds to this wallet</Text>
          </View>

          {/* Address Card */}
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>{accountName} Address</Text>
            <Text style={styles.addressValue} selectable>
              {address || 'No wallet loaded'}
            </Text>

            <TouchableOpacity
              style={[styles.copyPill, copied && styles.copyPillSuccess]}
              onPress={handleCopy}
              activeOpacity={0.75}
            >
              <Text style={[styles.copyPillText, copied && styles.copyPillTextSuccess]}>
                {copied ? '✓ Copied to Clipboard' : '📋 Copy Address'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Warning Note */}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Send only <Text style={{ fontWeight: 'bold' }}>{activeNetwork.nativeCurrency.symbol}</Text> on the <Text style={{ fontWeight: 'bold' }}>{activeNetwork.name}</Text> network to this address. Sending unsupported tokens may result in permanent loss.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Done"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0A500',
  },
  networkName: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  qrCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  qrWrapper: {
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scanHint: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 44,
    marginBottom: Spacing.xs,
  },
  qrLabel: {
    color: '#333333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addressCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.lg,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addressLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  addressValue: {
    ...Typography.body,
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  copyPill: {
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  copyPillSuccess: {
    backgroundColor: 'rgba(0, 208, 78, 0.25)',
    borderColor: Colors.primary,
  },
  copyPillText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  copyPillTextSuccess: {
    color: '#00FF66',
  },
  warningBox: {
    backgroundColor: 'rgba(240, 165, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.25)',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  warningText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    marginTop: Spacing.md,
  },
});

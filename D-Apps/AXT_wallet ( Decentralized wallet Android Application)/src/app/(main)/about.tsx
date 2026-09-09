import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function AboutScreen() {
  const router = useRouter();

  const bulletPoints = [
    'Create and manage blockchain wallet accounts.',
    'Import existing compatible wallet accounts using a private key.',
    'Send and receive supported digital assets.',
    'Manage supported tokens and NFTs.',
    'Connect with compatible decentralized applications through WalletConnect.',
    'Review and approve transactions and signature requests.',
    'Manage multiple accounts and supported blockchain networks.',
  ];

  return (
    <Screen style={styles.container}>
      {/* ── Top Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate('/(main)/settings')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About AXT Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ──────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroIcon}>🛡️</Text>
          </View>
          <Text style={styles.heroTitle}>About AXT Wallet</Text>
          <Text style={styles.heroTagline}>
            Your Keys. Your Assets. Your Control.
          </Text>
          <Text style={styles.bodyText}>
            AXT Wallet is a self-custodial digital wallet designed to help you securely manage and interact with blockchain networks and decentralized applications.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            With AXT Wallet, you control your wallet accounts and the cryptographic credentials associated with them. Your assets are not held or controlled by AXT Wallet.
          </Text>
        </View>

        {/* ── What AXT Wallet Does ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <Text style={styles.sectionTitle}>What AXT Wallet Does</Text>
          </View>
          <Text style={styles.bodyText}>AXT Wallet allows you to:</Text>
          <View style={styles.bulletList}>
            {bulletPoints.map((point, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── You Are in Control ───────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>🔑</Text>
            <Text style={styles.sectionTitle}>You Are in Control</Text>
          </View>
          <Text style={styles.bodyText}>
            AXT Wallet is designed as a non-custodial wallet. This means that your recovery phrase and private keys remain under your control.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            AXT Wallet does not hold your private keys, control your assets, or have the ability to recover your wallet if you lose your recovery phrase or other required credentials.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              ⚠️ You are responsible for keeping your recovery phrase, private keys, PIN, and device secure.
            </Text>
          </View>
        </View>

        {/* ── Security ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>🔒</Text>
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <Text style={styles.bodyText}>
            Security-sensitive operations, including transaction and message signing, require explicit user authorization. AXT Wallet is designed to provide clear transaction and signature information before approval.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            However, blockchain transactions and cryptographic signatures may carry financial or security risks. Always verify the recipient, network, transaction details, smart contract interactions, and permissions before approving a request.
          </Text>
        </View>

        {/* ── AXT Wallet & Blockchain Networks ─────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>🌐</Text>
            <Text style={styles.sectionTitle}>AXT Wallet & Blockchain Networks</Text>
          </View>
          <Text style={styles.bodyText}>
            AXT Wallet provides software that helps you interact with supported blockchain networks. Blockchain networks, smart contracts, tokens, NFTs, decentralized applications, and third-party services operate independently from AXT Wallet.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            AXT Wallet does not control these networks or guarantee the availability, security, value, or functionality of third-party blockchain services.
          </Text>
        </View>

        {/* ── Footer ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AXT Wallet • Version 1.0.0</Text>
          <Text style={styles.footerSubtext}>Non-Custodial Multi-Chain EVM Wallet</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 24,
    lineHeight: 26,
    textAlign: 'center',
    marginTop: -2,
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Colors.text,
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroIcon: {
    fontSize: 28,
  },
  heroTitle: {
    ...Typography.title,
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  heroTagline: {
    ...Typography.subtitle,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    color: Colors.text,
    fontWeight: 'bold',
  },
  bodyText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bulletList: {
    marginTop: Spacing.sm,
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    color: Colors.primary,
    fontSize: 16,
    lineHeight: 20,
  },
  bulletText: {
    ...Typography.body,
    fontSize: 13.5,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  highlightBox: {
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  highlightText: {
    ...Typography.body,
    fontSize: 13,
    color: '#FFAA00',
    lineHeight: 19,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footerText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  footerSubtext: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    opacity: 0.7,
    marginTop: 2,
  },
});

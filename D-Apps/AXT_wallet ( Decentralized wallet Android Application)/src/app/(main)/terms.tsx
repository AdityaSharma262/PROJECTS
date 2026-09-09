import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();

  const userResponsibilities = [
    'Safely backing up and protecting your recovery phrase.',
    'Keeping your private keys confidential.',
    'Securing your device and authentication credentials.',
    'Verifying transaction details before approval.',
    'Verifying wallet addresses and blockchain networks.',
    'Understanding the permissions you grant to decentralized applications.',
    'Reviewing smart contract interactions and signature requests before signing.',
  ];

  const digitalAssetRisks = [
    'Loss of asset value.',
    'Smart contract vulnerabilities.',
    'Malicious transactions or signatures.',
    'Phishing and impersonation attacks.',
    'Loss or theft of private keys or recovery phrases.',
    'Network congestion or transaction failures.',
    'Incorrect transactions or wallet addresses.',
    'Loss of access to third-party services.',
  ];

  const limitationOfResponsibility = [
    'Lost or compromised recovery phrases or private keys.',
    'Unauthorized access caused by compromised devices or credentials.',
    'Incorrect transactions.',
    'Interactions with malicious or vulnerable smart contracts.',
    'Third-party decentralized applications or services.',
    'Blockchain network failures or congestion.',
    'Loss in the value of digital assets.',
    'User error or failure to follow recommended security practices.',
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Intro Card ───────────────────────────────────── */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Terms & Conditions</Text>
          <Text style={styles.introSubtitle}>
            These Terms & Conditions govern your use of AXT Wallet. By accessing or using the application, you agree to these Terms.
          </Text>
        </View>

        {/* ── 1. AXT Wallet Is a Non-Custodial Wallet ──────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>1. AXT Wallet Is a Non-Custodial Wallet</Text>
          <Text style={styles.bodyText}>
            AXT Wallet is a non-custodial software application. You are solely responsible for maintaining control of your recovery phrase, private keys, authentication credentials, and device.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            AXT Wallet does not custody your digital assets and cannot access, recover, reset, or restore your wallet without the required cryptographic credentials under your control.
          </Text>
        </View>

        {/* ── 2. Your Responsibilities ─────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>2. Your Responsibilities</Text>
          <Text style={styles.bodyText}>You are responsible for:</Text>
          <View style={styles.bulletList}>
            {userResponsibilities.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Never share your recovery phrase or private keys with anyone.
            </Text>
          </View>
        </View>

        {/* ── 3. Transactions Are Irreversible ─────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>3. Transactions Are Irreversible</Text>
          <Text style={styles.bodyText}>
            Blockchain transactions are generally irreversible once submitted and confirmed by the relevant network.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            AXT Wallet cannot reverse, cancel, recover, or modify a completed blockchain transaction. You are responsible for verifying all transaction details before authorizing a transaction.
          </Text>
        </View>

        {/* ── 4. Third-Party Services ──────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>4. Third-Party Services</Text>
          <Text style={styles.bodyText}>
            AXT Wallet may allow interaction with blockchain networks, RPC providers, WalletConnect-compatible applications, token services, NFT metadata services, IPFS gateways, block explorers, and other third-party services.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            AXT Wallet does not control or guarantee the availability, security, accuracy, or functionality of these third-party services.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            Your use of third-party services may be subject to their own terms and policies.
          </Text>
        </View>

        {/* ── 5. Decentralized Applications and Smart Contracts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>5. Decentralized Applications and Smart Contracts</Text>
          <Text style={styles.bodyText}>
            When connecting to a decentralized application, you are interacting directly with a third-party service.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            AXT Wallet may provide security warnings, transaction analysis, or human-readable information, but these features are intended to assist you and do not guarantee that a transaction, signature, smart contract, token, NFT, or decentralized application is safe.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            You remain responsible for deciding whether to approve or reject any request.
          </Text>
        </View>

        {/* ── 6. Digital Asset Risks ───────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>6. Digital Asset Risks</Text>
          <Text style={styles.bodyText}>
            Digital assets and blockchain technology involve significant risks, including but not limited to:
          </Text>
          <View style={styles.bulletList}>
            {digitalAssetRisks.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            You acknowledge and accept these risks when using AXT Wallet.
          </Text>
        </View>

        {/* ── 7. No Financial or Investment Advice ─────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>7. No Financial or Investment Advice</Text>
          <Text style={styles.bodyText}>
            AXT Wallet does not provide financial, investment, legal, tax, or professional advice.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            Any prices, asset information, transaction analysis, warnings, or other information displayed within the application are provided for informational purposes only.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            You are solely responsible for your decisions regarding digital assets and blockchain transactions.
          </Text>
        </View>

        {/* ── 8. No Guarantee of Availability ─────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>8. No Guarantee of Availability</Text>
          <Text style={styles.bodyText}>
            We may modify, update, suspend, or discontinue parts of AXT Wallet at any time.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            We do not guarantee uninterrupted, error-free, or secure operation of the application or its connection to blockchain networks and third-party services.
          </Text>
        </View>

        {/* ── 9. Limitation of Responsibility ──────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>9. Limitation of Responsibility</Text>
          <Text style={styles.bodyText}>
            To the maximum extent permitted by applicable law, AXT Wallet and its developers are not responsible for losses resulting from:
          </Text>
          <View style={styles.bulletList}>
            {limitationOfResponsibility.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 10. Updates to These Terms ───────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>10. Updates to These Terms</Text>
          <Text style={styles.bodyText}>
            These Terms & Conditions may be updated from time to time. Continued use of AXT Wallet after an updated version of the Terms becomes available may constitute acceptance of the revised Terms.
          </Text>
        </View>

        {/* ── 11. Contact ──────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionNumber}>11. Contact</Text>
          <Text style={styles.bodyText}>
            For questions, feedback, or support regarding AXT Wallet, please contact us through the official AXT Wallet support channels.
          </Text>
        </View>

        {/* ── Footer ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AXT Wallet • Terms & Conditions</Text>
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
  introCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  introTitle: {
    ...Typography.title,
    fontSize: 20,
    color: Colors.text,
    marginBottom: 6,
  },
  introSubtitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionNumber: {
    ...Typography.subtitle,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  bodyText: {
    ...Typography.body,
    fontSize: 13.5,
    color: Colors.textSecondary,
    lineHeight: 21,
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
  warningBox: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 76, 0.3)',
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  warningText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.error,
    fontWeight: 'bold',
    lineHeight: 18,
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
});

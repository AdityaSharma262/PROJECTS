import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SignatureAnalysis } from '@/blockchain/security/security.types';
import { NetworkConfig } from '@/blockchain/networks/network.types';
import { formatAddress } from '@/utils/address';

interface SignatureAnalysisCardProps {
  analysis: SignatureAnalysis;
  network?: NetworkConfig;
  accountName?: string;
}



export function SignatureAnalysisCard({
  analysis,
  network,
  accountName,
}: SignatureAnalysisCardProps) {
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = async () => {
    await Clipboard.setStringAsync(analysis.rawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getRiskBadge = () => {
    switch (analysis.risk) {
      case 'low':
        return {
          label: 'Low Risk',
          icon: '🛡️',
          bg: 'rgba(0, 208, 78, 0.12)',
          border: 'rgba(0, 208, 78, 0.3)',
          text: Colors.primary,
        };
      case 'medium':
        return {
          label: 'Medium Risk',
          icon: '⚡',
          bg: 'rgba(255, 179, 0, 0.12)',
          border: 'rgba(255, 179, 0, 0.35)',
          text: '#FFB300',
        };
      case 'high':
      default:
        return {
          label: 'High Risk',
          icon: '⚠️',
          bg: 'rgba(255, 71, 87, 0.12)',
          border: 'rgba(255, 71, 87, 0.35)',
          text: Colors.error,
        };
    }
  };

  const badge = getRiskBadge();

  return (
    <View style={styles.container}>
      {/* Risk & Method Header */}
      <View style={styles.headerRow}>
        <View style={styles.methodBadge}>
          <Text style={styles.methodBadgeText}>
            {analysis.method === 'eth_signTypedData_v4'
              ? 'EIP-712 Typed Data'
              : analysis.method === 'personal_sign'
              ? 'Personal Sign'
              : analysis.method === 'eth_sign'
              ? 'Raw eth_sign'
              : analysis.method}
          </Text>
        </View>

        <View
          style={[
            styles.riskBadge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Text style={styles.riskIcon}>{badge.icon}</Text>
          <Text style={[styles.riskLabel, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      <Text style={styles.titleText}>{analysis.title}</Text>
      <Text style={styles.summaryText}>{analysis.summary}</Text>

      {/* Security Warnings Banner */}
      {analysis.warnings.length > 0 && (
        <View
          style={[
            styles.warningCard,
            analysis.risk === 'high' ? styles.warningCardHigh : styles.warningCardMed,
          ]}
        >
          <Text style={styles.warningTitle}>
            {analysis.risk === 'high' ? '⚠️ Security Warning' : 'ℹ️ Notice'}
          </Text>
          {analysis.warnings.map((w, idx) => (
            <Text key={idx} style={styles.warningText}>
              • {w}
            </Text>
          ))}
        </View>
      )}

      {/* Main Content Breakdown */}
      <View style={styles.detailsCard}>
        {/* 1. Plain / Decoded Personal Message */}
        {analysis.decodedMessage && (
          <View style={styles.messageSection}>
            <Text style={styles.sectionLabel}>Message Content:</Text>
            <View style={styles.messageBox}>
              <ScrollView style={styles.messageScroll} nestedScrollEnabled>
                <Text style={styles.messageText}>{analysis.decodedMessage}</Text>
              </ScrollView>
            </View>
          </View>
        )}

        {/* 2. EIP-712 Domain Breakdown */}
        {analysis.typedDataDomain && (
          <View style={styles.domainSection}>
            <Text style={styles.sectionLabel}>EIP-712 Domain:</Text>
            <View style={styles.domainCard}>
              {analysis.typedDataDomain.name && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>App / Protocol</Text>
                  <Text style={styles.rowValue}>{analysis.typedDataDomain.name}</Text>
                </View>
              )}
              {analysis.typedDataDomain.version && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Version</Text>
                  <Text style={styles.rowValue}>{analysis.typedDataDomain.version}</Text>
                </View>
              )}
              {analysis.typedDataDomain.chainId !== undefined && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Target Chain ID</Text>
                  <Text style={styles.rowValue}>{String(analysis.typedDataDomain.chainId)}</Text>
                </View>
              )}
              {analysis.typedDataDomain.verifyingContract && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Verifying Contract</Text>
                  <Text style={styles.rowValueMono}>
                    {formatAddress(analysis.typedDataDomain.verifyingContract)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 3. EIP-712 Structured Fields */}
        {analysis.structuredFields && analysis.structuredFields.length > 0 && (
          <View style={styles.fieldsSection}>
            <View style={styles.fieldsHeader}>
              <Text style={styles.sectionLabel}>Structured Parameters:</Text>
              {analysis.primaryType && (
                <View style={styles.primaryTypeTag}>
                  <Text style={styles.primaryTypeText}>{analysis.primaryType}</Text>
                </View>
              )}
            </View>

            <View style={styles.fieldsCard}>
              {analysis.structuredFields.map((field, idx) => (
                <View key={idx} style={styles.fieldRow}>
                  <Text style={styles.fieldKey}>{field.key}</Text>
                  <Text
                    style={[
                      styles.fieldValue,
                      field.isNested && styles.fieldValueNested,
                    ]}
                    numberOfLines={field.isNested ? undefined : 2}
                  >
                    {field.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Account Info */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Signing Account</Text>
          <Text style={styles.rowValueMono}>
            {accountName ? `${accountName} ` : ''}({formatAddress(analysis.accountAddress)})
          </Text>
        </View>

        {network && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Network</Text>
            <Text style={styles.rowValue}>{network.name}</Text>
          </View>
        )}

        {/* Expandable Raw Payload */}
        <View style={styles.rawSection}>
          <TouchableOpacity
            style={styles.rawToggle}
            onPress={() => setShowRawPayload(!showRawPayload)}
            activeOpacity={0.7}
          >
            <Text style={styles.rawToggleText}>
              {showRawPayload ? '▲ Hide Raw Payload' : '▼ View Raw Payload'}
            </Text>
          </TouchableOpacity>

          {showRawPayload && (
            <View style={styles.rawBox}>
              <ScrollView style={styles.rawScroll} nestedScrollEnabled>
                <Text style={styles.rawText}>{analysis.rawPayload}</Text>
              </ScrollView>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyRaw}>
                <Text style={styles.copyBtnText}>
                  {copied ? '✓ Copied' : '⧉ Copy Payload'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Educational Notice Banner */}
      <View style={styles.eduNotice}>
        <Text style={styles.eduNoticeIcon}>🔒</Text>
        <Text style={styles.eduNoticeText}>
          Signing this message does not send a blockchain transaction or require gas fees, but the signature may still authorize actions or permissions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  methodBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  riskIcon: {
    fontSize: 11,
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  titleText: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
    marginTop: 4,
  },
  summaryText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  warningCard: {
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  warningCardHigh: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  warningCardMed: {
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderColor: 'rgba(255, 179, 0, 0.3)',
  },
  warningTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  warningText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageSection: {
    marginBottom: Spacing.xs,
  },
  messageBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 140,
  },
  messageScroll: {
    maxHeight: 120,
  },
  messageText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  domainSection: {
    marginBottom: Spacing.xs,
  },
  domainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldsSection: {
    marginBottom: Spacing.xs,
  },
  fieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  primaryTypeTag: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  primaryTypeText: {
    color: '#A29BFE',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fieldsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  fieldKey: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  fieldValue: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  fieldValueNested: {
    fontSize: 11,
    color: '#A29BFE',
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowValue: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  rowValueMono: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  rawSection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rawToggle: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  rawToggleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  rawBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rawScroll: {
    maxHeight: 120,
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  copyBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  copyBtnText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  eduNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 208, 78, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.2)',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  eduNoticeIcon: {
    fontSize: 16,
  },
  eduNoticeText: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});

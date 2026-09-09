import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { TransactionAnalysis } from '@/blockchain/security/security.types';
import { NetworkConfig } from '@/blockchain/networks/network.types';
import { formatAddress } from '@/utils/address';

interface TransactionAnalysisCardProps {
  analysis: TransactionAnalysis;
  network?: NetworkConfig;
  estimatedFee?: string;
}



export function TransactionAnalysisCard({
  analysis,
  network,
  estimatedFee,
}: TransactionAnalysisCardProps) {
  const [showFullCalldata, setShowFullCalldata] = useState(false);
  const [copiedData, setCopiedData] = useState(false);

  const handleCopyCalldata = async (data: string) => {
    await Clipboard.setStringAsync(data);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 1500);
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
      {/* Risk Header Pill */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{analysis.title}</Text>
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

      {/* Warnings Callout Banner */}
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

      {/* Main Breakdown Card */}
      <View style={styles.detailsCard}>
        {/* 1. Value / Amount Display */}
        {analysis.formattedAmount && (
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>
              {analysis.kind === 'erc20_approval'
                ? 'Permission Amount'
                : 'Transfer Amount'}
            </Text>
            <Text
              style={[
                styles.amountValue,
                analysis.approval?.unlimited && styles.amountValueUnlimited,
              ]}
              numberOfLines={1}
            >
              {analysis.formattedAmount}
            </Text>
            {analysis.token?.name && (
              <Text style={styles.tokenSubName}>{analysis.token.name}</Text>
            )}
          </View>
        )}

        {/* 2. Key Detail Rows */}
        {/* Recipient */}
        {analysis.recipient && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To Recipient</Text>
            <Text style={styles.detailValueMono}>
              {formatAddress(analysis.recipient)}
            </Text>
          </View>
        )}

        {/* Token Approval Details */}
        {analysis.approval && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Spender</Text>
              <Text style={styles.detailValueMono}>
                {formatAddress(analysis.approval.spender)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Permission</Text>
              <View
                style={[
                  styles.permissionPill,
                  analysis.approval.unlimited
                    ? styles.permissionPillUnlimited
                    : styles.permissionPillLimited,
                ]}
              >
                <Text
                  style={[
                    styles.permissionPillText,
                    analysis.approval.unlimited
                      ? { color: Colors.error }
                      : { color: Colors.primary },
                  ]}
                >
                  {analysis.approval.unlimited
                    ? 'Unlimited Allowance'
                    : 'Exact Allowance'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Contract Interaction Details */}
        {analysis.contract && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contract</Text>
              <Text style={styles.detailValueMono}>
                {formatAddress(analysis.contract.address)}
              </Text>
            </View>

            {analysis.contract.selector && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Function</Text>
                <View style={styles.selectorTag}>
                  <Text style={styles.selectorText}>
                    {analysis.contract.selector}
                  </Text>
                </View>
              </View>
            )}

            {analysis.contract.calldata && (
              <View style={styles.calldataSection}>
                <TouchableOpacity
                  style={styles.calldataToggle}
                  onPress={() => setShowFullCalldata(!showFullCalldata)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calldataToggleText}>
                    {showFullCalldata ? '▲ Hide Raw Calldata' : '▼ View Raw Calldata'}
                  </Text>
                </TouchableOpacity>

                {showFullCalldata && (
                  <View style={styles.calldataBox}>
                    <Text style={styles.calldataText}>
                      {analysis.contract.calldata}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => handleCopyCalldata(analysis.contract?.calldata || '')}
                    >
                      <Text style={styles.copyBtnText}>
                        {copiedData ? '✓ Copied' : '⧉ Copy Calldata'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Network & Estimated Fee */}
        {network && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>{network.name}</Text>
          </View>
        )}

        {estimatedFee && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Fee</Text>
            <Text style={styles.detailValueFee}>{estimatedFee}</Text>
          </View>
        )}
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
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 17,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
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
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  amountLabel: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    ...Typography.title,
    fontSize: 22,
    color: Colors.text,
    fontWeight: 'bold',
  },
  amountValueUnlimited: {
    color: Colors.error,
  },
  tokenSubName: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  detailLabel: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  detailValueMono: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  detailValueFee: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  permissionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  permissionPillUnlimited: {
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  permissionPillLimited: {
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  permissionPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectorTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.text,
  },
  calldataSection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  calldataToggle: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  calldataToggleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  calldataBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calldataText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    maxHeight: 120,
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
});

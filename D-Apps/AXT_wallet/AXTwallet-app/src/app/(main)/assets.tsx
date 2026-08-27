import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Spacing, Typography, Colors } from '@/constants/theme';

export default function AssetsScreen() {
  return (
    <Screen noSafeArea>
      <View style={styles.header}>
        <Text style={Typography.title}>Assets</Text>
      </View>

      <View style={styles.assetCard}>
        <View style={styles.assetInfo}>
          <View style={styles.assetIcon}><Text>Ξ</Text></View>
          <View>
            <Text style={styles.assetName}>Ethereum</Text>
            <Text style={styles.assetSymbol}>ETH</Text>
          </View>
        </View>
        <View style={styles.assetBalance}>
          <Text style={styles.assetBalanceAmount}>0.00 ETH</Text>
          <Text style={styles.assetBalanceFiat}>$0.00</Text>
        </View>
      </View>

      <Text style={styles.emptyState}>No additional tokens</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    marginBottom: Spacing.lg,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetName: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  assetSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  assetBalance: {
    alignItems: 'flex-end',
  },
  assetBalanceAmount: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  assetBalanceFiat: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  }
});

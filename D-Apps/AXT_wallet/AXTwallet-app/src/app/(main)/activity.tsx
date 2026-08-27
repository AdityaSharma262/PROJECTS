import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Spacing, Typography, Colors } from '@/constants/theme';

export default function ActivityScreen() {
  return (
    <Screen noSafeArea>
      <View style={styles.header}>
        <Text style={Typography.title}>Activity</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emptyState}>No transactions yet</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    ...Typography.body,
    color: Colors.textSecondary,
  }
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { lock } = useAuth();

  return (
    <Screen noSafeArea>
      <ScrollView>
        <View style={styles.header}>
          <Text style={Typography.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.card}>
            <Text style={styles.item}>Wallet Management</Text>
            <View style={styles.divider} />
            <Text style={styles.item}>Networks</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <Text style={styles.item}>Change PIN</Text>
            <View style={styles.divider} />
            <Text style={styles.item}>Biometrics (coming soon)</Text>
            <View style={styles.divider} />
            <Text style={styles.item}>Auto-lock Timer</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application</Text>
          <View style={styles.card}>
            <Text style={styles.item}>About</Text>
            <View style={styles.divider} />
            <Text style={styles.item}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Lock Wallet */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.lockButton} onPress={lock}>
            <Text style={styles.lockButtonText}>🔒 Lock Wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.sm,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    overflow: 'hidden',
  },
  item: { ...Typography.body, padding: Spacing.md },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  lockButton: {
    backgroundColor: 'rgba(255,76,76,0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  lockButtonText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: 'bold',
  },
});

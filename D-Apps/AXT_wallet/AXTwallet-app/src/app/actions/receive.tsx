import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, Colors } from '@/constants/theme';

export default function ReceiveScreen() {
  const router = useRouter();

  return (
    <Screen noSafeArea style={styles.container}>
      <Text style={styles.title}>Receive Ethereum</Text>
      
      <View style={styles.qrPlaceholder}>
        <Text style={styles.qrText}>[ QR CODE ]</Text>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Your Wallet Address</Text>
        <Text style={styles.addressValue} selectable>
          0x0000000000000000000000000000000000000000
        </Text>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Copy Address" 
          onPress={() => {}} 
        />
        <Button 
          title="Done" 
          variant="outline"
          onPress={() => router.back()} 
          style={{ marginTop: Spacing.md }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    ...Typography.subtitle,
    marginTop: Spacing.xl,
    color: Colors.text,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    borderRadius: Spacing.sm,
  },
  qrText: {
    color: '#000',
    fontWeight: 'bold',
  },
  addressContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  addressLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  addressValue: {
    ...Typography.body,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  }
});

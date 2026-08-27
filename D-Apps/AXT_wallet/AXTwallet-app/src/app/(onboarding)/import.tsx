import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spacing, Typography } from '@/constants/theme';

export default function ImportWalletScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={Typography.title}>Import Wallet</Text>
        <Text style={Typography.subtitle}>
          (Placeholder) Enter your Secret Recovery Phrase.
        </Text>
      </View>

      <View style={styles.content}>
        <Input 
          placeholder="Enter secret recovery phrase"
          multiline
          numberOfLines={4}
          style={{ height: 120, textAlignVertical: 'top' }}
        />
      </View>

      <View style={styles.footer}>
        <Button 
          title="Import" 
          onPress={() => router.push('/(auth)/set-pin')} 
        />
        <Button 
          title="Back" 
          variant="outline"
          onPress={() => router.back()} 
          style={{ marginTop: Spacing.md }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.xl,
  },
  content: {
    flex: 1,
    marginTop: Spacing.xl,
  },
  footer: {
    marginBottom: Spacing.xl,
  }
});

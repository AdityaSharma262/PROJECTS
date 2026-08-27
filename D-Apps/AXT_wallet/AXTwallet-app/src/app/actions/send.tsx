import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spacing } from '@/constants/theme';

export default function SendScreen() {
  const router = useRouter();

  return (
    <Screen noSafeArea>
      <View style={styles.form}>
        <Input 
          label="Asset"
          placeholder="Select Asset (e.g. ETH)"
          value="Ethereum (ETH)"
          editable={false}
        />
        
        <Input 
          label="Recipient Address"
          placeholder="0x..."
        />
        
        <Input 
          label="Amount"
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={() => router.back()} 
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    marginTop: Spacing.xl,
  },
  footer: {
    marginBottom: Spacing.xl,
  }
});

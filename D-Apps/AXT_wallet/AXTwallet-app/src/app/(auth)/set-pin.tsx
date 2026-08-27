import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spacing, Typography, Colors } from '@/constants/theme';

export default function SetPinScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
           <Image 
             source={require('@/../assets/images/logoicon.png')} 
             style={styles.lockIcon}
             resizeMode="contain"
           />
        </View>

        <Text style={styles.title}>
          Set Your <Text style={{ color: Colors.primary }}>Password</Text>
        </Text>
        <Text style={styles.subtitle}>
          Create a strong password to keep your wallet secure.
        </Text>

        <View style={styles.form}>
          <Input 
            placeholder="Please Enter a Password"
            secureTextEntry
          />
          <Input 
            placeholder="Confirm your password"
            secureTextEntry
          />
          
          <Button 
            title="Set Password" 
            onPress={() => router.push('/(main)' as any)} 
            style={styles.button}
          />
        </View>

        <Text style={styles.hint}>
           Use at least 8 characters with a mix of letters, numbers & symbols
        </Text>

        <View style={styles.footer}>
          <Text 
            style={styles.backText}
            onPress={() => router.replace('/(onboarding)/welcome')}
          >
            ← Back Home
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(6, 22, 45, 0.85)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Spacing.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(0, 208, 78, 0.1)', // subtle green glow
  },
  lockIcon: {
    width: 40,
    height: 40,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: Spacing.md,
    width: '100%',
  },
  hint: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.xl,
  },
  backText: {
    color: Colors.text,
    fontSize: 14,
  }
});

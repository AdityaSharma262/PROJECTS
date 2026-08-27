import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, Colors } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.container}>
      {/* Top: Logo centred */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/../assets/images/WalletLogo.png')}
          style={styles.walletLogo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Your Keys, Your Future</Text>
      </View>

      {/* Bottom: CTA buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="Create a new wallet"
          onPress={() => router.push('/(onboarding)/create')}
          style={styles.button}
        />
        <Button
          title="Import an existing wallet"
          variant="outline"
          onPress={() => router.push('/(onboarding)/import')}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLogo: {
    width: 280,
    height: 160,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.subtitle,
    fontSize: 18,
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});

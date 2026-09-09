import { View, Text, StyleSheet, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, Colors } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isCompact = height < 680;
  const isTablet = width >= 600;

  const logoMaxWidth = isTablet ? 360 : Math.min(280, width * 0.75);

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top: Logo centred */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/../assets/images/WalletLogo.png')}
            style={[
              styles.walletLogo,
              {
                width: logoMaxWidth,
                height: logoMaxWidth * (160 / 280),
              },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.subtitle,
              isCompact && { fontSize: 16 },
              isTablet && { fontSize: 22 },
            ]}
          >
            Your Keys, Your Future
          </Text>
        </View>

        {/* Bottom: CTA buttons */}
        <View style={[styles.actionsContainer, isTablet && { maxWidth: 440, alignSelf: 'center', width: '100%' }]}>
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  walletLogo: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.subtitle,
    fontSize: 18,
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: Spacing.md,
    width: '100%',
    paddingBottom: Spacing.md,
  },
  button: {
    width: '100%',
  },
});

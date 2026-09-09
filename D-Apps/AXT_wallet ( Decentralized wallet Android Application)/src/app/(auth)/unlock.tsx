import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { PinPad } from '@/components/ui/PinPad';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { authService } from '@/wallet/auth/auth.service';
import { useAuth } from '@/context/AuthContext';
import { useBiometric } from '@/context/BiometricContext';
import { BiometricPrompt } from '@/components/security/BiometricPrompt';
import { useRouter } from 'expo-router';

/**
 * SECURITY RULES (DO NOT VIOLATE):
 * - PIN is passed directly to authService.login() and never stored in state.
 * - On decryption failure, a generic "Incorrect PIN." message is shown.
 * - Internal error details (AES-GCM, Keystore) are NEVER displayed to the user.
 */

const LOCKOUT_REFRESH_INTERVAL_MS = 1000;

export default function UnlockScreen() {
  const { refreshAuthState } = useAuth();
  const { biometricStatus } = useBiometric();
  const router = useRouter();
  const { height, width } = useWindowDimensions();

  const isCompact = height < 700;
  const isTablet = width >= 600;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoPromptedRef = useRef(false);

  // Poll lockout state to update the countdown timer
  useEffect(() => {
    const update = () => {
      const status = authService.getStatus();
      const lockedOut = status === 'locked_out';
      setIsLockedOut(lockedOut);
      if (lockedOut) {
        setRemainingMs(authService.getLockoutRemaining());
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    timerRef.current = setInterval(update, LOCKOUT_REFRESH_INTERVAL_MS);
    update(); // run immediately
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    if (loading || isLockedOut || !biometricStatus.isEnabled) return;
    setLoading(true);
    setError(null);

    try {
      await authService.loginWithBiometrics();
      refreshAuthState(); // NavigationGuard → (main)
    } catch (err: any) {
      setLoading(false);
      const newStatus = authService.getStatus();
      if (newStatus === 'locked_out') {
        setIsLockedOut(true);
        setRemainingMs(authService.getLockoutRemaining());
      }
    }
  }, [loading, isLockedOut, biometricStatus.isEnabled, refreshAuthState]);

  // Attempt auto biometric unlock on mount when enabled
  useEffect(() => {
    if (
      biometricStatus.isEnabled &&
      !isLockedOut &&
      !loading &&
      !hasAutoPromptedRef.current
    ) {
      hasAutoPromptedRef.current = true;
      handleBiometricUnlock();
    }
  }, [biometricStatus.isEnabled, isLockedOut, handleBiometricUnlock]);

  const handlePinComplete = useCallback(async (pin: string) => {
    if (loading || isLockedOut) return;
    setLoading(true);
    setError(null);

    try {
      await authService.login(pin);
      refreshAuthState(); // NavigationGuard → (main)
    } catch (err) {
      setLoading(false);
      const newStatus = authService.getStatus();

      if (newStatus === 'locked_out') {
        setIsLockedOut(true);
        setRemainingMs(authService.getLockoutRemaining());
        setError(null);
      } else {
        // Show generic message — NEVER expose AES-GCM or Keystore details
        setError('Incorrect PIN.');
      }
    }
  }, [loading, isLockedOut, refreshAuthState]);

  const formatRemaining = (ms: number) => {
    const secs = Math.ceil(ms / 1000);
    if (secs >= 60) return `${Math.ceil(secs / 60)}m`;
    return `${secs}s`;
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.card, isTablet && { maxWidth: 460 }]}>
          {isLockedOut ? (
            <View style={styles.lockoutView}>
              <Text style={styles.lockoutIcon}>🔒</Text>
              <Text style={styles.title}>
                Wallet <Text style={{ color: Colors.error }}>Locked</Text>
              </Text>
              <Text style={styles.lockoutMessage}>
                Too many incorrect attempts. Try again in{' '}
                <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>
                  {formatRemaining(remainingMs)}
                </Text>
              </Text>
              <Button
                title="Forgot PIN? Recover Wallet"
                variant="outline"
                onPress={() => router.push('/(auth)/recovery' as any)}
                style={styles.recoverButton}
              />
            </View>
          ) : (
            <>
              <Image 
                source={require('@/assets/images/logoicon.png')} 
                style={[styles.logo, isCompact && { width: 50, height: 50, marginBottom: Spacing.md }]} 
                resizeMode="contain" 
              />

              {biometricStatus.isEnabled && (
                <View style={styles.biometricSection}>
                  <BiometricPrompt
                    onAuthenticate={handleBiometricUnlock}
                    actionLabel={`Unlock with ${biometricStatus.primaryTypeName}`}
                    disabled={loading}
                    loading={loading}
                  />
                  <View style={styles.orDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.orText}>OR USE PIN</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              )}

              <PinPad
                subtitle="Enter your PIN to unlock AXT Wallet"
                onComplete={handlePinComplete}
                disabled={loading}
                errorMessage={error}
              />
              {loading && !biometricStatus.isEnabled && (
                <ActivityIndicator
                  color={Colors.primary}
                  style={{ marginTop: Spacing.md }}
                />
              )}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/recovery' as any)}
                style={[styles.forgotLink, isCompact && { marginTop: Spacing.md }]}
              >
                <Text style={styles.forgotText}>Forgot PIN?</Text>
              </TouchableOpacity>
            </>
          )}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(6, 22, 45, 0.92)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    alignSelf: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  biometricSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    ...Typography.body,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lockoutView: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    width: '100%',
  },
  lockoutIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  lockoutMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  recoverButton: {
    marginTop: Spacing.xl,
    width: '100%',
  },
  forgotLink: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

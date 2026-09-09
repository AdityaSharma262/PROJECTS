import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { PinPad } from '@/components/ui/PinPad';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { recoverWallet } from '@/wallet/auth/recovery.service';
import { authService } from '@/wallet/auth/auth.service';
import { useAuth } from '@/context/AuthContext';

/**
 * SECURITY RULES (DO NOT VIOLATE):
 * - The mnemonic input lives in component-local state only.
 * - It is never logged, passed to navigation, or stored in Context.
 * - It is cleared (set to '') after successful vault recovery.
 * - Internal errors (address mismatch details) are NOT exposed to the user.
 */

type Step = 'enter_phrase' | 'set_new_pin' | 'confirm_new_pin';

export default function RecoveryScreen() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [step, setStep] = useState<Step>('enter_phrase');
  const [phraseInput, setPhraseInput] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Normalize and validate the entered phrase
  const handleValidatePhrase = useCallback(async () => {
    setValidating(true);
    setError(null);

    try {
      const { validateMnemonicWithReason } = await import('@/wallet/crypto/mnemonic');
      const result = validateMnemonicWithReason(phraseInput);
      if (!result.isValid) {
        setError(result.error);
        setValidating(false);
        return;
      }
      // Phrase is valid BIP-39 — move to set new PIN
      setPhraseInput(result.normalizedPhrase); // store normalized
      setStep('set_new_pin');
    } catch {
      setError('Could not validate phrase. Please try again.');
    }
    setValidating(false);
  }, [phraseInput]);

  const handleSetPin = useCallback((pin: string) => {
    setFirstPin(pin);
    setPinError(null);
    setStep('confirm_new_pin');
  }, []);

  const handleConfirmPin = useCallback(async (confirmedPin: string) => {
    if (confirmedPin !== firstPin) {
      setFirstPin(null);
      setPinError('PINs do not match. Please start again.');
      setStep('set_new_pin');
      return;
    }

    setLoading(true);
    try {
      // This verifies ownership AND creates the new vault
      await recoverWallet(phraseInput, confirmedPin);

      // Clear phrase from local state immediately after vault creation
      setPhraseInput('');

      // Authenticate the new session
      await authService.login(confirmedPin);
      await refreshAuthState(); // NavigationGuard → (main)

    } catch {
      setLoading(false);
      // NEVER expose internal error details (e.g. address mismatch specifics)
      Alert.alert(
        'Recovery Failed',
        'We could not restore your wallet. Please verify your recovery phrase and try again.',
      );
      setStep('enter_phrase');
    }
  }, [firstPin, phraseInput, refreshAuthState]);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Restoring your wallet…</Text>
      </Screen>
    );
  }

  if (step === 'set_new_pin') {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, styles.center]}
          showsVerticalScrollIndicator={false}
        >
          <PinPad
            title="Set New PIN"
            subtitle="Choose a 6-digit PIN for your restored wallet"
            onComplete={handleSetPin}
            errorMessage={pinError}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (step === 'confirm_new_pin') {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, styles.center]}
          showsVerticalScrollIndicator={false}
        >
          <PinPad
            title="Confirm PIN"
            subtitle="Re-enter your new PIN"
            onComplete={handleConfirmPin}
          />
        </ScrollView>
      </Screen>
    );
  }

  // step === 'enter_phrase'
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && { maxWidth: 540, alignSelf: 'center', width: '100%' },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={Typography.title}>Recover Wallet</Text>
            <Text style={styles.subtitle}>
              Enter your 12-word recovery phrase. This will verify your wallet and allow you to set a new PIN.
            </Text>
          </View>

          <TextInput
            style={styles.phraseInput}
            multiline
            numberOfLines={5}
            placeholder="word1 word2 word3 … word12"
            placeholderTextColor={Colors.textSecondary}
            value={phraseInput}
            onChangeText={setPhraseInput}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="default"
            secureTextEntry={false}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footer}>
            <Button
              title={validating ? 'Validating…' : 'Continue'}
              onPress={handleValidatePhrase}
              disabled={!phraseInput.trim() || validating}
            />
            <Button
              title="Back"
              variant="outline"
              onPress={() => router.back()}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
    fontSize: 13,
  },
  phraseInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});

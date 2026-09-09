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
import { validateMnemonicWithReason } from '@/wallet/crypto/mnemonic';
import { createVault } from '@/wallet/vault/vault.service';
import { authService } from '@/wallet/auth/auth.service';
import { useAuth } from '@/context/AuthContext';

type Step = 'enter_phrase' | 'set_pin' | 'confirm_pin';

export default function ImportWalletScreen() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [step, setStep] = useState<Step>('enter_phrase');
  const [phraseInput, setPhraseInput] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidatePhrase = useCallback(() => {
    setError(null);
    const result = validateMnemonicWithReason(phraseInput);
    if (!result.isValid) {
      setError(result.error);
      return;
    }
    // Store normalized phrase in local state
    setPhraseInput(result.normalizedPhrase);
    setStep('set_pin');
  }, [phraseInput]);

  const handleSetPin = useCallback((pin: string) => {
    setFirstPin(pin);
    setPinError(null);
    setStep('confirm_pin');
  }, []);

  const handleConfirmPin = useCallback(async (confirmedPin: string) => {
    if (confirmedPin !== firstPin) {
      setFirstPin(null);
      setPinError('PINs do not match. Please start again.');
      setStep('set_pin');
      return;
    }

    setLoading(true);
    try {
      // createVault encrypts the mnemonic. After this call we clear local ref.
      await createVault(phraseInput, confirmedPin);

      // Immediately authenticate the session. This also persists Account 1.
      await authService.login(confirmedPin);

      // Clear the phrase from state
      setPhraseInput('');

      // Refresh navigation auth state -> NavigationGuard will redirect to (main)
      refreshAuthState();
    } catch {
      setLoading(false);
      Alert.alert(
        'Import Failed',
        'We could not restore your wallet. Please try again.',
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

  if (step === 'set_pin') {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, styles.center]}
          showsVerticalScrollIndicator={false}
        >
          <PinPad
            title="Set Your PIN"
            subtitle="Choose a 6-digit PIN to secure your wallet"
            onComplete={handleSetPin}
            errorMessage={pinError}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (step === 'confirm_pin') {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, styles.center]}
          showsVerticalScrollIndicator={false}
        >
          <PinPad
            title="Confirm PIN"
            subtitle="Re-enter your PIN to confirm"
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
            <Text style={Typography.title}>Import Wallet</Text>
            <Text style={styles.subtitle}>
              Enter your Secret Recovery Phrase to restore your wallet.
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
              title="Continue"
              onPress={handleValidatePhrase}
              disabled={!phraseInput.trim()}
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
    fontSize: 14,
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
    marginTop: Spacing.lg,
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

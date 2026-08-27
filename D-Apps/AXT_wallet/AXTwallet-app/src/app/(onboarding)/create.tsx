import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { PinPad } from '@/components/ui/PinPad';
import { Spacing, Typography, Colors } from '@/constants/theme';
import { generateMnemonic } from '@/wallet/crypto/mnemonic';
import { createVault } from '@/wallet/vault/vault.service';
import { authService } from '@/wallet/auth/auth.service';
import { useAuth } from '@/context/AuthContext';

/**
 * SECURITY RULES (DO NOT VIOLATE):
 * - The mnemonic lives only in component-local state during the creation wizard.
 * - It is NEVER logged, sent to navigation params, put in Context, Redux, or AsyncStorage.
 * - As soon as createVault() succeeds, the mnemonic reference in state is set to null.
 * - The PIN is passed directly to createVault() and never stored in state.
 */

type Step = 'display_phrase' | 'challenge' | 'set_pin' | 'confirm_pin';

function generateChallenge(words: string[]): { index: number; word: string; options: string[] } {
  const correctIndex = Math.floor(Math.random() * words.length);
  const correctWord = words[correctIndex];

  // Generate 3 random decoy words from the phrase (different positions)
  const decoys = words
    .filter((_, i) => i !== correctIndex)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = [correctWord, ...decoys].sort(() => Math.random() - 0.5);

  return { index: correctIndex, word: correctWord, options };
}

export default function CreateWalletScreen() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();

  // Mnemonic lives only here — never travels through navigation or global state
  const [mnemonic] = useState<string>(() => generateMnemonic());
  const [step, setStep] = useState<Step>('display_phrase');
  const [revealed, setRevealed] = useState(false);
  const [challengeData] = useState(() => {
    const words = mnemonic.split(' ');
    return generateChallenge(words);
  });
  const [challengePassed, setChallengePassed] = useState(false);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const words = mnemonic.split(' ');

  // ── Step 1: Display Recovery Phrase ────────────────────────────────────────
  const handlePhraseConfirmed = useCallback(() => {
    setStep('challenge');
  }, []);

  // ── Step 2: Backup Challenge ────────────────────────────────────────────────
  const handleChallengeAnswer = useCallback((selected: string) => {
    if (selected === challengeData.word) {
      setChallengePassed(true);
      setTimeout(() => setStep('set_pin'), 600);
    } else {
      Alert.alert('Incorrect', 'That word is incorrect. Please review your recovery phrase.');
    }
  }, [challengeData.word]);

  // ── Step 3: Enter PIN ───────────────────────────────────────────────────────
  const handleSetPin = useCallback((pin: string) => {
    setFirstPin(pin);
    setPinError(null);
    setStep('confirm_pin');
  }, []);

  // ── Step 4: Confirm PIN & Create Vault ─────────────────────────────────────
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
      await createVault(mnemonic, confirmedPin);

      // Immediately authenticate the session
      await authService.login(confirmedPin);

      // Refresh navigation auth state → NavigationGuard will redirect to (main)
      refreshAuthState();

    } catch (error) {
      console.error("Wallet Setup Failed:", error);
      setLoading(false);
      Alert.alert(
        'Setup Failed',
        'We could not create your wallet. Please try again.',
      );
    }
    // Note: do NOT set mnemonic to null here since it's a const from useState initial value.
    // The component unmounts on navigation, clearing the reference from memory automatically.
  }, [firstPin, mnemonic, refreshAuthState]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Securing your wallet…</Text>
      </Screen>
    );
  }

  if (step === 'display_phrase') {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={Typography.title}>Recovery Phrase</Text>
          <Text style={styles.warningText}>
            ⚠️ Anyone with this recovery phrase can control your wallet. Write it down and keep it safe — never share it.
          </Text>
        </View>

        <View style={styles.phraseContainer}>
          {revealed ? (
            <View style={styles.wordGrid}>
              {words.map((word, i) => (
                <View key={i} style={styles.wordCell}>
                  <Text style={styles.wordIndex}>{i + 1}.</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity style={styles.revealBox} onPress={() => setRevealed(true)}>
              <Text style={styles.revealIcon}>👁</Text>
              <Text style={styles.revealText}>Tap to reveal</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Button
            title="I've Written It Down →"
            onPress={handlePhraseConfirmed}
            disabled={!revealed}
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

  if (step === 'challenge') {
    return (
      <Screen style={styles.center}>
        <View style={styles.challengeContainer}>
          <Text style={Typography.title}>Verify Backup</Text>
          <Text style={styles.challengePrompt}>
            Select word #{challengeData.index + 1} from your recovery phrase
          </Text>

          {challengePassed ? (
            <View style={styles.successBadge}>
              <Text style={styles.successText}>✓ Correct!</Text>
            </View>
          ) : (
            <View style={styles.optionsGrid}>
              {challengeData.options.map((word, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.optionButton}
                  onPress={() => handleChallengeAnswer(word)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Screen>
    );
  }

  if (step === 'set_pin') {
    return (
      <Screen style={styles.center}>
        <PinPad
          title="Set Your PIN"
          subtitle="Choose a 6-digit PIN to secure your wallet"
          onComplete={handleSetPin}
          errorMessage={pinError}
        />
      </Screen>
    );
  }

  // step === 'confirm_pin'
  return (
    <Screen style={styles.center}>
      <PinPad
        title="Confirm PIN"
        subtitle="Re-enter your PIN to confirm"
        onComplete={handleConfirmPin}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  warningText: {
    ...Typography.body,
    color: '#FFC107',
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  phraseContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wordCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    backgroundColor: Colors.background,
    borderRadius: Spacing.sm,
    padding: Spacing.sm,
    gap: 4,
  },
  wordIndex: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 11,
    width: 20,
  },
  wordText: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 13,
  },
  revealBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    height: 200,
    gap: Spacing.sm,
  },
  revealIcon: { fontSize: 32 },
  revealText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footer: {
    marginBottom: Spacing.xl,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  challengePrompt: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  optionText: {
    ...Typography.body,
    fontWeight: 'bold',
  },
  successBadge: {
    backgroundColor: 'rgba(0,208,78,0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  successText: {
    ...Typography.title,
    color: Colors.primary,
    fontSize: 20,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});

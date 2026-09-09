import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { Screen } from '@/components/ui/Screen';
import { PinPad } from '@/components/ui/PinPad';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { authService } from '@/wallet/auth/auth.service';

type RecoveryFlowStep = 'safety_intro' | 'question_1' | 'question_2' | 'pin_entry' | 'reveal';

export default function ManageRecoveryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [step, setStep] = useState<RecoveryFlowStep>('safety_intro');
  const [q1Answer, setQ1Answer] = useState<number | null>(null);
  const [q1Error, setQ1Error] = useState<string | null>(null);
  const [q2Answer, setQ2Answer] = useState<number | null>(null);
  const [q2Error, setQ2Error] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Decrypted mnemonic held ONLY in memory during the reveal step — never persisted
  const [decryptedPhrase, setDecryptedPhrase] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Activate screen capture protection where supported
  useEffect(() => {
    let isMounted = true;
    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch {
        // Platform or simulator unsupported
      }
    };

    enableProtection();

    return () => {
      isMounted = false;
      try {
        ScreenCapture.allowScreenCaptureAsync();
      } catch {
        // Clean up
      }
      // Zero out memory on unmount
      setDecryptedPhrase(null);
    };
  }, []);

  const handleExit = useCallback(() => {
    setDecryptedPhrase(null);
    router.navigate('/(main)/settings');
  }, [router]);

  const handleQ1Select = (optionIndex: number) => {
    setQ1Answer(optionIndex);
    if (optionIndex === 0) {
      setQ1Error(null);
    } else {
      setQ1Error('Incorrect: AXT Wallet or any legitimate entity will NEVER ask for your secret phrase. Anyone asking for it is attempting to steal your assets.');
    }
  };

  const handleQ2Select = (optionIndex: number) => {
    setQ2Answer(optionIndex);
    if (optionIndex === 1) {
      setQ2Error(null);
    } else {
      setQ2Error('Incorrect: AXT Wallet is non-custodial. We cannot reset your phrase or recover your funds if your phrase is lost or stolen.');
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setIsVerifying(true);
    setPinError(null);

    try {
      // Reuses the single-source-of-truth PIN validation and lockout tracker
      const mnemonic = await authService.revealRecoveryPhrase(pin);
      setDecryptedPhrase(mnemonic);
      setStep('reveal');
    } catch (err: any) {
      const isLockedOut = authService.getStatus() === 'locked_out';
      if (isLockedOut) {
        const remaining = Math.ceil(authService.getLockoutRemaining() / 1000);
        setPinError(`Wallet locked out. Try again in ${remaining}s.`);
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const words = decryptedPhrase ? decryptedPhrase.trim().split(/\s+/).filter(Boolean) : [];

  return (
    <Screen style={styles.container}>
      {/* ── Top Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleExit}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Wallet Recovery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && { maxWidth: 540, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1: SAFETY CONFIRMATION (INTRO) ──────────── */}
        {step === 'safety_intro' && (
          <View style={styles.stepContainer}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>STEP 1 OF 3 • SAFETY WARNING</Text>
            </View>

            <Text style={Typography.title}>Protect Your Recovery Phrase</Text>
            <Text style={styles.introSubtitle}>
              Your Secret Recovery Phrase gives complete and irreversible control over all assets in this wallet.
            </Text>

            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={styles.warningCardText}>
                <Text style={styles.warningHeading}>Crucial Security Rules</Text>
                <Text style={styles.warningBody}>
                  • Anyone with these words can steal your entire wallet balance.
                </Text>
                <Text style={styles.warningBody}>
                  • Never share your phrase with anyone, including AXT Wallet support.
                </Text>
                <Text style={styles.warningBody}>
                  • If you lose your phrase, no one in the world can help you recover your funds.
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                Before revealing the phrase, you will answer two brief security questions to confirm you understand the risks, followed by your wallet PIN.
              </Text>
            </View>

            <Button
              title="I Understand, Continue →"
              onPress={() => setStep('question_1')}
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        )}

        {/* ── STEP 2: QUESTION 1 ────────────────────────────── */}
        {step === 'question_1' && (
          <View style={styles.stepContainer}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>STEP 2 OF 3 • SECURITY CONFIRMATION</Text>
            </View>

            <Text style={Typography.title}>Security Check 1</Text>
            <Text style={styles.questionPrompt}>
              If anyone (including someone claiming to be AXT Wallet support) asks for your Secret Recovery Phrase, what should you do?
            </Text>

            <TouchableOpacity
              style={[
                styles.optionCard,
                q1Answer === 0 && styles.optionCardCorrect,
              ]}
              onPress={() => handleQ1Select(0)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, q1Answer === 0 && styles.radioCircleCorrect]}>
                {q1Answer === 0 && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.optionText}>
                Never share it. Nobody legitimate will EVER ask for my recovery phrase.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                q1Answer === 1 && styles.optionCardIncorrect,
              ]}
              onPress={() => handleQ1Select(1)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, q1Answer === 1 && styles.radioCircleIncorrect]}>
                {q1Answer === 1 && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.optionText}>
                Share it only if support needs it to fix or restore my wallet.
              </Text>
            </TouchableOpacity>

            {q1Error && (
              <View style={styles.quizErrorCard}>
                <Text style={styles.quizErrorText}>{q1Error}</Text>
              </View>
            )}

            <Button
              title="Next Question →"
              onPress={() => setStep('question_2')}
              disabled={q1Answer !== 0}
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        )}

        {/* ── STEP 3: QUESTION 2 ────────────────────────────── */}
        {step === 'question_2' && (
          <View style={styles.stepContainer}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>STEP 2 OF 3 • SECURITY CONFIRMATION</Text>
            </View>

            <Text style={Typography.title}>Security Check 2</Text>
            <Text style={styles.questionPrompt}>
              What happens if you lose your recovery phrase or someone else gets access to it?
            </Text>

            <TouchableOpacity
              style={[
                styles.optionCard,
                q2Answer === 0 && styles.optionCardIncorrect,
              ]}
              onPress={() => handleQ2Select(0)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, q2Answer === 0 && styles.radioCircleIncorrect]}>
                {q2Answer === 0 && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.optionText}>
                AXT Wallet can reset my phrase or restore my funds from backup servers.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                q2Answer === 1 && styles.optionCardCorrect,
              ]}
              onPress={() => handleQ2Select(1)}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, q2Answer === 1 && styles.radioCircleCorrect]}>
                {q2Answer === 1 && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.optionText}>
                My funds could be permanently stolen or lost forever, and no one can restore them.
              </Text>
            </TouchableOpacity>

            {q2Error && (
              <View style={styles.quizErrorCard}>
                <Text style={styles.quizErrorText}>{q2Error}</Text>
              </View>
            )}

            <Button
              title="Continue to PIN Verification →"
              onPress={() => {
                setPinError(null);
                setStep('pin_entry');
              }}
              disabled={q2Answer !== 1}
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        )}

        {/* ── STEP 4: PIN VERIFICATION ─────────────────────── */}
        {step === 'pin_entry' && (
          <View style={styles.stepContainer}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>FINAL STEP • VERIFY PIN</Text>
            </View>

            <Text style={Typography.title}>Enter Wallet PIN</Text>
            <Text style={styles.introSubtitle}>
              Confirm your existing wallet PIN to authorize viewing your recovery phrase.
            </Text>

            {isVerifying ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Decrypting recovery phrase securely…</Text>
              </View>
            ) : (
              <PinPad
                onComplete={handlePinSubmit}
                disabled={isVerifying}
                errorMessage={pinError || undefined}
              />
            )}
          </View>
        )}

        {/* ── STEP 5: RECOVERY PHRASE REVEAL ────────────────── */}
        {step === 'reveal' && (
          <View style={styles.stepContainer}>
            <View style={styles.revealedHeaderBadge}>
              <Text style={styles.revealedHeaderBadgeText}>
                SECRET RECOVERY PHRASE ({words.length} WORDS)
              </Text>
            </View>

            <View style={styles.warningCardRed}>
              <Text style={styles.warningIcon}>🛡️</Text>
              <View style={styles.warningCardText}>
                <Text style={styles.warningHeadingRed}>Strict Security Notice</Text>
                <Text style={styles.warningBodyRed}>
                  Never share your recovery phrase with anyone. Anyone with these words has full control of your wallet.
                </Text>
              </View>
            </View>

            {/* Tap to Reveal / Hide Box */}
            <View style={styles.phraseContainer}>
              {isRevealed ? (
                <View style={styles.wordGrid}>
                  {words.map((word, i) => (
                    <View key={i} style={styles.wordCell}>
                      <Text style={styles.wordIndex}>{i + 1}.</Text>
                      <Text style={styles.wordText} numberOfLines={1}>
                        {word}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.revealBox}
                  onPress={() => setIsRevealed(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.revealIcon}>👁</Text>
                  <Text style={styles.revealTitle}>Tap to Reveal Phrase</Text>
                  <Text style={styles.revealSubtitle}>
                    Make sure nobody is watching your screen
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {isRevealed && (
              <TouchableOpacity
                style={styles.hideButton}
                onPress={() => setIsRevealed(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.hideButtonText}>🙈 Hide Recovery Phrase</Text>
              </TouchableOpacity>
            )}

            <Button
              title="Done • Exit Securely"
              onPress={handleExit}
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    fontSize: 32,
    color: Colors.text,
    lineHeight: 34,
  },
  headerTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  stepContainer: {
    width: '100%',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  introSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: Spacing.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningCardRed: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 76, 76, 0.08)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  warningIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  warningCardText: {
    flex: 1,
  },
  warningHeading: {
    ...Typography.subtitle,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 4,
  },
  warningHeadingRed: {
    ...Typography.subtitle,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 4,
  },
  warningBody: {
    ...Typography.body,
    fontSize: 12,
    color: '#FFC107',
    lineHeight: 18,
    opacity: 0.95,
  },
  warningBodyRed: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.error,
    lineHeight: 18,
    opacity: 0.95,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  infoBoxText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  questionPrompt: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    fontWeight: '500',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  optionCardCorrect: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 208, 78, 0.08)',
  },
  optionCardIncorrect: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 76, 76, 0.08)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleCorrect: {
    borderColor: Colors.primary,
  },
  radioCircleIncorrect: {
    borderColor: Colors.error,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  quizErrorCard: {
    backgroundColor: 'rgba(255, 76, 76, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  quizErrorText: {
    ...Typography.body,
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  revealedHeaderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  revealedHeaderBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  phraseContainer: {
    marginVertical: Spacing.md,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  wordCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  wordIndex: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    width: 24,
  },
  wordText: {
    ...Typography.body,
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    color: Colors.text,
  },
  revealBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    minHeight: 180,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  revealIcon: {
    fontSize: 34,
    marginBottom: 4,
  },
  revealTitle: {
    ...Typography.subtitle,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  revealSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  hideButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Spacing.md,
    marginTop: Spacing.sm,
  },
  hideButtonText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

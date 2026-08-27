import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface PinPadProps {
  title?: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  errorMessage?: string | null;
}

const PIN_LENGTH = 6;

/**
 * A numeric PIN entry component.
 *
 * SECURITY RULES (DO NOT VIOLATE):
 * - The collected PIN is passed ONCE to onComplete(), then wiped from local state.
 * - Never log the pin value.
 * - Never persist the pin beyond this component's lifetime.
 */
export function PinPad({ title, subtitle, onComplete, disabled, errorMessage }: PinPadProps) {
  const [digits, setDigits] = useState<string[]>([]);

  const handlePress = useCallback((digit: string) => {
    if (disabled) return;
    setDigits(prev => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = [...prev, digit];
      if (next.length === PIN_LENGTH) {
        const pin = next.join('');
        // Clear immediately before calling onComplete to minimise lifetime,
        // and wrap both in setTimeout to avoid updating state during render
        setTimeout(() => {
          setDigits([]);
          onComplete(pin);
        }, 0);
      }
      return next;
    });
  }, [disabled, onComplete]);

  const handleDelete = useCallback(() => {
    setDigits(prev => prev.slice(0, -1));
  }, []);

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Dot indicators */}
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < digits.length && styles.dotFilled]}
          />
        ))}
      </View>

      {/* Error message */}
      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {keys.map((key, idx) => {
          if (key === '') return <View key={idx} style={styles.keyEmpty} />;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.key, disabled && styles.keyDisabled]}
              onPress={() => key === '⌫' ? handleDelete() : handlePress(key)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  error: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    marginTop: Spacing.lg,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyEmpty: {
    width: 80,
    height: 80,
    margin: 4,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    ...Typography.title,
    fontSize: 22,
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();
  const [digits, setDigits] = useState<string[]>([]);

  // Dynamically calculate key size based on screen dimensions
  const isCompact = height < 700 || width < 360;
  const isTablet = width >= 600;
  
  const keySize = isTablet
    ? 84
    : isCompact
    ? Math.min(62, Math.max(50, Math.floor((width - 64) / 3.8)))
    : Math.min(76, Math.max(60, Math.floor((width - 48) / 3.6)));

  const keypadWidth = keySize * 3 + 28;
  const fontSize = isCompact ? 20 : isTablet ? 24 : 22;
  const dotSize = isCompact ? 13 : 16;

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
      {title ? <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}

      {/* Dot indicators */}
      <View style={[styles.dots, isCompact && { marginTop: Spacing.sm, marginBottom: Spacing.sm }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
              i < digits.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {/* Error message */}
      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : null}

      {/* Keypad */}
      <View style={[styles.keypad, { width: keypadWidth, marginTop: isCompact ? Spacing.sm : Spacing.md }]}>
        {keys.map((key, idx) => {
          if (key === '') {
            return (
              <View
                key={idx}
                style={[styles.keyEmpty, { width: keySize, height: keySize }]}
              />
            );
          }
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.key,
                { width: keySize, height: keySize, borderRadius: keySize / 2 },
                disabled && styles.keyDisabled,
              ]}
              onPress={() => key === '⌫' ? handleDelete() : handlePress(key)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, { fontSize }]}>{key}</Text>
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
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  dot: {
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
    paddingHorizontal: Spacing.md,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  key: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyEmpty: {
    margin: 4,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    ...Typography.title,
    color: Colors.text,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';

/**
 * PrivacyShield covers the entire application window when the app transitions
 * away from the active state (such as entering the OS app switcher or background).
 *
 * This prevents the OS snapshot cache from recording sensitive screen data,
 * wallet balances, private keys, or recovery phrases.
 */
export function PrivacyShield() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (appState === 'active') {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </View>
        <Text style={styles.title}>AXT Wallet</Text>
        <Text style={styles.subtitle}>Protected Security Session</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  content: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 208, 78, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 78, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoIcon: {
    fontSize: 36,
  },
  title: {
    ...Typography.title,
    fontSize: 22,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});

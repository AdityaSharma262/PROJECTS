import { useEffect, useState } from 'react';
import { Image, StyleSheet, Animated, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { status } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSplashDone(true));
    }, 1800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!splashDone) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('@/../assets/images/background--image.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <Image
          source={require('@/../assets/images/logoicon.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  // After splash, navigation guard in _layout.tsx takes over based on auth status.
  // Show a minimal loader while auth is still initializing (vault check in progress).
  if (status === 'initializing') {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Auth state is now known — NavigationGuard in _layout.tsx will redirect.
  // Return null to avoid flashing the wrong screen.
  return null;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 180,
    height: 180,
  },
});

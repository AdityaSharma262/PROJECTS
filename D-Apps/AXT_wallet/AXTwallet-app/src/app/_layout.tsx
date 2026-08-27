import 'react-native-get-random-values';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

/**
 * Navigation guard — redirects users based on authentication state.
 * This is the security gate: protected screens cannot be accessed
 * unless the auth state is 'unlocked'.
 */
function NavigationGuard() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (status === 'initializing') return; // Wait — don't redirect yet

    const inMain = segments[0] === '(main)';
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (status === 'no_wallet') {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
    } else if (status === 'locked' || status === 'locked_out') {
      if (!inAuth) router.replace('/(auth)/unlock');
    } else if (status === 'unlocked') {
      if (!inMain) router.replace('/(main)');
    }
  }, [status, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="actions" />
      </Stack>
    </AuthProvider>
  );
}

import 'react-native-get-random-values';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AccountProvider } from '@/context/AccountContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { WalletConnectProvider, useWalletConnect } from '@/context/WalletConnectContext';
import { BiometricProvider } from '@/context/BiometricContext';
import { ConnectionProposalModal } from '@/components/walletconnect/ConnectionProposalModal';
import { TransactionRequestModal } from '@/components/walletconnect/TransactionRequestModal';
import { MessageSignRequestModal } from '@/components/walletconnect/MessageSignRequestModal';
import { PrivacyShield } from '@/components/security/PrivacyShield';
import { isValidWalletConnectUri } from '@/blockchain/walletconnect/walletconnect.service';

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
    const inActions = segments[0] === 'actions';

    if (status === 'no_wallet') {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
    } else if (status === 'locked' || status === 'locked_out') {
      if (!inAuth) router.replace('/(auth)/unlock');
    } else if (status === 'unlocked') {
      // Unlocked session allows access to both (main) tabs and actions (send, receive)
      if (!inMain && !inActions) router.replace('/(main)');
    }
  }, [status, segments, router]);

  return null;
}

/**
 * Deep link listener to automatically pair with WalletConnect URIs
 * when coming from mobile browsers or QR codes.
 */
function WalletConnectDeepLinkHandler() {
  const { connect, isInitialized } = useWalletConnect();

  useEffect(() => {
    if (!isInitialized) return;

    const handleUrl = (url: string | null) => {
      if (!url) return;

      try {
        let uri = '';
        if (url.startsWith('wc:')) {
          uri = url;
        } else if (url.includes('wc?uri=')) {
          const parsed = Linking.parse(url);
          if (parsed.queryParams?.uri) {
            uri = decodeURIComponent(parsed.queryParams.uri as string);
          }
        }

        if (uri.startsWith('wc:') && isValidWalletConnectUri(uri)) {
          connect(uri).catch(() => {
            // Silently handle pairing failure in production
          });
        }
      } catch {
        // Silently ignore malformed deep links
      }
    };

    // Initial URL on launch
    Linking.getInitialURL().then(handleUrl);

    // Runtime deep link events
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, [isInitialized, connect]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BiometricProvider>
        <AccountProvider>
          <NetworkProvider>
            <WalletConnectProvider>
              <NavigationGuard />
              <WalletConnectDeepLinkHandler />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(main)" />
                <Stack.Screen name="actions" />
              </Stack>
              {/* Global WalletConnect Request Modals */}
              <ConnectionProposalModal />
              <TransactionRequestModal />
              <MessageSignRequestModal />
              {/* App Privacy Shield for OS snapshot protection */}
              <PrivacyShield />
            </WalletConnectProvider>
          </NetworkProvider>
        </AccountProvider>
      </BiometricProvider>
    </AuthProvider>
  );
}

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ActionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="send" options={{ title: 'Send Crypto' }} />
      <Stack.Screen name="receive" options={{ title: 'Receive Crypto' }} />
    </Stack>
  );
}

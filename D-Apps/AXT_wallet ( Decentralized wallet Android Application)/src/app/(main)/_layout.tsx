import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Text, Image, View, StyleSheet } from 'react-native';

function TabBarIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text
        style={[styles.tabIconText, focused && styles.tabIconTextFocused]}
        numberOfLines={1}
      >
        {icon}
      </Text>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleAlign: 'center',
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
            <Image
              source={require('../../../assets/images/WalletLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="💰" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          tabBarLabel: 'Assets',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="💎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📜" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabBarIcon icon="⚙️" focused={focused} />,
        }}
      />
      {/* Sub-screens navigated from Settings — hidden from bottom tab bar */}
      <Tabs.Screen
        name="connected-dapps"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="terms"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="manage-recovery"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  logo: {
    width: 140,
    height: 32,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
  },
  tabIconText: {
    fontSize: 20,
    textAlign: 'center',
    opacity: 0.45,
    includeFontPadding: false,
  },
  tabIconTextFocused: {
    fontSize: 22,
    opacity: 1,
  },
});

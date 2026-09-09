import React from 'react';
import { View, StyleSheet, Text, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { NetworkConfig } from '@/blockchain/networks/network.types';
import { getChainIconSource } from '@/blockchain/networks/network.icon';
import { Colors } from '@/constants/theme';

interface ChainIconProps {
  network?: NetworkConfig | null;
  chainId?: number;
  symbol?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function ChainIcon({
  network,
  chainId,
  symbol,
  size = 24,
  style,
}: ChainIconProps) {
  const source = getChainIconSource(network || chainId || symbol);
  const borderRadius = size / 2;

  if (source) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
          },
          style,
        ]}
      >
        <Image
          source={source}
          style={{ width: size, height: size, borderRadius }}
          contentFit="contain"
        />
      </View>
    );
  }

  // Fallback for custom or unrecognized chain
  const initial = symbol
    ? symbol.slice(0, 2).toUpperCase()
    : network?.shortName
    ? network.shortName.slice(0, 2).toUpperCase()
    : '?';

  return (
    <View
      style={[
        styles.container,
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      <Text style={[styles.fallbackText, { fontSize: Math.max(9, Math.floor(size * 0.45)) }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  fallbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fallbackText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
});

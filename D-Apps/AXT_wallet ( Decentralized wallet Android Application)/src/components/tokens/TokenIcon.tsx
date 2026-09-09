import React, { useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { resolveTokenLogoUrl } from '@/blockchain/tokens/token.logo';
import { TokenConfig } from '@/blockchain/tokens/token.types';
import { getChainIconSource } from '@/blockchain/networks/network.icon';

interface TokenIconProps {
  symbol: string;
  name?: string;
  logoUrl?: string;
  tokenConfig?: TokenConfig;
  isNative?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function TokenIcon({
  symbol,
  name,
  logoUrl,
  tokenConfig,
  isNative = false,
  size = 40,
  style,
}: TokenIconProps) {
  const [imageError, setImageError] = useState(false);

  // 1. Check local crisp SVG source first (e.g. eth.svg, bnb.svg, pol.svg)
  const localSvgSource = React.useMemo(() => {
    return getChainIconSource(symbol);
  }, [symbol]);

  // 2. Attempt to resolve remote logo image URL
  const resolvedUrl = React.useMemo(() => {
    if (tokenConfig?.logoUrl) {
      return resolveTokenLogoUrl(tokenConfig);
    }
    if (logoUrl) {
      return resolveTokenLogoUrl({ symbol, logoUrl });
    }
    return resolveTokenLogoUrl(symbol);
  }, [symbol, logoUrl, tokenConfig]);

  const borderRadius = size / 2;
  const initialText = symbol ? symbol.slice(0, isNative ? 2 : 3).toUpperCase() : '?';

  // If local SVG source exists, use it directly
  if (localSvgSource) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          style,
        ]}
      >
        <Image
          source={localSvgSource}
          style={{
            width: size,
            height: size,
            borderRadius,
          }}
          contentFit="contain"
        />
      </View>
    );
  }

  // If remote URL is available and hasn't failed loading
  if (resolvedUrl && !imageError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          style,
        ]}
      >
        <Image
          source={{ uri: resolvedUrl }}
          style={{
            width: size,
            height: size,
            borderRadius,
          }}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // Graceful fallback: Styled initials badge
  return (
    <View
      style={[
        styles.container,
        isNative ? styles.nativeIcon : styles.tokenIcon,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          isNative ? styles.nativeIconText : styles.tokenIconText,
          { fontSize: size <= 32 ? 11 : 13 },
        ]}
        numberOfLines={1}
      >
        {initialText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    flexShrink: 0,
  },
  nativeIcon: {
    backgroundColor: 'rgba(0, 208, 78, 0.15)',
    borderColor: 'rgba(0, 208, 78, 0.3)',
  },
  tokenIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: Colors.border,
  },
  nativeIconText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  tokenIconText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
});

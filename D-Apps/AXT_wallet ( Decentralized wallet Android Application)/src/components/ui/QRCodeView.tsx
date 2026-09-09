import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { generateQRCodeMatrix } from '@/utils/qr.utils';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function QRCodeView({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  style,
}: QRCodeViewProps) {
  const matrix = useMemo(() => {
    if (!value) return [];
    try {
      return generateQRCodeMatrix(value);
    } catch {
      return [];
    }
  }, [value]);

  if (!matrix || matrix.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, backgroundColor },
          style,
        ]}
      />
    );
  }

  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
        },
        style,
      ]}
    >
      {matrix.map((row, rIdx) => (
        <View key={`r-${rIdx}`} style={[styles.row, { height: cellSize }]}>
          {row.map((isDark, cIdx) => (
            <View
              key={`c-${cIdx}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: isDark ? color : backgroundColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});

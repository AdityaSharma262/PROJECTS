import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false,
  disabled = false,
  style 
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.border;
    if (variant === 'secondary') return Colors.surface;
    if (variant === 'outline') return 'transparent';
    return Colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return Colors.textSecondary;
    if (variant === 'outline') return Colors.primary;
    return Colors.text;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[Typography.button, { color: getTextColor() }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28, // Matches the reference pill shape
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.primary,
  }
});

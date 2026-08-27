import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style
        ]}
        placeholderTextColor={Colors.textSecondary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.text, // White background matching reference image
    color: '#000000', // Black text for contrast on white background
    height: 56,
    borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
  }
});

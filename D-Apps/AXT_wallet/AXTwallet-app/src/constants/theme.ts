export const Colors = {
  background: '#040b16',
  primary: '#00D04E',
  surface: '#0A192F',
  text: '#FFFFFF',
  textSecondary: '#8892B0',
  error: '#FF4C4C',
  border: '#1E2D4A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  body: {
    fontSize: 14,
    color: Colors.text,
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
};

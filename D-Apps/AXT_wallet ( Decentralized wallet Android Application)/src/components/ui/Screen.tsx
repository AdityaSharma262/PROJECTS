import { ReactNode } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  style?: object;
  noSafeArea?: boolean;
}

export function Screen({ children, style, noSafeArea = false }: ScreenProps) {
  const content = (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );

  const background = (
    <ImageBackground
      source={require('@/../assets/images/background--image.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      {noSafeArea ? content : <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>}
    </ImageBackground>
  );

  return background;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
});

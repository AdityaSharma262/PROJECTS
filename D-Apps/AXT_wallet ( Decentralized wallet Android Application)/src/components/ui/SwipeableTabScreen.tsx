import React, { useRef } from 'react';
import { PanResponder, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

interface SwipeableTabScreenProps {
  leftRoute?: string;  // Route to navigate when swiping LEFT (towards right side of screen -> next tab)
  rightRoute?: string; // Route to navigate when swiping RIGHT (towards left side of screen -> prev tab)
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function SwipeableTabScreen({
  leftRoute,
  rightRoute,
  style,
  children,
}: SwipeableTabScreenProps) {
  const router = useRouter();

  // Create PanResponder to capture dominant horizontal swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Dominantly horizontal gesture (> 25px horizontal and 1.8x greater than vertical)
        return Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy) * 1.8;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        // Swiped Left (finger moved right-to-left) -> Next Tab
        if (dx < -50 || (dx < -25 && vx < -0.35)) {
          if (leftRoute) {
            router.navigate(leftRoute as any);
          }
        }
        // Swiped Right (finger moved left-to-right) -> Previous Tab
        else if (dx > 50 || (dx > 25 && vx > 0.35)) {
          if (rightRoute) {
            router.navigate(rightRoute as any);
          }
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

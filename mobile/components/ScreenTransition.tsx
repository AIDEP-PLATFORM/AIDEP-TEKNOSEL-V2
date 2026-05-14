import { useRef, useCallback } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Yukarı kayma miktarı (px). Harita gibi sabit ekranlar için 0 ver. Varsayılan: 12 */
  slideAmount?: number;
}

/**
 * Tab ekranlarına geçiş efekti ekler.
 * Ekran odaklandığında fade-in + hafif yukarı kayma.
 */
export default function ScreenTransition({ children, style, slideAmount = 12 }: Props) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideAmount)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      translateY.setValue(slideAmount);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [])
  );

  return (
    <Animated.View
      style={[
        styles.base,
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});

// 🎨 EDU AR Logo Component - Sử dụng logo.png
// Logo với animations mượt mà sử dụng React Native Reanimated

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Easing } from 'react-native';

interface EDUARLogoImageProps {
  size?: number;
  animated?: boolean;
  showGlow?: boolean;
  onAnimationComplete?: () => void;
}

const EDUARLogoImage: React.FC<EDUARLogoImageProps> = ({ 
  size = 200, 
  animated = true,
  showGlow = true,
  onAnimationComplete
}) => {
  // Animated values - START WITH VISIBLE VALUES AS FALLBACK
  const scaleAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowScaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0.3)).current;
  
  // 🎯 ENSURE LOGO IS VISIBLE - Fallback
  useEffect(() => {
    console.log('🎨 EDUARLogoImage mounted, animated:', animated, 'size:', size);
  }, []);

  useEffect(() => {
    if (animated) {
      // Entry animation sequence
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start((finished) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });

      // Continuous glow animation
      if (showGlow) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowScaleAnim, {
              toValue: 1.1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(glowScaleAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacityAnim, {
              toValue: 0.6,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacityAnim, {
              toValue: 0.3,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Rotation animation disabled per user request
      // Animated.loop(
      //   Animated.timing(rotationAnim, {
      //     toValue: 1,
      //     duration: 20000,
      //     easing: Easing.linear,
      //     useNativeDriver: true,
      //   })
      // ).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated, showGlow]);

  const rotationInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow Effect Background */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowBackground,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              transform: [{ scale: glowScaleAnim }],
              opacity: glowOpacityAnim,
            },
          ]}
        />
      )}

      {/* Main Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: size,
            height: size,
            borderRadius: size * 0.15, // 15% border radius như design
            transform: [
              { scale: scaleAnim }
              // Rotation disabled: { rotate: rotationInterpolate }
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Logo Image với Error Handling */}
        <Image
          source={require('../data/logo.png')}
          style={[
            styles.logoImage,
            {
              width: size,
              height: size,
              borderRadius: size * 0.15,
            }
          ]}
          resizeMode="cover"
          onLoad={() => console.log('✅ Logo image loaded successfully')}
          onError={(error) => console.error('❌ Logo image failed to load:', error.nativeEvent.error)}
        />

        {/* Overlay Pattern for texture */}
        <View style={styles.patternOverlay}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.patternRing,
                {
                  width: size * (0.8 - i * 0.2),
                  height: size * (0.8 - i * 0.2),
                  borderRadius: size * (0.4 - i * 0.1),
                  opacity: 0.1 - i * 0.02,
                }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    backgroundColor: '#EFEAA8', // Light golden glow
    // Shadow effect
    shadowColor: '#EFEAA8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Main shadow
    shadowColor: '#6E0019', // Dark red shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    // Border effect
    borderWidth: 2,
    borderColor: '#EFEAA8',
  },
  logoImage: {
    position: 'absolute',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.15,
  },
  patternRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#EFEAA8',
    backgroundColor: 'transparent',
  },
});

export default EDUARLogoImage;

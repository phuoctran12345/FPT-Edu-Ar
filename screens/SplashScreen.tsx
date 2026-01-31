// 🎨 Splash Screen - Màn hình khởi động
// Design từ Figma: 01_Splash với logo EDU AR đẹp mắt

import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EDUARLogoImage from '../components/EDUARLogoImage';
import DongSonBackground from '../components/DongSonBackground';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  // Animated values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleLogoAnimationComplete = useCallback(() => {
    // Start text animation after logo completes
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Auto transition after 3.5s total
    setTimeout(() => {
      handleComplete();
    }, 1500);
  }, [handleComplete]);

  useEffect(() => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Background màu đỏ đô với gradient */}
      <Animated.View style={[styles.gradientBackground, { opacity: backgroundOpacity }]}>
        {/* Base màu đỏ đô */}
        <View style={styles.baseRedLayer} />
        
        {/* Gradient layers để tạo depth */}
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        
        {/* Họa tiết trống đồng Đông Sơn */}
        <DongSonBackground opacity={0.2} scale={1.2} />
        
        {/* Decorative elements với cờ và chim Lạc */}
        <View style={styles.decorativeElements}>
          {/* Cờ sao vàng decorative - top corners */}
          <Image
            source={require('../data/codosaovang.png')}
            style={[styles.decorativeFlagTopLeft, { opacity: 0.08 }]}
            resizeMode="contain"
          />
          <Image
            source={require('../data/codosaovangngang.png')}
            style={[styles.decorativeFlagTopRight, { opacity: 0.06 }]}
            resizeMode="contain"
          />
          
          {/* Chim Lạc decorative - side elements */}
          <Image
            source={require('../data/chimlac.png')}
            style={[styles.decorativeBirdLeft, { opacity: 0.12 }]}
            resizeMode="contain"
          />
          <Image
            source={require('../data/chimlac.png')}
            style={[styles.decorativeBirdRight, { opacity: 0.1 }]}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <EDUARLogoImage 
          size={220} 
          animated={true} 
          showGlow={true}
          onAnimationComplete={handleLogoAnimationComplete}
        />
      </View>

      {/* Text Container với smooth slide-up */}
      <Animated.View 
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }
        ]}
      >
        <Text style={styles.tagline}>
          Hào Khí Việt
        </Text>
        <Text style={styles.taglineSub}>
          Trải nghiệm lịch sử sống động
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6E0019', // Màu đỏ đô (burgundy) - từ design tokens
  },
  baseRedLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#440415', // Darkest burgundy base
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6E0019', // Đỏ đô chính
    opacity: 0.8,
  },
  gradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8B0000', // Dark red
    opacity: 0.4,
  },
  gradientLayer3: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6E0019', // Đỏ đô
    opacity: 0.6,
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeFlagTopLeft: {
    position: 'absolute',
    top: 40,
    left: -30,
    width: 150,
    height: 100,
    tintColor: '#EFEAA8',
    transform: [{ rotate: '-25deg' }],
  },
  decorativeFlagTopRight: {
    position: 'absolute',
    top: 60,
    right: -40,
    width: 180,
    height: 120,
    tintColor: '#EFEAA8',
    transform: [{ rotate: '20deg' }],
  },
  decorativeBirdLeft: {
    position: 'absolute',
    left: -20,
    top: '35%',
    width: 80,
    height: 80,
    tintColor: '#EFEAA8',
    transform: [{ rotate: '-30deg' }],
  },
  decorativeBirdRight: {
    position: 'absolute',
    right: -25,
    bottom: '25%',
    width: 90,
    height: 90,
    tintColor: '#EFEAA8',
    transform: [{ rotate: '35deg' }, { scaleX: -1 }], // Flip horizontally
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    position: 'relative',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EFEAA8', // Light golden color matching logo
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  taglineSub: {
    fontSize: 17,
    fontWeight: '500',
    color: '#EFEAA8', // Light golden color
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default SplashScreen;


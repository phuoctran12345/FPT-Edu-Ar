// 🎨 Language Selection Screen - Chọn ngôn ngữ
// Design từ Figma: 02_Language với UI/UX cải thiện

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DongSonBackground from '../components/DongSonBackground';

interface LanguageScreenProps {
  onLanguageSelect: (language: 'vi' | 'en') => void;
}

const LanguageScreen: React.FC<LanguageScreenProps> = ({ onLanguageSelect }) => {
  // Animated values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(-30)).current;
  const button1Opacity = useRef(new Animated.Value(0)).current;
  const button1Scale = useRef(new Animated.Value(0.9)).current;
  const button1TranslateX = useRef(new Animated.Value(-50)).current;
  const button2Opacity = useRef(new Animated.Value(0)).current;
  const button2Scale = useRef(new Animated.Value(0.9)).current;
  const button2TranslateX = useRef(new Animated.Value(50)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const button1PressScale = useRef(new Animated.Value(1)).current;
  const button2PressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Title animation
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Button 1 animation (delay 200ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(button1Opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(button1Scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(button1TranslateX, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Button 2 animation (delay 400ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(button2Opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(button2Scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(button2TranslateX, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);
  }, []);

  // Button press handlers
  const handleButton1PressIn = () => {
    Animated.spring(button1PressScale, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleButton1PressOut = () => {
    Animated.spring(button1PressScale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleButton2PressIn = () => {
    Animated.spring(button2PressScale, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleButton2PressOut = () => {
    Animated.spring(button2PressScale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background với màu đỏ đô nhẹ */}
      <Animated.View style={[styles.backgroundOverlay, { opacity: backgroundOpacity }]}>
        <View style={styles.backgroundGradient} />
        {/* Họa tiết trống đồng tinh tế */}
        <DongSonBackground opacity={0.08} scale={0.8} />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title với animation */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Chọn ngôn ngữ</Text>
          <Text style={styles.subtitle}>Select language</Text>
        </Animated.View>

        {/* Buttons với stagger animation */}
        <View style={styles.buttonContainer}>
          {/* Button 1: Tiếng Việt */}
          <Animated.View
            style={[
              {
                opacity: button1Opacity,
                transform: [
                  { scale: Animated.multiply(button1Scale, button1PressScale) },
                  { translateX: button1TranslateX },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.languageButton, styles.buttonVietnamese]}
              onPress={() => onLanguageSelect('vi')}
              onPressIn={handleButton1PressIn}
              onPressOut={handleButton1PressOut}
              activeOpacity={1}
            >
              <View style={styles.buttonContent}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>🇻🇳</Text>
                </View>
                <Text style={styles.buttonText}>Tiếng Việt</Text>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Button 2: English */}
          <Animated.View
            style={[
              {
                opacity: button2Opacity,
                transform: [
                  { scale: Animated.multiply(button2Scale, button2PressScale) },
                  { translateX: button2TranslateX },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.languageButton, styles.buttonEnglish]}
              onPress={() => onLanguageSelect('en')}
              onPressIn={handleButton2PressIn}
              onPressOut={handleButton2PressOut}
              activeOpacity={1}
            >
              <View style={styles.buttonContent}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                </View>
                <Text style={styles.buttonText}>English</Text>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F4F2', // Cream background
    // Subtle gradient effect
    opacity: 0.95,
  },
  content: {
    flex: 1,
    paddingTop: 120,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6E0019', // Đỏ đô
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(110, 0, 25, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 24,
    alignItems: 'center',
  },
  languageButton: {
    width: '100%',
    maxWidth: 360,
    height: 88,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    // Enhanced shadow
    shadowColor: '#6E0019',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  buttonVietnamese: {
    borderColor: '#6E0019', // Đỏ đô
  },
  buttonEnglish: {
    borderColor: '#6E0019', // Đỏ đô
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
  },
  flagContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F4F2',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  flagEmoji: {
    fontSize: 28,
  },
  buttonText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#382F2F',
    textAlign: 'center',
    marginLeft: 16,
    letterSpacing: 0.3,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6E0019',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: '#6E0019',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  arrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default LanguageScreen;


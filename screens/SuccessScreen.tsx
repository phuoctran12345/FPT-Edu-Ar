// 🎨 Success Screen - Màn hình thành công
// Design theo mẫu với trophy và kết quả quiz

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, BorderRadius, Shadows } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface SuccessScreenProps {
  onStartExplore: () => void;
  onBack?: () => void;
  score?: number; // ✅ Điểm số từ quiz
  totalQuestions?: number; // ✅ Tổng số câu hỏi
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ onStartExplore, onBack, score = 0, totalQuestions = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiRef = useRef<any>(null); // ✅ Ref cho confetti

  // ✅ Tính toán kết quả
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100;
  const isPerfect = score === totalQuestions && totalQuestions > 0;
  const bestStreak = 1; // TODO: Track best streak trong QuizScreen

  useEffect(() => {
    // 🎆 Enhanced animations
    const animations = Animated.sequence([
      // Trophy bounce animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      // Content slide up + fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Button scale animation
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]);
    
    animations.start();
    
    // ✅ Bắn pháo hoa khi màn hình load
    setTimeout(() => {
      if (confettiRef.current) {
        confettiRef.current.start();
      }
    }, 500); // Delay 500ms để animation trophy hoàn thành trước
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 🎆 Confetti Pháo hoa */}
        <ConfettiCannon
          ref={confettiRef}
          count={300} // ✅ Tăng số lượng pháo hoa
          origin={{ x: screenWidth / 2, y: 0 }}
          fadeOut={true}
          autoStart={false}
          colors={[Colors.primary, Colors.secondary, Colors.success, Colors.accent, '#FFD700', '#FF6B6B']}
        />

        {/* 🏆 Trophy Icon - Emoji cúp ăn mừng */}
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.trophyIcon}>🏆</Text>
          {isPerfect && (
            <Animated.View style={styles.sparkle}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* 🎉 Title */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>
            {isPerfect ? 'Hoàn hảo!' : 'Hoàn thành xuất sắc!'}
          </Text>
        </Animated.View>

        {/* 📊 Results Card */}
        <Animated.View 
          style={[
            styles.resultsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Score với ngôi sao */}
          <View style={styles.scoreContainer}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.scoreText}>
              {score}/{totalQuestions || 0}
            </Text>
            <Text style={styles.starIcon}>⭐</Text>
          </View>
          
          {/* Độ chính xác */}
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statText}>Độ chính xác: {accuracy}%</Text>
          </View>
          
          {/* Chuỗi đúng tốt nhất */}
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statText}>Chuỗi đúng tốt nhất: {bestStreak}</Text>
          </View>
        </Animated.View>

        {/* 🏆 Achievement Messages */}
        <Animated.View 
          style={[
            styles.messageContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.messageText}>
            {isPerfect ? 'Xuất sắc! Bạn là bậc thầy lịch sử!' : 'Tuyệt vời! Bạn đã hoàn thành quiz!'}
            {isPerfect && <Text style={styles.sparkleInline}> ✨</Text>}
          </Text>
          
          {isPerfect && (
            <View style={styles.badgeRow}>
              <Text style={styles.badgeIcon}>🏅</Text>
              <Text style={styles.badgeText}>Đạt huy hiệu hoàn hảo!</Text>
            </View>
          )}
        </Animated.View>

        {/* 🔄 Action Button */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onBack || onStartExplore}
            activeOpacity={0.85}
          >
            <Text style={styles.retryButtonText}>Trở về trang chủ</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary, // ✅ Màu đỏ đô từ theme
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  trophyContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  trophyIcon: {
    fontSize: 100, // ✅ Icon cúp lớn
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkleText: {
    fontSize: 24,
  },
  sparkleInline: {
    fontSize: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textLight, // ✅ Trắng từ theme
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  resultsCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground, // ✅ Vàng kem nhạt từ theme
    borderRadius: BorderRadius.lg, // ✅ Dùng từ theme
    padding: 24,
    marginBottom: 24,
    ...Shadows.medium, // ✅ Shadow từ theme
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starIcon: {
    fontSize: 28,
    marginHorizontal: 8,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textDark, // ✅ Đỏ đô đậm từ theme
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark, // ✅ Đỏ đô đậm từ theme
  },
  messageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  messageText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textLight, // ✅ Trắng từ theme
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight, // ✅ Trắng từ theme
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    width: screenWidth - 48,
    height: 56,
    backgroundColor: Colors.primary, // ✅ Đỏ đô từ theme
    borderRadius: BorderRadius.lg, // ✅ Dùng từ theme
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium, // ✅ Shadow từ theme
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textLight, // ✅ Trắng từ theme
  },
});

export default SuccessScreen;

// 🎨 iOS 16 Water Drop Design Features:
// - Rounded corners with 28px radius for button water drop effect
// - Subtle shadows with multiple layers
// - Card-based layout with proper spacing
// - Enhanced animations with spring physics
// - Gradient overlays and glow effects
// - Modern typography with proper letter spacing


// 🎨 Loading Screen - Màn hình loading với animation
// Sử dụng cho các trạng thái chờ

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Đang tải...",
  showProgress = false,
  progress = 0
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinning animation
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, []);

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        {/* Loading Spinner */}
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spinInterpolate }]
            }
          ]}
        >
          <Text style={styles.spinnerText}>🦅</Text>
        </Animated.View>

        {/* Loading Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Progress Bar (optional) */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidth }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E02222', // Red background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5D7A5', // Golden background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    // Shadow
    shadowColor: '#F5D7A5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  spinnerText: {
    fontSize: 40,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5D7A5', // Golden color
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    width: 250,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(245, 215, 165, 0.3)', // Semi-transparent golden
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5D7A5', // Golden
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F5D7A5', // Golden
  },
});

export default LoadingScreen;

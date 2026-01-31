// 🎨 About Screen - Giới thiệu về EDU AR
// Design từ Figma: 09_About

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AboutScreenProps {
  onBackToHome: () => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onBackToHome }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Về EDU AR</Text>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            EDU AR là ứng dụng thực tế tăng cường (AR) giúp người dùng khám phá lịch sử Việt Nam một cách sống động và tương tác.
            {'\n\n'}
            Ứng dụng sử dụng công nghệ AR để hiển thị các mô hình 3D của các di tích lịch sử, hiện vật bảo tàng, và các sự kiện quan trọng trong lịch sử Việt Nam.
            {'\n\n'}
            Với EDU AR, bạn có thể:{'\n'}
            • Quét QR code để xem mô hình 3D{'\n'}
            • Tương tác với mô hình bằng cử chỉ{'\n'}
            • Học lịch sử một cách thú vị và dễ nhớ
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToHome}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F2', // Cream background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E02222', // Red
    textAlign: 'center',
    marginBottom: 30,
  },
  descriptionContainer: {
    marginBottom: 40,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#382F2F', // Dark gray
    lineHeight: 24,
    textAlign: 'left',
  },
  backButton: {
    width: 350,
    height: 60,
    backgroundColor: '#E02222', // Red
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    // Shadow với red glow
    shadowColor: '#E02222',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AboutScreen;


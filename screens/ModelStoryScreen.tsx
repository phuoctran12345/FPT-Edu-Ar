import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../theme/colors';
import { MODEL_STORIES } from '../data/modelStories';
interface ModelStoryScreenProps {
  modelId: string;
  onBack: () => void;
  onContinue: () => void;
}

const ModelStoryScreen: React.FC<ModelStoryScreenProps> = ({
  modelId,
  onBack,
  onContinue,
}) => {
  const videoRef = useRef<Video>(null);

  // 🎬 Video từ URL (env) — không require file local để EAS build pass khi đã xóa file nặng
  const VIDEO_URI = process.env.EXPO_PUBLIC_VIDEO_URL ?? '';
  const MAIN_VIDEO = VIDEO_URI ? { uri: VIDEO_URI } : null;
  const VIDEO_FILES = {
    '1': MAIN_VIDEO,
    '2': MAIN_VIDEO,
    '3': MAIN_VIDEO,
    '4': MAIN_VIDEO,
  };

  const STORY_TITLES = {
    '1': 'Quân Pháp đổ bộ Sơn Trà',
    '2': 'Bác Hồ đọc Tuyên ngôn Độc lập',
    '3': 'Chiến thắng Điện Biên Phủ',
    '4': 'Ngô Môn - Cổng Hoàng Cung Huế',
  };

  const STORY_YEARS = {
    '1': '1858',
    '2': '1945', 
    '3': '1954',
    '4': '1833',
  };

  const STORY_DESCRIPTIONS = {
    '1': 'Ngày 1/9/1858, liên quân Pháp – Tây Ban Nha nổ súng tấn công Đà Nẵng và đổ bộ lên bán đảo Sơn Trà, mở đầu cuộc chiến tranh xâm lược Việt Nam kéo dài gần một thế kỷ.',
    '2': 'Sau thắng lợi của Cách mạng Tháng Tám 1945, ngày 2/9 tại Quảng trường Ba Đình, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.',
    '3': 'Từ tháng 3 đến tháng 5/1954, quân đội Việt Nam tiến hành chiến dịch Điện Biên Phủ, tiêu diệt tập đoàn cứ điểm mạnh nhất của Pháp, kết thúc bằng chiến thắng vào ngày 7/5/1954.',
    '4': 'Ngọ Môn là cổng chính vào Hoàng thành Huế, xây dựng năm 1833 dưới triều Minh Mạng, nơi diễn ra nhiều nghi lễ trọng đại của triều đình nhà Nguyễn.',
  };

  const story = MODEL_STORIES[modelId];
  const currentVideo = VIDEO_FILES[modelId as keyof typeof VIDEO_FILES];

  if (!story) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Không tìm thấy nội dung</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBack} onPress={onBack}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <View style={styles.headerLabelPill}>
              <Text style={styles.headerLabel}>HÀNH TRÌNH LỊCH SỬ</Text>
            </View>
            <Text style={styles.headerTitle}>{story.title}</Text>
            <Text style={styles.headerSubtitle}>{story.subtitle}</Text>
          </View>
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{story.year}</Text>
          </View>
        </View>

        {/* Hero Image */}
        <View style={styles.heroCard}>
          <Image source={story.image} style={styles.heroImage} resizeMode="cover" />
        </View>

        {/* Bối cảnh lịch sử */}
        <View style={styles.heroTextCard}>
          <Text style={styles.heroTextTitle}>Bối cảnh lịch sử</Text>
          <Text style={styles.heroTextBody}>{story.description}</Text>
        </View>

        {/* Ý nghĩa lịch sử */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ý nghĩa lịch sử</Text>
          <Text style={styles.sectionText}>{story.meaning}</Text>
        </View>

        {/* Các mốc đáng nhớ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các mốc đáng nhớ</Text>
          {story.keyMoments.map((moment) => (
            <View key={moment} style={styles.momentRow}>
              <Text style={styles.momentBullet}>•</Text>
              <Text style={styles.momentText}>{moment}</Text>
            </View>
          ))}
        </View>

        {/* Video Player */}
        <View style={styles.videoCard}>
          <View style={styles.videoHeader}>
            <Text style={styles.stepLabel}>Bước 1/3 - Xem video lịch sử</Text>
            <Text style={styles.videoTitle}>Video tài liệu lịch sử</Text>
            <Text style={styles.videoDescription}>
              Xem video tư liệu, sau đó bạn có thể trải nghiệm mô hình 3D bất cứ lúc nào
            </Text>
          </View>

          <View style={styles.videoContainer}>
            {currentVideo ? (
              <Video
                ref={videoRef}
                style={styles.video}
                source={currentVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>
                  Chưa cấu hình video. Thêm EXPO_PUBLIC_VIDEO_URL trong EAS hoặc .env để dùng video từ URL.
                </Text>
              </View>
            )}
          </View>

          {/* Text info dưới video cho dễ đọc */}
          <View style={styles.videoMeta}>
            <Text style={styles.videoOverlayTitle}>
              {story.year} · {story.title}
            </Text>
            <Text style={styles.videoOverlayCaption}>
              Bật âm thanh để nghe thuyết minh rõ hơn
            </Text>
          </View>
        </View>

        {/* Continue Button - luôn cho phép quét mô hình, không bắt buộc xem hết video */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
        >
          <Text style={styles.continueButtonText}>
            🎯 Trải nghiệm mô hình 3D
          </Text>
          <Text style={styles.continueHint}>
            Bước 2/3 - Quét QR để xem mô hình AR
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
  },
  headerLabelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBackText: {
    fontSize: 20,
    color: Colors.textDark,
    fontWeight: '700',
  },
  headerTexts: {
    gap: 4,
    paddingRight: 90,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.buttonSecondary,
  },
  yearBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: Colors.timeline1858,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  yearText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.border,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroTextCard: {
    backgroundColor: Colors.paperSoft,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  heroTextTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  heroTextBody: {
    fontSize: 15,
    color: Colors.primaryLight,
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.paperSoft,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 15,
    color: Colors.primaryLight,
    lineHeight: 22,
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  momentBullet: {
    fontSize: 18,
    color: Colors.border,
    lineHeight: 22,
  },
  momentText: {
    flex: 1,
    fontSize: 15,
    color: Colors.primaryLight,
    lineHeight: 22,
  },
  videoCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  videoMeta: {
    marginTop: 12,
    gap: 4,
  },
  videoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  videoDescription: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
  },
  watchButton: {
    backgroundColor: Colors.buttonSecondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  watchButtonText: {
    color: Colors.buttonSecondaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonActive: {
    backgroundColor: Colors.cardBackground,
  },
  confirmButtonText: {
    color: Colors.textDark,
    fontWeight: '600',
  },
  confirmButtonTextActive: {
    color: Colors.primaryDark,
  },
  scanButton: {
    backgroundColor: Colors.buttonSecondary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  scanButtonDisabled: {
    backgroundColor: '#9B7A66',
    borderColor: '#CBB299',
  },
  scanButtonText: {
    color: Colors.buttonSecondaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  scanButtonTextDisabled: {
    color: Colors.paper,
    opacity: 0.7,
  },
  scanHint: {
    color: Colors.buttonSecondaryText,
    fontSize: 13,
    opacity: 0.85,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  emptyTitle: {
    color: Colors.paperSoft,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 20,
  },
  backButtonText: {
    color: Colors.buttonPrimaryText,
    fontWeight: '700',
  },
  // Video styles
  videoHeader: {
    gap: 4,
    marginBottom: 12,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.border,
    letterSpacing: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    aspectRatio: 16/9,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  videoOverlayTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  videoOverlayCaption: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  // Continue button styles
  continueButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.backgroundDark,
    borderColor: Colors.border,
  },
  continueButtonText: {
    color: Colors.buttonPrimaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: Colors.buttonPrimary,
    opacity: 0.95,
  },
  continueHint: {
    color: Colors.buttonPrimaryText,
    fontSize: 13,
    opacity: 0.85,
  },
});

export default ModelStoryScreen;


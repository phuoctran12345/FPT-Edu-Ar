// 🎨 Home Screen - Màn hình chính với 3 mô hình lịch sử
// Design mới: Bỏ logo, hiển thị 3 card giới thiệu mô hình
// Style: Lịch sử Việt Nam - màu vàng đồng cổ, nâu sepia, không icon

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MODEL_STORY_LIST } from '../data/modelStories';
import { Colors } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface HomeScreenProps {
  onStartAR: () => void;
  onGoToAbout?: () => void;
  onSelectModel: (modelId: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartAR, onGoToAbout, onSelectModel }) => {
  // Animated values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(-20)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(30)).current;

  const modelCards = MODEL_STORY_LIST;

  useEffect(() => {
    // Stagger animations
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cardsTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Creative Background với các elements */}
      <View style={styles.backgroundContainer}>
        {/* Base gradient background */}
        <View style={styles.gradientBackground}>
          <View style={styles.gradientLayer1} />
          <View style={styles.gradientLayer2} />
          <View style={styles.gradientLayer3} />
        </View>

        {/* Background Pattern Elements */}
        <View style={styles.backgroundPatterns}>
          {/* Trống đồng pattern ở góc trên bên trái */}
          <Image
            source={require('../data/trongdongdongson.png')}
            style={styles.drumPatternTopLeft}
            resizeMode="contain"
          />

          {/* Chim lạc bay ở góc trên bên phải */}
          <Image
            source={require('../data/chimlac.png')}
            style={styles.birdTopRight}
            resizeMode="contain"
          />

          {/* Cờ đỏ sao vàng ngang ở giữa background */}
          <Image
            source={require('../data/codosaovangngang.png')}
            style={styles.flagCenter}
            resizeMode="contain"
          />

          {/* Cờ đỏ sao vàng dọc ở góc dưới */}
          <Image
            source={require('../data/codosaovang.png')}
            style={styles.flagBottomLeft}
            resizeMode="contain"
          />

          {/* Chim lạc nhỏ ở góc dưới phải */}
          <Image
            source={require('../data/chimlac.png')}
            style={styles.birdBottomRight}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: backgroundOpacity }]}>
          {/* Header - BỎ LOGO */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }]
              }
            ]}
          >
            <Text style={styles.title}>EduHistory AR</Text>
            <Text style={styles.subtitle}>History to admire, knowledge to last</Text>
          </Animated.View>

          {/* Section label */}
          <Animated.View
            style={[
              styles.sectionHeader,
              {
                opacity: cardsOpacity,
                transform: [{ translateY: cardsTranslateY }],
              },
            ]}
          >
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>Hành trình lịch sử</Text>
            <View style={styles.sectionDivider} />
          </Animated.View>

          {/* 3 Model Cards */}
          <Animated.View
            style={[
              styles.cardsContainer,
              {
                opacity: cardsOpacity,
                transform: [{ translateY: cardsTranslateY }],
              },
            ]}
          >
            {modelCards.map((card, index) => (
              <TouchableOpacity
                key={card.id}
                style={styles.modelCard}
                activeOpacity={0.85}
                onPress={() => onSelectModel(card.id)}
              >
                {/* Card Image */}
                <View style={styles.cardImageContainer}>
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearText}>{card.year}</Text>
                  </View>
                  <Image
                    source={card.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                  <View style={styles.cardImageCaption}>
                    <Text style={styles.cardImageCaptionText}>{card.subtitle}</Text>
                  </View>
                </View>

                {/* Card Content */}
                <View style={styles.cardContentContainer}>
                  <View style={styles.cardMetaRow}>
                    <View style={styles.cardMetaDot} />
                    <Text style={styles.cardMetaLabel}>Bước {index + 1}/{modelCards.length}</Text>
                    <View style={styles.cardMetaDivider} />
                    <Text style={styles.cardMetaYear}>{card.year}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {card.meaning}
                  </Text>

                  <View style={styles.cardCTAWrapper}>
                    <Text style={styles.cardCTAHelper}>Nhấn để xem video & AR</Text>
                    <View style={styles.cardCTAIcon}>
                      <Text style={styles.cardCTAIconText}>→</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryDark,
  },
  gradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.65,
  },
  gradientLayer3: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryLight,
    opacity: 0.45,
  },
  backgroundPatterns: {
    ...StyleSheet.absoluteFillObject,
  },
  drumPatternTopLeft: {
    position: 'absolute',
    top: -50,
    left: -30,
    width: 200,
    height: 200,
    opacity: 0.35,
    tintColor: Colors.secondary,
    transform: [{ rotate: '-15deg' }],
  },
  birdTopRight: {
    position: 'absolute',
    top: 80,
    right: -20,
    width: 120,
    height: 120,
    opacity: 0.4,
    tintColor: Colors.secondary,
    transform: [{ rotate: '25deg' }],
  },
  flagCenter: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    right: '10%',
    height: 80,
    opacity: 0.25,
    tintColor: Colors.secondary,
  },
  flagBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: -40,
    width: 150,
    height: 150,
    opacity: 0.3,
    tintColor: Colors.secondary,
    transform: [{ rotate: '-20deg' }],
  },
  birdBottomRight: {
    position: 'absolute',
    bottom: 50,
    right: -25,
    width: 100,
    height: 100,
    opacity: 0.35,
    tintColor: Colors.secondary,
    transform: [{ rotate: '-30deg' }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    opacity: 0.95,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.4,
  },
  sectionLabel: {
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  cardsContainer: {
    marginBottom: 30,
    gap: 20,
  },
  modelCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20, // 🍎 iOS 16 card radius
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // iOS 16 enhanced card shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  yearBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 2,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardImageContainer: {
    height: 190,
    backgroundColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cardImageCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardImageCaptionText: {
    color: Colors.textLight,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  cardContentContainer: {
    padding: 18,
    backgroundColor: Colors.backgroundLight,
    gap: 8,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primaryLight,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMetaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  cardMetaLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardMetaDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
    opacity: 0.5,
  },
  cardMetaYear: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  cardCTAWrapper: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCTAHelper: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '700',
  },
  cardCTAIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.buttonSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCTAIconText: {
    color: Colors.buttonSecondaryText,
    fontWeight: '700',
  },
  buttonContainer: {
    paddingTop: 10,
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  arButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28, // 🍎 iOS 16 water drop radius
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth - 40,
    height: 60,
    position: 'relative',
    overflow: 'hidden',
    // Enhanced iOS 16 shadow
    shadowColor: Colors.buttonPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  arButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  arButtonText: {
    color: Colors.buttonPrimaryText,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    zIndex: 1,
  },
  aboutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glass morphism
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28, // 🍎 iOS 16 water drop radius
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth - 40,
    height: 56,
    // Subtle glass shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  aboutButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;

// 🎨 iOS 16 Water Drop Design Features:
// - 28px border radius for buttons (water drop effect)
// - Glass morphism with backdrop blur simulation
// - Enhanced shadows with proper blur radius
// - Gradient overlays on primary buttons
// - Consistent activeOpacity (0.85) for smooth interactions
// - Proper z-index layering for gradients
// - Modern card design with subtle borders
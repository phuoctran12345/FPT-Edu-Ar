// 🎨 Museum Detail Screen - 3 Mô hình lịch sử Việt Nam
// Design từ Figma: 08_Museum_Detail với layout giống hình và màu sắc lịch sử

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MuseumDetailScreenProps {
  onBack: () => void;
  onOpenCamera: (modelId: string) => void;
}

interface MuseumItem {
  id: string;
  title: string;
  image: any; // require() path
  type: 'animated' | 'ar'; // Loại mô hình
}

const MuseumDetailScreen: React.FC<MuseumDetailScreenProps> = ({ onBack, onOpenCamera }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'animated' | 'ar'>('all');
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 4 mô hình lịch sử Việt Nam (ảnh thật)
  const museumItems: MuseumItem[] = [
    {
      id: '1',
      title: 'QUÂN PHÁP ĐỔ BỘ SƠN TRÀ',
      image: require('../assets/image/thuyenphap.jpg'),
      type: 'ar',
    },
    {
      id: '2', 
      title: 'LỄ TUYÊN NGÔN ĐỘC LẬP 1945',
      image: require('../assets/image/buc.jpg'),
      type: 'ar',
    },
    {
      id: '3',
      title: 'CHIẾN THẮNG ĐIỆN BIÊN PHỦ',
      image: require('../assets/image/xetang.jpg'),
      type: 'ar',
    },
    {
      id: '4',
      title: 'NGỌ MÔN - HUẾ',
      image: require('../assets/image/ngomon.jpg'),
      type: 'ar',
    },
  ];

  const filteredItems = museumItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  const handleOpenCamera = (modelId: string) => {
    onOpenCamera(modelId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Dark background với họa tiết trống đồng tinh tế */}
      <Animated.View style={[styles.backgroundOverlay, { opacity: headerOpacity }]}>
        <View style={styles.backgroundBase} />
        {/* Trống đồng decorative - rất mờ */}
        <View style={styles.drumPatternOverlay}>
          <Image
            source={require('../data/trongdongdongson.png')}
            style={styles.drumPattern}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Header - Dark theme */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảo tàng Lịch sử quân sự Việt Nam</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Banner hướng dẫn */}
        <TouchableOpacity style={styles.guideBanner} activeOpacity={0.8}>
          <View style={styles.guideIconContainer}>
            <Text style={styles.guideIconText}>🔍</Text>
          </View>
          <View style={styles.guideTextContainer}>
            <Text style={styles.guideText}>
              Làm thế nào để đắm mình trong khung cảnh lịch sử? Xem hướng dẫn tại đây.
            </Text>
          </View>
          <View style={styles.guideArrow}>
            <Text style={styles.guideArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Filter Buttons - Giống hình: Tất cả, Ảnh động, AR */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'animated' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('animated')}
          >
            <Text style={[styles.filterText, selectedFilter === 'animated' && styles.filterTextActive]}>
              Ảnh động
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'ar' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('ar')}
          >
            <Text style={[styles.filterText, selectedFilter === 'ar' && styles.filterTextActive]}>
              AR
            </Text>
          </TouchableOpacity>
        </View>

        {/* Museum Items - Layout giống hình */}
        <View style={styles.itemsContainer}>
          {filteredItems.map((item, index) => (
            <View key={item.id} style={styles.card}>
              {/* Tag ở góc phải trên - Giống hình */}
              <View style={styles.cardTagContainer}>
                <View style={styles.cardTag}>
                  <Text style={styles.cardTagText}>
                    {item.type === 'animated' ? 'Ảnh động' : 'AR'}
                  </Text>
                </View>
              </View>

              {/* Title - Font trắng, size lớn */}
              <Text style={styles.cardTitle}>{item.title}</Text>

              {/* Image Container - Giống hình với border radius */}
              <View style={styles.cardImageContainer}>
                <Image 
                  source={item.image} 
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>

              {/* Camera Button - Giống hệt như trong hình */}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => handleOpenCamera(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cameraButtonContent}>
                  <Text style={styles.cameraButtonIcon}>📷</Text>
                  <Text style={styles.cameraButtonText}>Mở camera</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
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
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A', // Dark background - màu lịch sử
  },
  drumPatternOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.04, // Rất mờ cho dark theme
  },
  drumPattern: {
    width: '150%',
    height: '150%',
    opacity: 0.3,
    tintColor: '#EFEAA8', // Vàng đồng - màu lịch sử
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A', // Dark background
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A', // Dark gray card
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  guideIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guideIconText: {
    fontSize: 20,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  guideArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6E0019', // Đỏ đô - màu lịch sử
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  guideArrowText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#333333', // Gray background giống hình
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1A1A1A', // Dark background khi active - giống hình
    borderWidth: 1,
    borderColor: '#CCCCCC', // Light gray border khi active
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  filterTextActive: {
    color: '#FFFFFF', // White text khi active - giống hình
    fontWeight: '600',
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1A1A1A', // Darker background giống hình
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  cardTagContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  cardTag: {
    backgroundColor: '#333333', // Gray tag giống hình
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 24,
    letterSpacing: 0.5,
    paddingRight: 80, // Space cho tag
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    backgroundColor: '#333333', // Gray button giống hình
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cameraButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default MuseumDetailScreen;
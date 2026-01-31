// 🎨 Navigation Bar - Tab navigation cho app
// 3 tabs: Trang Chủ || AI Chatbox || Về Chúng tôi

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../theme/colors';
import HomeIcon from './icons/HomeIcon';
import RobotIcon from './icons/RobotIcon';
import InfoIcon from './icons/InfoIcon';

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'home' | 'ai-chat' | 'about';

interface NavigationBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.wrapper}>
      {/* ✅ NavigationBar như một nút nổi - không có background gradient */}
      <View style={styles.container}>
        <TouchableOpacity
        style={[styles.tab, activeTab === 'home' && styles.activeTab]}
        onPress={() => onTabChange('home')}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          <HomeIcon 
            width={20} 
            height={20} 
            color={Colors.textLight} 
          />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
          Trang Chủ
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'ai-chat' && styles.activeTab]}
        onPress={() => onTabChange('ai-chat')}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          <RobotIcon 
            width={20} 
            height={20} 
            color={Colors.textLight} 
          />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'ai-chat' && styles.activeTabLabel]}>
          AI Chatbox
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'about' && styles.activeTab]}
        onPress={() => onTabChange('about')}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          <InfoIcon 
            width={20} 
            height={20} 
            color={Colors.textLight} 
          />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'about' && styles.activeTabLabel]}>
          Về Chúng tôi
        </Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 20, // ✅ Margin dưới để nổi lên
    paddingTop: 0,
  },
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 20,
    borderRadius: 24, // ✅ Pill shape - nút nổi
    borderWidth: 1.5,
    borderColor: Colors.cardBackground + 'CC', // ✅ Border vàng kem
    backgroundColor: 'transparent',
    ...Shadows.medium, // ✅ Shadow đậm hơn để nổi rõ
    zIndex: 1000, // ✅ Z-index cao để nổi lên trên
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 2,
    backgroundColor: Colors.primary + '40', // ✅ Background đỏ nhẹ cho tất cả tab
  },
  activeTab: {
    backgroundColor: Colors.primary, // ✅ Background đỏ đậm cho active tab
    borderRadius: 16,
  },
  tabIconContainer: {
    width: 20,
    height: 20,
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
  },
  activeTabLabel: {
    color: Colors.textLight,
  },
});

export default NavigationBar;


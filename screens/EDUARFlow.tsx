// 🎨 EDU AR Flow - Navigation flow cho tất cả các màn hình
// Kết nối tất cả 9 màn hình từ design Figma

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import storage from '../utils/SimpleStorage';
import SplashScreen from './SplashScreen';
import LanguageScreen from './LanguageScreen';
import HomeScreen from './HomeScreen';
import ARScannerScreen from './ARScannerScreen';
import QuizScreen from './QuizScreen';
// ✅ Đã xóa ProgressScreen - không cần màn hình "Đang xử lý kết quả"
import SuccessScreen from './SuccessScreen';
import MuseumDetailScreen from './MuseumDetailScreen';
import AboutScreen from './AboutScreen';
import LoadingScreen from '../components/LoadingScreen';
import Museum3DViewer from '../components/Museum3DViewer';
import ModelStoryScreen from './ModelStoryScreen';
import AIChatScreen from './AIChatScreen';
import NavigationBar from '../components/NavigationBar';

type ScreenType = 
  | 'splash'
  | 'language'
  | 'home'
  | 'model-story'
  | 'ar-scanner'
  | '3d-viewer'
  | 'quiz'
  | 'success'
  | 'museum-detail'
  | 'about'
  | 'ai-chat'
  | 'loading'
  | 'error';

type TabType = 'home' | 'ai-chat' | 'about';

interface EDUARFlowProps {
  onBack?: () => void;
}

const EDUARFlow: React.FC<EDUARFlowProps> = ({ onBack }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [activeTab, setActiveTab] = useState<TabType>('home'); // ✅ Active tab
  const [selectedLanguage, setSelectedLanguage] = useState<'vi' | 'en'>('vi');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('1');
  const [qrData, setQrData] = useState<string>('');
  const [isProcessingQR, setIsProcessingQR] = useState<boolean>(false); // 🎯 Prevent duplicate QR processing

  // 🎯 FIX: Luôn hiển thị splash screen để user thấy logo
  useEffect(() => {
    const savedLanguage = storage.getLanguage();
    setSelectedLanguage(savedLanguage);
    // Luôn bắt đầu từ splash để hiển thị logo
    setCurrentScreen('splash');
  }, []);

  // Navigation handlers
  const handleSplashComplete = () => {
    storage.markSplashAsSeen();
    setCurrentScreen('language');
  };

  const handleLanguageSelect = (language: 'vi' | 'en') => {
    setSelectedLanguage(language);
    storage.setLanguage(language);
    setCurrentScreen('home');
    setActiveTab('home');
  };

  // ✅ Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'ai-chat') {
      setCurrentScreen('ai-chat');
    } else if (tab === 'about') {
      setCurrentScreen('about');
    }
  };

  const handleStartAR = () => {
    // 🎯 Từ nút "Trải nghiệm AR" -> phải quét QR trước
    setCurrentScreen('ar-scanner');
  };

  const handleSelectModel = (modelId: string) => {
    // 🎯 Từ card model -> đi thẳng đến story (không cần quét QR)
    setSelectedModelId(modelId);
    setCurrentScreen('model-story');
  };

  const handleQRScanned = (qrData: string) => {
    // 🎯 PREVENT DUPLICATE QR PROCESSING
    if (isProcessingQR) {
      console.log('⚠️ Already processing QR, ignoring duplicate scan');
      return;
    }
    
    setIsProcessingQR(true);
    console.log('🎯 QR Scanned in EDUARFlow:', qrData);
    
    try {
      // Parse QR data để lấy modelId
      const parsed = JSON.parse(qrData);
      const modelId = parsed.modelId || parsed.id || '1';
      
      console.log('✅ Parsed QR JSON, modelId:', modelId);
      setQrData(qrData);
      setSelectedModelId(modelId);
      
      // 🎯 Sau khi quét QR -> đi thẳng đến 3D viewer (bỏ qua story)
      setTimeout(() => {
        setCurrentScreen('3d-viewer');
        // Reset processing flag after navigation
        setTimeout(() => setIsProcessingQR(false), 1000);
      }, 300); // Small delay to ensure state updates
      
    } catch (error) {
      // Nếu không parse được, thử lấy modelId từ string
      const modelId = qrData.includes('museum_model_1') ? '1' : 
                     qrData.includes('museum_model_2') ? '2' : 
                     qrData.includes('museum_model_3') ? '3' : 
                     qrData.includes('museum_model_4') ? '4' :
                     ['1', '2', '3', '4'].includes(qrData) ? qrData : '1';
      
      console.log('✅ String parsed modelId:', modelId);
      setSelectedModelId(modelId);
      
      setTimeout(() => {
        setCurrentScreen('3d-viewer');
        setTimeout(() => setIsProcessingQR(false), 1000);
      }, 300);
    }
  };

  const handle3DViewerContinue = () => {
    setCurrentScreen('quiz');
  };

  const [quizScore, setQuizScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const handleAnswerSelect = (answer: string, isCorrect: boolean, score: number, total: number) => {
    // ✅ Lưu điểm số và tổng số câu hỏi
    setQuizScore(score);
    setTotalQuestions(total);
    // ✅ Sau khi quiz xong, chuyển đến màn hình chúc mừng và kết quả
    setCurrentScreen('success');
  };

  // ✅ Đã xóa handleProgressComplete - không cần màn hình progress

  const handleStartExplore = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleGoToAbout = () => {
    setCurrentScreen('about');
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setCurrentScreen('error');
  };

  const handleRetry = () => {
    setCurrentScreen('home');
  };

  const handleBack = () => {
    // Back navigation logic
    switch (currentScreen) {
      case 'language':
        setCurrentScreen('splash');
        break;
      case 'home':
        setCurrentScreen('language');
        break;
      case 'model-story':
        setCurrentScreen('home');
        break;
      case 'ar-scanner':
        setCurrentScreen('home'); // Back to home from QR scanner
        break;
      case '3d-viewer':
        // 🎯 FIX: Luôn về AR scanner (vì user đã xem video -> mở cam -> quét QR)
        // Nếu có QR data -> về scanner để quét lại
        // Nếu không có QR data (từ video) -> về scanner để quét QR
        setCurrentScreen('ar-scanner');
        break;
      case 'quiz':
        setCurrentScreen('3d-viewer');
        break;
      case 'success':
        setCurrentScreen('home'); // ✅ Trở về trang chủ thay vì progress
        break;
      case 'museum-detail':
        setCurrentScreen('success');
        break;
      case 'about':
        setCurrentScreen('home');
        break;
      case 'loading':
        setCurrentScreen('home');
        break;
      case 'error':
        setCurrentScreen('home');
        break;
      default:
        if (onBack) onBack();
    }
  };

  // Render screens
  switch (currentScreen) {
    case 'splash':
      return <SplashScreen onComplete={handleSplashComplete} />;

    case 'language':
      return <LanguageScreen onLanguageSelect={handleLanguageSelect} />;

    case 'home':
      return (
        <View style={{ flex: 1 }}>
        <HomeScreen
          onStartAR={handleStartAR}
          onGoToAbout={handleGoToAbout}
          onSelectModel={handleSelectModel}
        />
          <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
        </View>
      );

    case 'model-story':
      return (
        <ModelStoryScreen
          modelId={selectedModelId}
          onBack={handleBack}
          onContinue={() => {
            // 🎯 FIX: Sau khi xem video -> Mở camera để quét QR (không đi thẳng đến 3D viewer)
            console.log('🎯 Video watched, opening camera for QR scan...');
            setQrData(''); // Clear QR data để biết đây là từ video, không phải từ QR scan
            setCurrentScreen('ar-scanner');
          }}
        />
      );

    case 'ar-scanner':
      return (
        <ARScannerScreen
          onQRScanned={handleQRScanned}
          onBack={handleBack}
        />
      );

    case '3d-viewer':
      return (
        <Museum3DViewer
          modelId={selectedModelId}
          onBack={() => setCurrentScreen('ar-scanner')}
          onContinue={handle3DViewerContinue}
        />
      );

    case 'quiz':
      return (
        <QuizScreen
          modelId={selectedModelId}
          onAnswerSelect={handleAnswerSelect}
          onBack={handleBack}
        />
      );

    case 'success':
      return (
        <SuccessScreen
          onStartExplore={handleStartExplore}
          onBack={handleBack}
          score={quizScore}
          totalQuestions={totalQuestions}
        />
      );

    case 'museum-detail':
      return (
        <MuseumDetailScreen
          onBack={handleBack}
          onOpenCamera={(modelId) => {
            setSelectedModelId(modelId);
            setCurrentScreen('model-story');
          }}
        />
      );

    case 'ai-chat':
      return (
        <View style={{ flex: 1 }}>
          <AIChatScreen onBack={handleBack} />
          <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
        </View>
      );

    case 'about':
      return (
        <View style={{ flex: 1 }}>
        <AboutScreen
          onBackToHome={handleBackToHome}
        />
          <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
        </View>
      );

    case 'loading':
      return (
        <LoadingScreen
          message="Đang tải dữ liệu..."
          showProgress={true}
          progress={75}
        />
      );

    case 'error':
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Có lỗi xảy ra</Text>
          <Text style={styles.errorMessage}>
            {errorMessage || "Vui lòng thử lại sau."}
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleRetry}>
            <Text style={styles.errorButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );

    default:
      return <SplashScreen onComplete={handleSplashComplete} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F4F2',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E02222',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#E02222',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EDUARFlow;


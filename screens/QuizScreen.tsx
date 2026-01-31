// 🎨 Quiz Screen - Câu hỏi kiểm tra
// Design từ Figma: 05_Quiz với data từ question.json
// ✨ Enhanced với Visual Feedback, Progress Bar, Confetti, Modern UI
// 🎨 Đồng bộ màu sắc với theme app (burgundy & cream)

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import questionsData from '../data/question.json';
import { Colors, BorderRadius, Shadows } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface QuizScreenProps {
  modelId?: string; // Model ID từ QR code
  onAnswerSelect: (answer: string, isCorrect: boolean, score: number, totalQuestions: number) => void;
  onBack: () => void;
}

interface Question {
  id: string;
  modelId: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ modelId = '1', onAnswerSelect, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState(0); // ✅ Track điểm số
  
  // ✨ Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    // Load questions cho modelId
    const modelQuestions = questionsData.questions.filter(
      (q: any) => q.modelId === modelId
    );
    setQuestions(modelQuestions);
    setIsLoading(false);
  }, [modelId]);

  // ✨ Animate progress bar khi chuyển câu
  useEffect(() => {
    const progress = questions.length > 0 
      ? (currentQuestionIndex + 1) / questions.length 
      : 0;
    
    Animated.spring(progressAnim, {
      toValue: progress,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerPress = (optionId: string) => {
    if (selectedAnswer) return; // Đã chọn rồi
    
    // ✨ Visual feedback ngay lập tức
    setSelectedAnswer(optionId);
    const option = currentQuestion?.options.find(opt => opt.id === optionId);
    const isCorrect = option?.isCorrect || false;

    // ✨ Button animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // ✨ Confetti khi chọn đúng
    if (isCorrect) {
      setShowConfetti(true);
      if (confettiRef.current) {
        confettiRef.current.start();
      }
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Show explanation sau 1 giây
    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);

    // ✅ Cập nhật điểm số
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Chuyển câu tiếp theo sau 3 giây
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
        // ✨ Reset button animation
        buttonScaleAnim.setValue(1);
      } else {
        // ✅ Hết câu hỏi - Chuyển đến màn hình chúc mừng với điểm số
        const finalScore = isCorrect ? score + 1 : score; // ✅ Tính điểm cuối cùng
        onAnswerSelect(optionId, isCorrect, finalScore, questions.length);
      }
    }, 3000);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E02222" />
          <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy câu hỏi</Text>
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
        {/* Header với progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonHeader}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Câu {currentQuestionIndex + 1}/{questions.length}
          </Text>
            {/* ✨ Progress Bar đẹp hơn với màu theme */}
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ✨ Confetti */}
        {showConfetti && (
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: screenWidth / 2, y: 0 }}
            fadeOut={true}
            autoStart={false}
            colors={[Colors.primary, Colors.secondary, Colors.success, Colors.accent]}
          />
        )}

        <Text style={styles.title}>Câu hỏi kiểm tra</Text>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.answerContainer}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.isCorrect;
            const showResult = selectedAnswer !== null;

            return (
              <Animated.View
                key={option.id}
                style={{
                  transform: [{ scale: isSelected ? buttonScaleAnim : 1 }],
                }}
              >
                <TouchableOpacity
                style={[
                  styles.answerButton,
                    // ✨ Visual feedback ngay lập tức: Xanh khi đúng, Đỏ khi sai (dùng màu theme)
                  isSelected && isCorrect && styles.answerButtonCorrect,
                  isSelected && !isCorrect && styles.answerButtonWrong,
                  showResult && !isSelected && isCorrect && styles.answerButtonCorrectHint,
                ]}
                onPress={() => handleAnswerPress(option.id)}
                activeOpacity={0.8}
                disabled={selectedAnswer !== null}
              >
                <Text
                  style={[
                    styles.answerText,
                      isSelected && isCorrect && styles.answerTextCorrect,
                      isSelected && !isCorrect && styles.answerTextWrong,
                      showResult && !isSelected && isCorrect && styles.answerTextCorrectHint,
                  ]}
                >
                  {option.id.toUpperCase()}. {option.text}
                </Text>
                {isSelected && isCorrect && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
                {isSelected && !isCorrect && (
                  <Text style={styles.crossmark}>✕</Text>
                )}
              </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && currentQuestion.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>💡 Giải thích:</Text>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight, // ✨ Đồng bộ với theme
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textDark, // ✨ Đồng bộ với theme
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error, // ✨ Đồng bộ với theme
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonHeader: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.primary, // ✨ Đồng bộ với theme
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark, // ✨ Đồng bộ với theme
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.borderLight, // ✨ Đồng bộ với theme
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary, // ✨ Màu primary từ theme
    borderRadius: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary, // ✨ Đồng bộ với theme
    marginBottom: 30,
    textAlign: 'center',
  },
  questionCard: {
    width: '100%',
    minHeight: 150,
    backgroundColor: Colors.cardBackground, // ✨ Đồng bộ với theme
    borderRadius: BorderRadius.lg, // ✨ Dùng từ theme
    padding: 24,
    marginBottom: 30,
    ...Shadows.medium, // ✨ Dùng shadow từ theme
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textDark, // ✨ Đồng bộ với theme
    lineHeight: 28,
  },
  answerContainer: {
    gap: 15,
    marginTop: 10,
  },
  answerButton: {
    width: '100%',
    minHeight: 60,
    backgroundColor: Colors.cardBackground, // ✨ Đồng bộ với theme
    borderRadius: BorderRadius.md, // ✨ Dùng từ theme
    borderWidth: 2,
    borderColor: Colors.primary, // ✨ Đồng bộ với theme
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    ...Shadows.small, // ✨ Dùng shadow từ theme
  },
  answerButtonCorrect: {
    backgroundColor: Colors.success, // ✨ Xanh từ theme
    borderColor: Colors.success,
    ...Shadows.medium, // ✨ Shadow đẹp hơn khi đúng
  },
  answerButtonWrong: {
    backgroundColor: Colors.error, // ✨ Đỏ từ theme
    borderColor: Colors.error,
    ...Shadows.medium, // ✨ Shadow đẹp hơn khi sai
  },
  answerButtonCorrectHint: {
    borderColor: Colors.success,
    borderWidth: 3,
    backgroundColor: Colors.accentSoft, // ✨ Background nhạt cho đáp án đúng
  },
  answerText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textDark, // ✨ Đồng bộ với theme
    flex: 1,
    textAlign: 'center',
  },
  answerTextCorrect: {
    color: Colors.textLight, // ✨ Text trắng khi chọn đúng
    fontWeight: '600',
  },
  answerTextWrong: {
    color: Colors.textLight, // ✨ Text trắng khi chọn sai
    fontWeight: '600',
  },
  answerTextCorrectHint: {
    color: Colors.success, // ✨ Text xanh cho đáp án đúng (khi chọn sai)
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 24,
    color: Colors.textLight, // ✨ Đồng bộ với theme
    marginLeft: 10,
    fontWeight: 'bold',
  },
  crossmark: {
    fontSize: 24,
    color: Colors.textLight, // ✨ Đồng bộ với theme
    marginLeft: 10,
    fontWeight: 'bold',
  },
  explanationContainer: {
    marginTop: 30,
    backgroundColor: Colors.accentSoft, // ✨ Đồng bộ với theme
    borderRadius: BorderRadius.md, // ✨ Dùng từ theme
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary, // ✨ Đồng bộ với theme
    ...Shadows.small, // ✨ Dùng shadow từ theme
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark, // ✨ Đồng bộ với theme
    marginBottom: 10,
  },
  explanationText: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textDark, // ✨ Đồng bộ với theme
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: Colors.primary, // ✨ Đồng bộ với theme
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: BorderRadius.round, // ✨ Dùng từ theme
  },
  backButtonText: {
    color: Colors.textLight, // ✨ Đồng bộ với theme
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizScreen;

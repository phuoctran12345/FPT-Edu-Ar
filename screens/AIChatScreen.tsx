// 🎨 AI Chat Screen - Chatbox với Groq (khuyến nghị) hoặc Gemini
// Phục vụ câu hỏi về lịch sử Việt Nam
// Hỗ trợ: Groq (14,400 requests/ngày free) và Gemini

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows } from '../theme/colors';
import { AI_PROVIDER, GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, GEMINI_API_KEY, GEMINI_API_URL } from '../config/env';
import TurtleIcon from '../components/icons/TurtleIcon';

const { width: screenWidth } = Dimensions.get('window');

// ✅ Function để clean response text: Bỏ markdown, format đơn giản
const cleanResponseText = (text: string): string => {
  if (!text) return text;
  
  // Bỏ markdown bold (**text** hoặc __text__)
  let cleaned = text.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  
  // Bỏ markdown italic (*text* hoặc _text_)
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');
  
  // Bỏ markdown headers (# Header)
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  
  // Bỏ markdown list items (- item hoặc * item)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  
  // Bỏ markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`(.*?)`/g, '$1');
  
  // Bỏ markdown links [text](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Bỏ markdown images
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  
  // Clean up multiple spaces và newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatScreenProps {
  onBack?: () => void;
}

// ✅ Cache cho responses (tối ưu Free tier)
const responseCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ
const MIN_REQUEST_INTERVAL = 2000; // 2 giây giữa các request (rate limiting)

const AIChatScreen: React.FC<AIChatScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI chuyên về lịch sử Việt Nam. Bạn muốn hỏi gì về lịch sử Việt Nam?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastRequestTime = useRef<number>(0); // ✅ Rate limiting

  // ✅ System prompt cho AI - Chuyên về lịch sử Việt Nam
  // Yêu cầu: Ngắn gọn, không markdown, dễ đọc trên mobile
  const systemPrompt = `Bạn là một chuyên gia lịch sử Việt Nam. 

QUY TẮC TRẢ LỜI:
- Trả lời bằng tiếng Việt, ngắn gọn (tối đa 200 từ)
- KHÔNG dùng markdown (**, *, -, #)
- KHÔNG dùng bullet points hoặc danh sách
- Viết thành đoạn văn liền mạch, dễ đọc
- Tập trung vào thông tin chính, bỏ qua chi tiết phụ
- Giọng văn thân thiện, dễ hiểu

Hãy trả lời câu hỏi một cách ngắn gọn và rõ ràng.`;

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const question = inputText.trim().toLowerCase();
    
    // ✅ Rate limiting: Kiểm tra thời gian giữa các request
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      const rateLimitMessage: Message = {
        id: Date.now().toString(),
        text: `⏳ Vui lòng đợi ${waitTime} giây trước khi gửi câu hỏi tiếp theo (Free tier có giới hạn).`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, rateLimitMessage]);
      return;
    }

    // ✅ Kiểm tra cache trước
    const cachedResponse = responseCache.get(question);
    if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_DURATION) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
      };
      const cachedAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cachedResponse.text + '\n\n💾 (Câu trả lời từ cache)',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage, cachedAiMessage]);
      setInputText('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    lastRequestTime.current = now; // ✅ Cập nhật thời gian request

    try {
      let response: Response;
      let data: any;

      // ✅ Gọi API theo provider được chọn
      if (AI_PROVIDER === 'groq') {
        // ✅ Groq API (giống OpenAI format)
        if (!GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY không được tìm thấy');
        }

        response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage.text },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const status = response.status;
          const errorMessage = errorData.error?.message || 'Lỗi không xác định';

          if (status === 429) {
            const quotaError: Message = {
              id: (Date.now() + 1).toString(),
              text: '⚠️ API đã vượt quá giới hạn sử dụng (quota). Vui lòng thử lại sau ít phút.',
              isUser: false,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, quotaError]);
            console.error('❌ Groq API Quota Exceeded (429):', errorMessage);
            return;
          }

          const apiError: Message = {
            id: (Date.now() + 1).toString(),
            text: `⚠️ Lỗi API (${status}): ${errorMessage}. Vui lòng thử lại sau.`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, apiError]);
          console.error(`❌ Groq API Error (${status}):`, errorData);
          return;
        }

        data = await response.json();

        // ✅ Groq response format: data.choices[0].message.content
        if (data.choices && data.choices[0] && data.choices[0].message) {
          let aiText = data.choices[0].message.content;
          aiText = cleanResponseText(aiText);
          
          responseCache.set(question, {
            text: aiText,
            timestamp: Date.now(),
          });
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiText,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error('Không nhận được phản hồi từ AI');
        }

      } else {
        // ✅ Gemini API (backward compatibility)
        if (!GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY không được tìm thấy');
        }

        response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nCâu hỏi của người dùng: ${userMessage.text}`,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const status = response.status;
          const errorMessage = errorData.error?.message || 'Lỗi không xác định';

          if (status === 429) {
            const quotaError: Message = {
              id: (Date.now() + 1).toString(),
              text: '⚠️ API đã vượt quá giới hạn sử dụng (quota). Vui lòng thử lại sau ít phút hoặc kiểm tra lại API key của bạn.',
              isUser: false,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, quotaError]);
            console.error('❌ Gemini API Quota Exceeded (429):', errorMessage);
            return;
          }

          const apiError: Message = {
            id: (Date.now() + 1).toString(),
            text: `⚠️ Lỗi API (${status}): ${errorMessage}. Vui lòng thử lại sau.`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, apiError]);
          console.error(`❌ Gemini API Error (${status}):`, errorData);
          return;
        }

        data = await response.json();

        // ✅ Gemini response format: data.candidates[0].content.parts[0].text
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          let aiText = data.candidates[0].content.parts[0].text;
          aiText = cleanResponseText(aiText);
          
          responseCache.set(question, {
            text: aiText,
            timestamp: Date.now(),
          });
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiText,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        } else if (data.error) {
          const errorMsg = data.error.message || 'Không nhận được phản hồi từ AI';
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `⚠️ ${errorMsg}`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          console.error('❌ Gemini API Error in response:', data.error);
        } else {
          throw new Error('Không nhận được phản hồi từ AI');
        }
      }
    } catch (error: any) {
      console.error(`❌ Error calling ${AI_PROVIDER.toUpperCase()} API:`, error);
      
      // ✅ Phân biệt các loại lỗi
      let errorText = 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi. Vui lòng thử lại sau.';
      
      if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        errorText = '⚠️ Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        errorText = '⚠️ API đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau ít phút.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Auto scroll to bottom khi có message mới
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header với Avatar Rùa Cute */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.turtleAvatarHeader}>
              <TurtleIcon width={40} height={40} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>AI Chatbox</Text>
              <Text style={styles.headerSubtitle}>Hỏi về lịch sử Việt Nam</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[styles.messageText, styles.aiMessageText]}>
                Đang suy nghĩ...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi tôi bất kỳ điều gì về lịch sử Việt Nam..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  turtleAvatarHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.textLight,
    ...Shadows.medium,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
    ...Shadows.small,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.textLight,
  },
  aiMessageText: {
    color: Colors.textDark,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
  },
});

export default AIChatScreen;


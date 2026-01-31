// 🎨 Environment Variables Configuration
// Load environment variables from .env file
// Sử dụng babel-plugin-inline-dotenv để đọc .env

// ✅ AI Provider Selection (groq hoặc gemini)
export const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq') as 'groq' | 'gemini';

// ✅ Groq API Configuration (Khuyến nghị - Free tier tốt nhất: 14,400 requests/ngày)
export const GROQ_API_KEY = process.env.GROQ_API_KEY as string | undefined;
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'; // Fast & free


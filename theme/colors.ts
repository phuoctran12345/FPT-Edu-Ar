// 🎨 Theme Colors - Dựa theo logo EDU AR và design Figma
// Màu sắc chính từ logo: đỏ đô (burgundy) và vàng kim

export const Colors = {
  // Primary palette (đỏ đô burgundy)
  primary: '#6E1419', // Đỏ đô chính
  primaryDark: '#4C0E11', // Đỏ đô đậm
  primaryLight: '#8F1F26', // Đỏ đô nhạt

  // Secondary (vàng kim accent)
  secondary: '#F5CFC2', // Vàng kem nhạt
  secondaryDark: '#D38E86', // Vàng kem đậm
  secondaryLight: '#FBE8E0', // Vàng kem rất nhạt

  // Accent + paper tones
  accent: '#E3C9A6',
  accentDark: '#C49B66',
  accentSoft: '#F7EDDD',
  paper: '#FAF3E6',
  paperSoft: '#FDF9F0',

  // Text
  textPrimary: '#FFF4ED', // Trắng kem cho text chính
  textSecondary: '#F5CFC2', // Vàng kem cho text phụ
  textDark: '#3D0508', // Đỏ đô đậm cho text trên nền sáng
  textLight: '#FFFFFF', // Trắng tinh khiết
  textMuted: '#D38E86', // Vàng kem đậm cho text muted

  // Background
  background: '#4C0E11', // Đỏ đô đậm
  backgroundDark: '#32110E', // Đỏ đô rất đậm
  backgroundLight: '#FBE8E0', // Vàng kem rất nhạt cho card

  // UI helpers
  border: '#D38E86', // Vàng kem đậm cho border
  borderLight: '#F5CFC2', // Vàng kem nhạt cho border nhẹ
  borderMuted: '#E9D5AF', // Vàng kem trung bình
  shadow: 'rgba(76, 14, 17, 0.4)', // Shadow đỏ đô
  overlay: 'rgba(78, 5, 8, 0.85)', // Overlay đỏ đô đậm

  // Cards & surfaces
  cardBackground: '#FBE8E0', // Vàng kem rất nhạt
  cardSurface: '#F5CFC2', // Vàng kem nhạt
  cardBorder: '#D38E86', // Vàng kem đậm
  cardShadow: 'rgba(78, 5, 8, 0.2)', // Shadow đỏ đô nhẹ

  // Buttons
  buttonPrimary: '#F5CFC2', // Vàng kem nhạt cho button chính
  buttonPrimaryText: '#3D0508', // Đỏ đô đậm cho text button chính
  buttonSecondary: '#6E1419', // Đỏ đô chính cho button phụ
  buttonSecondaryText: '#FFF4ED', // Trắng kem cho text button phụ

  // Status
  success: '#5E8C61',
  error: '#B0452E',
  warning: '#C17A2A',
  info: '#3D6B9A',

  // Timeline badges
  timeline1858: '#74331E',
  timeline1945: '#D9C08F',
  timeline1954: '#B8874C',
};

// Gradient definitions
export const Gradients = {
  primary: ['#32110E', '#4C0E11', '#6E1419', '#8F1F26'], // Gradient đỏ đô
  secondary: ['#D38E86', '#F5CFC2', '#FBE8E0'], // Gradient vàng kem
  background: ['#32110E', '#4C0E11'], // Gradient background đỏ đô
  card: ['#FBE8E0', '#F5CFC2'], // Gradient card vàng kem
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

// Typography weights
export const FontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Shadow presets
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default Colors;
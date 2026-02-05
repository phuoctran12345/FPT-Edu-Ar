# React-Native-Practice

Ứng dụng AR / 3D (Expo + React Native) — **FPT Edu AR** (EDU AR Hào Khí Việt).

**Tech:** React Native, Expo, Three.js, expo-gl, expo-camera (QR + AR).

---

## 🎬 Demo

[Xem video demo →](FinalDemo.mp4)

---

## 📦 EAS Build & Deploy APK (Android) – Step by Step

Hướng dẫn dùng **EAS (Expo Application Services)** để build file APK và deploy lên thiết bị/Google Play.

### Bước 1: Cài EAS CLI

Trong thư mục dự án:

```bash
npm install -g eas-cli
```

Hoặc chạy qua npx (không cần cài global):

```bash
npx eas-cli --version
```

### Bước 2: Đăng nhập Expo

```bash
eas login
```

- Nếu chưa có tài khoản: tạo tại [expo.dev](https://expo.dev) → Sign up.
- Nhập **username** và **password** Expo khi được hỏi.

### Bước 3: Cấu hình EAS cho dự án

Chạy lần đầu để tạo file **`eas.json`**:

```bash
eas build:configure
```

Chọn Android (và/hoặc iOS), EAS sẽ tạo `eas.json` với các profile:

| Profile       | Mục đích               | Output   |
|---------------|------------------------|----------|
| `preview`     | Test, cài trực tiếp    | **APK**  |
| `production`  | Đưa lên Google Play    | **AAB**  |

- **APK**: cài trực tiếp lên máy (share file hoặc internal testing).
- **AAB**: dùng để upload lên Google Play Console.

### Bước 4: Build APK (profile preview)

```bash
eas build -p android --profile preview
```

EAS sẽ hỏi:

1. **Confirm Android application ID**  
   - Hiển thị `package` từ `app.json` (ví dụ: `com.anonymous.SecondDemo`).  
   - Nhấn **Enter** để đồng ý, hoặc sửa nếu cần.

2. **Generate keystore**  
   - Hỏi: *"Would you like to create a new Android Keystore?"*  
   - Gõ **Y** và Enter để EAS tạo keystore mới (dùng cho lần build sau).

Sau đó build chạy trên cloud; link theo dõi hiện trên terminal và trong [expo.dev](https://expo.dev) → Your project → Builds.

### Bước 5: Lấy file APK

- Vào [expo.dev](https://expo.dev) → đăng nhập → chọn project **FPT Edu AR** (hoặc tên project của bạn) → **Builds**.
- Build **Android** với profile **preview** khi xong sẽ có nút **Download** → tải file `.apk`.

Hoặc dùng CLI:

```bash
eas build:list --platform android --limit 1
```

Rồi tải theo link trong kết quả.

### Bước 6: Cài APK lên Android

- Copy file `.apk` vào máy Android (USB, Google Drive, email...).
- Mở file → cho phép "Install from unknown sources" nếu được hỏi → Cài đặt.

### Bước 7 (tùy chọn): Build AAB để đưa lên Google Play

Khi muốn publish lên Store:

```bash
eas build -p android --profile production
```

Sẽ tạo file **AAB**. Trong [Google Play Console](https://play.google.com/console) tạo app → Release → Upload file AAB.

### Bước 8 (tùy chọn): Deploy tự động lên Google Play

1. Tạo **Service Account** trong Google Cloud, tải file JSON key.
2. Đặt file key vào project (ví dụ: `google-service-account.json`) và cấu hình trong `eas.json` (phần `submit.production.android.serviceAccountKeyPath`).
3. Chạy:

```bash
eas submit --platform android --profile production
```

Chọn build vừa tạo → EAS sẽ upload AAB lên Play Console (draft).

---

**Tóm tắt lệnh hay dùng:**

| Việc cần làm            | Lệnh |
|-------------------------|------|
| Build APK (test)        | `eas build -p android --profile preview` |
| Build AAB (Play Store)  | `eas build -p android --profile production` |
| Xem danh sách build     | `eas build:list` |

**Lưu ý:** Trước khi build nhớ `git add` & `git commit` nếu bạn đổi nhánh hoặc push code, tránh mất thay đổi.

---

## 🚀 Triển khai nhanh (Expo Go)

- Chạy: `npx expo start`
- Quét QR bằng **Expo Go** (iOS/Android) → mở app ngay.
- **Ưu:** Không cần build. **Nhược:** Cần Expo Go; AR/3D có thể bị giới hạn trên một số thiết bị.

---

## 📁 Cấu trúc thư mục

```
FPTEduAR/
├── App.tsx                      # Entry, SafeAreaProvider, chọn mode (menu / edu-ar / ar / ...)
├── app.json                     # Expo config (name, slug, permissions, splash, icon)
├── components/                  # Reusable components
│   ├── ARViewer.tsx            # AR viewer (QR + 3D)
│   ├── Museum3DViewer.tsx      # Viewer 3D bảo tàng (gesture, zoom)
│   ├── QRScanner.tsx           # Quét QR
│   ├── PureQRScanner.tsx
│   ├── PokemonARViewer.tsx     # AR camera + Pokemon 3D
│   ├── SimpleARViewer.tsx
│   ├── OptimizedARViewer.tsx
│   ├── PureARViewer.tsx
│   ├── DongSonBackground.tsx   # Nền Đông Sơn
│   ├── EDUARLogoImage.tsx      # Logo EDU AR
│   ├── LoadingScreen.tsx
│   ├── NavigationBar.tsx
│   ├── Demo.tsx / SketchfabViewer.tsx
│   └── icons/                  # HomeIcon, InfoIcon, RobotIcon, ...
├── screens/                    # Màn hình chính
│   ├── EDUARFlow.tsx           # Flow chính: Splash → Language → Home → ...
│   ├── SplashScreen.tsx
│   ├── LanguageScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ARScannerScreen.tsx
│   ├── QRScannerScreen.tsx
│   ├── MuseumDetailScreen.tsx
│   ├── ModelStoryScreen.tsx
│   ├── QuizScreen.tsx
│   ├── SuccessScreen.tsx
│   ├── AboutScreen.tsx
│   ├── AIChatScreen.tsx
│   └── ARScreen.tsx / PureARScreen.tsx
├── utils/                      # Helper & loaders
│   ├── modelData.ts            # Config model 3D theo QR
│   ├── AssetResolver.ts
│   ├── Dynamic3DLoader.ts / DynamicGLBLoader.ts
│   ├── PureDynamicLoader.ts
│   └── SimpleStorage.ts        # AsyncStorage (language, splash seen)
├── config/
│   └── env.ts
├── data/                       # Ảnh, JSON (modelStories, question)
├── theme/
│   └── colors.ts
├── assets/                     # Icons, images, models 3D, video, QR
│   ├── image/
│   ├── models/                 # .glb, textures (3d1, 3d2, 3d3, 3d4)
│   ├── qr-codes/
│   └── vidieo/
├── package.json
├── eas.json                    # EAS Build config (sau khi chạy eas build:configure)
└── README.md
```

---

## 🎯 Tính năng chính (FPT Edu AR)

- Splash → Chọn ngôn ngữ (VI/EN) → Home
- Trải nghiệm AR: quét QR → xem mô hình 3D (Museum3DViewer), xoay/zoom
- Câu chuyện mô hình, Quiz, màn hình thành công
- Tab: Home / AI Chat / About
- Nhiều mode demo: Sketchfab 3D, AR Legacy, Pure Dynamic AR, Pokemon AR, Simple AR, Optimized AR

---

## 🛠️ Dependencies chính

- `expo`, `expo-gl`, `expo-camera`, `expo-asset`, `expo-av`, `expo-file-system`
- `react-native`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-svg`
- `three`, `expo-three`, `@react-three/drei`, `three-gltf-loader`
- `expo-barcode-scanner`, `qrcode`

---

## 📝 Notes

- App build trên **Expo** (managed workflow).
- Camera (QR, AR) đã khai báo quyền trong `app.json`.
- File .glb lớn (>50MB) nên để trong `.gitignore` hoặc dùng Git LFS / host ngoài.

---

## 👨‍💻 Author

**Sinh viên:** Trần Hồng Phước  
**MSSV:** DE180567  
**Lớp:** DE180577  
**Môn:** MMA301/302 - Mobile Application Development  

**Source:** [GitHub - React-Native-Practice](https://github.com/phuoctran12345/React-Native-Practice)

---

## 📄 License

© 2026 - FPT University Da Nang
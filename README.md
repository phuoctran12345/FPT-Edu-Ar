# React-Native-Practice

Ứng dụng AR / 3D (Expo + React Native) — EDU AR Hào Khí Việt.

## 🎬 Demo

[Xem video demo →](FinalDemo.mp4)

---

## 🚀 Triển khai (Deployment)

App dùng **Expo** nên có 3 hướng chính:

### 1. Chia sẻ nhanh (test với Expo Go)

- Chạy: `npx expo start`
- Quét QR bằng **Expo Go** (iOS/Android) → mở app ngay.
- **Ưu:** Không cần build, test nhanh. **Nhược:** Cần Expo Go, AR/3D có thể bị giới hạn trên một số thiết bị.

### 2. Build file cài (APK / AAB / IPA) — EAS Build

Dùng **Expo Application Services (EAS)** để build bản cài được:

```bash
# Cài EAS CLI (một lần)
npm i -g eas-cli
eas login

# Cấu hình build (chọn Android/iOS, profile development|preview|production)
eas build:configure

# Build Android (APK để cài tay, hoặc AAB cho Play Store)
eas build --platform android --profile preview

# Build iOS (cần Apple Developer, cho TestFlight/App Store)
eas build --platform ios --profile preview
```

- **Android:** Sau khi build xong, tải file `.apk` từ link EAS và cài lên máy hoặc đăng lên **Google Play (internal/closed testing)**.
- **iOS:** Build xong dùng **TestFlight** để gửi cho người test, hoặc submit **App Store**.

### 3. Đăng lên store chính thức

| Nền tảng   | Bước chính |
|-----------|-------------|
| **Android** | EAS build với profile `production` → upload file **AAB** lên [Google Play Console](https://play.google.com/console). |
| **iOS**     | EAS build với profile `production` → dùng **Transporter** hoặc EAS Submit để gửi lên [App Store Connect](https://appstoreconnect.apple.com). |

**Lưu ý:** App dùng camera (QR, AR) nên cần khai báo quyền rõ trong `app.json` (đã có). iOS cần tài khoản Apple Developer (99 USD/năm).

---

**Tóm tắt:** Test nhanh → Expo Go. Muốn cài file / gửi cho người khác → EAS Build (APK/TestFlight). Muốn đăng store → EAS Build production + Play Console / App Store Connect.
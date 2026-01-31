// 📱 QR Scanner Screen - Màn hình quét QR code
// Tách riêng và tối ưu UI, hiển thị QR codes mẫu

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { Colors } from '../theme/colors';

interface QRScannerScreenProps {
  onQRScanned: (qrData: string) => void;
  onBack: () => void;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  onQRScanned,
  onBack,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showSampleQRs, setShowSampleQRs] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    try {
      // Kiểm tra xem có phải QR code AR không
      const qrData = JSON.parse(data);
      if (qrData.type === 'ar_model' && qrData.modelId) {
        onQRScanned(data);
      } else {
        Alert.alert(
          'QR Code không hợp lệ',
          'Vui lòng quét QR code của mô hình AR',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'QR Code không hợp lệ', 
        'Vui lòng quét QR code của mô hình AR',
        [{ text: 'OK' }]
      );
    }
  };

  // QR codes mẫu để test
  const sampleQRs = [
    {
      id: '1',
      title: 'Quân Pháp đổ bộ Sơn Trà (1858)',
      image: require('../assets/qr-codes/qr-model-1.png'),
      data: JSON.stringify({
        type: 'ar_model',
        modelId: '1',
        title: 'Quân Pháp đổ bộ Sơn Trà',
        year: '1858',
        modelPath: 'assets/models/3D 1.glb',
      })
    },
    {
      id: '2', 
      title: 'Bác Hồ đọc Tuyên ngôn Độc lập (1945)',
      image: require('../assets/qr-codes/qr-model-2.png'),
      data: JSON.stringify({
        type: 'ar_model',
        modelId: '2',
        title: 'Bác Hồ đọc Tuyên ngôn Độc lập',
        year: '1945',
        modelPath: 'assets/models/3D 2.glb',
      })
    },
    {
      id: '3',
      title: 'Chiến thắng Điện Biên Phủ (1954)',
      image: require('../assets/qr-codes/qr-model-3.png'),
      data: JSON.stringify({
        type: 'ar_model',
        modelId: '3',
        title: 'Chiến thắng Điện Biên Phủ',
        year: '1954',
        modelPath: 'assets/models/3D 3.glb',
      })
    }
  ];

  const handleSampleQRPress = (qrData: string) => {
    onQRScanned(qrData);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Đang yêu cầu quyền camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Không có quyền truy cập camera</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getCameraPermissions}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>BƯỚC 2/3 - QUÉT QR CODE</Text>
          <Text style={styles.headerTitle}>Quét mã để xem mô hình AR</Text>
        </View>
      </View>

      {/* Camera Scanner */}
      {!showSampleQRs && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
          />
          
          {/* Scanner Overlay */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>
              Đưa QR code vào khung để quét
            </Text>
          </View>
        </View>
      )}

      {/* Sample QRs */}
      {showSampleQRs && (
        <ScrollView style={styles.sampleContainer} contentContainerStyle={styles.sampleContent}>
          <Text style={styles.sampleTitle}>QR Codes mẫu để test:</Text>
          <View style={styles.qrGrid}>
            {sampleQRs.map((qr) => (
              <TouchableOpacity
                key={qr.id}
                style={styles.qrCard}
                onPress={() => handleSampleQRPress(qr.data)}
              >
                <Image source={qr.image} style={styles.qrImage} />
                <Text style={styles.qrTitle}>{qr.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowSampleQRs(!showSampleQRs)}
        >
          <Text style={styles.toggleButtonText}>
            {showSampleQRs ? '📷 Quét QR thật' : '🔍 Xem QR mẫu'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.instructionText}>
          💡 Mẹo: In QR code ra giấy hoặc hiển thị trên màn hình khác để quét
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.textDark,
    fontWeight: '700',
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FF8C42', // ✅ Cam thường thay vì đỏ
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sampleContainer: {
    flex: 1,
  },
  sampleContent: {
    padding: 20,
  },
  sampleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrGrid: {
    gap: 16,
  },
  qrCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  qrImage: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
  },
  bottomActions: {
    padding: 20,
    gap: 12,
  },
  toggleButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  toggleButtonText: {
    color: Colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    color: Colors.buttonPrimaryText,
    fontWeight: '600',
  },
});

export default QRScannerScreen;



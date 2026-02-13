import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera';

const { width: screenWidth } = Dimensions.get('window');

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onCancel: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onCancel }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Xin quyền truy cập camera
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true); // ✅ Set scanned FIRST to prevent duplicate calls
    
    // ✅ Enhanced QR parsing with better model detection
    let isValidAR = false;
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'ar_model' && parsed.modelId) {
        isValidAR = true;
      }
    } catch (error) {
      // QR đơn giản hoặc không phải JSON
      if (data.includes('museum_model') || ['1', '2', '3', '4'].includes(data.trim())) {
        isValidAR = true;
      }
    }
    
    // 🎯 FIX: Xóa Alert, đi thẳng đến 3D viewer
    if (isValidAR) {
      // ✅ Navigate directly to 3D viewer without alert
            onScanSuccess(data);
    } else {
      // Invalid QR - allow scan again
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>❌ Không có quyền truy cập camera</Text>
        <Text style={styles.subText}>Vui lòng cấp quyền trong Settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
          {/* 🎨 iOS 16 Style Overlay with Water Drop Buttons */}
          <View style={styles.overlay} pointerEvents="box-none">
            {/* ❌ Cancel Button - iOS 16 Water Drop Style */}
          <TouchableOpacity 
            style={styles.cancelButton}
              onPress={() => {
                console.log('[QRScanner] ❌ Cancel button pressed');
                if (onCancel) {
                  onCancel();
                }
              }}
              activeOpacity={0.85}
          >
              <View style={styles.cancelButtonGradient} />
              <View style={styles.cancelButtonContent}>
                <Text style={styles.cancelIcon}>✕</Text>
                <Text style={styles.cancelText}>Hủy</Text>
              </View>
          </TouchableOpacity>

            {/* 🔄 Scan Again Button - Only show when scanned */}
          {scanned && (
            <TouchableOpacity 
              style={styles.scanAgainButton}
                onPress={() => {
                  console.log('[QRScanner] 🔄 Scan again button pressed');
                  setScanned(false);
                }}
                activeOpacity={0.85}
            >
                <View style={styles.scanAgainGradient} />
              <Text style={styles.scanAgainText}>🔄 Quét lại</Text>
            </TouchableOpacity>
          )}
            
            {/* 📱 Scanning Status Indicator */}
            {!scanned && (
              <View style={styles.scanningIndicator}>
                <View style={styles.scanningDot} />
                <Text style={styles.scanningText}>🔍 Đang quét QR code...</Text>
              </View>
            )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Không có backgroundColor để không che camera và nút
    // Background sẽ được xử lý bởi ARScannerScreen overlay
  },
  scanArea: {
    width: 280, // Match với ARScannerScreen frame size
    height: 280,
    position: 'relative',
    // Transparent để không che camera
  },
  corner: {
    position: 'absolute',
    width: 40, // Match với ARScannerScreen
    height: 40,
    borderColor: '#FF8C42', // ✅ Cam thường thay vì vàng/golden
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // iOS 16 dark glass effect
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28, // 💧 Water drop radius
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    // iOS 16 enhanced shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 1000,
    minWidth: 100,
  },
  cancelButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 6,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 120,
    left: (screenWidth - 180) / 2, // Center the button
    width: 180,
    height: 56,
    backgroundColor: '#FF8C42', // ✅ Cam thường thay vì vàng/golden
    borderRadius: 28, // 💧 Water drop radius
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.3)', // ✅ Cam thường với opacity
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // iOS 16 cam glow
    shadowColor: '#FF8C42', // ✅ Cam thường thay vì vàng/golden
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  scanAgainGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scanAgainText: {
    color: '#5C3317',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 40,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
    // Pulsing animation would be added via Animated.Value
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QRScanner;

// 🎨 iOS 16 Water Drop Design Features:
// - 28px border radius for water drop effect
// - Gradient overlays on buttons
// - Enhanced shadows with proper blur radius
// - Glass morphism effect with backdrop blur
// - Proper z-index layering
// - Smooth activeOpacity transitions (0.85)
// - Consistent spacing and typography

// 🎨 AR Scanner Screen - Quét QR code
// Design từ Figma: 04_AR_Scanner với UI/UX cải thiện

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRScanner from '../components/QRScanner';

interface ARScannerScreenProps {
  onQRScanned: (qrData: string) => void;
  onBack: () => void;
}

const ARScannerScreen: React.FC<ARScannerScreenProps> = ({ onQRScanned, onBack }) => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <QRScanner
        onScanSuccess={onQRScanned}
        onCancel={onBack} // Fix: Đổi onBack thành onCancel để match với QRScanner props
      />
      
      {/* Additional UI Overlay - Golden frame và instructions */}
      <View style={styles.customOverlay} pointerEvents="box-none">
        {/* Golden QR Frame với corner indicators */}
        <View style={styles.qrFrame} pointerEvents="none">
          {/* Corner indicators với màu vàng kim - L shape */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Instruction Text ở dưới frame */}
        <View style={styles.instructionContainer} pointerEvents="none">
          <Text style={styles.instructionIcon}>📸</Text>
          <Text style={styles.instructionText}>
            Đưa camera vào QR code trên màn hình
          </Text>
          <Text style={styles.instructionSubText}>
            QR code đen-trắng sẽ được nhận diện tự động
          </Text>
        </View>

        {/* Bottom instruction */}
        <View style={styles.bottomInstructionContainer} pointerEvents="none">
          <Text style={styles.bottomInstructionText}>
            🏛️ Quét QR để khám phá mô hình lịch sử 3D
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  customOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    // Không có background để không che camera và nút hủy
  },
  qrFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    // Transparent frame để không che camera
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FF8C42', // ✅ Cam thường thay vì vàng/golden
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  instructionContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  instructionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  instructionSubText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  bottomInstructionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomInstructionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
});

export default ARScannerScreen;


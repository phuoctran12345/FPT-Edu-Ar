import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRScanner from '../components/QRScanner';
import ARViewer from '../components/ARViewer';
import { getModelFromQRData, ModelData, SAMPLE_QR_DATA } from '../utils/modelData';

type ViewMode = 'menu' | 'scanner' | 'ar';

const ARScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [currentModel, setCurrentModel] = useState<ModelData | null>(null);

  // Xử lý khi quét QR thành công
  const handleQRScanSuccess = (qrData: string) => {
    const model = getModelFromQRData(qrData);
    
    if (model) {
      setCurrentModel(model);
      setViewMode('ar');
    } else {
      Alert.alert(
        '❌ Lỗi',
        'QR code không hợp lệ hoặc model không tồn tại',
        [{ text: 'OK', onPress: () => setViewMode('menu') }]
      );
    }
  };

  // Test trực tiếp không cần QR (để dev dễ dàng)
  const handleTestModel = (qrData: string, modelName: string) => {
    Alert.alert(
      '🧪 Test Mode',
      `Bạn muốn test model "${modelName}" không cần quét QR?`,
      [
        {
          text: 'Có',
          onPress: () => handleQRScanSuccess(qrData),
        },
        {
          text: 'Không',
          style: 'cancel',
        },
      ]
    );
  };

  // Render menu chính
  const renderMenu = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.menuContent}>
        <Text style={styles.title}>📱 AR Model Viewer</Text>
        <Text style={styles.subtitle}>
          Quét mã QR để hiển thị model 3D trong thực tế
        </Text>

        {/* Nút quét QR */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setViewMode('scanner')}
        >
          <Text style={styles.primaryButtonText}>📸 Quét mã QR</Text>
        </TouchableOpacity>

        {/* Phần test models */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>🧪 Test Models (không cần QR)</Text>
          <Text style={styles.sectionDescription}>
            Dùng để test trước khi tạo QR code
          </Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleTestModel(SAMPLE_QR_DATA.ship, 'Chiến hạm')}
          >
            <Text style={styles.testButtonText}>🚢 Chiến hạm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleTestModel(SAMPLE_QR_DATA.hamtank, 'Xe tăng HamTank')}
          >
            <Text style={styles.testButtonText}>🛡️ HamTank</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleTestModel(SAMPLE_QR_DATA.kydai, 'Đài KYDAI')}
          >
            <Text style={styles.testButtonText}>🏛️ KYDAI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleTestModel(SAMPLE_QR_DATA.ngomon, 'Ngô Môn')}
          >
            <Text style={styles.testButtonText}>🚪 Ngô Môn</Text>
          </TouchableOpacity>
        </View>

        {/* Hướng dẫn */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>💡 Hướng dẫn sử dụng:</Text>
          <Text style={styles.instructionText}>
            1. Nhấn "Quét mã QR" để bật camera{'\n'}
            2. Di chuyển camera về phía mã QR{'\n'}
            3. Khi quét thành công, model 3D sẽ hiển thị{'\n'}
            4. Di chuyển điện thoại để xem model từ nhiều góc
          </Text>
        </View>

        {/* Tạo QR code */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>🔲 Tạo mã QR để test</Text>
          <Text style={styles.qrInfo}>
            Dữ liệu QR code mẫu:{'\n\n'}
            • "ship" - Chiến hạm{'\n'}
            • "hamtank" - Xe tăng{'\n'}
            • "kydai" - Đài tưởng niệm{'\n'}
            • "ngomon" - Ngô Môn Huế
          </Text>
          <Text style={styles.qrNote}>
            📝 Dùng tool tạo QR online với dữ liệu trên
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Render QR Scanner
  const renderScanner = () => (
    <QRScanner
      onScanSuccess={handleQRScanSuccess}
      onCancel={() => setViewMode('menu')}
    />
  );

  // Render AR Viewer
  const renderARViewer = () => {
    if (!currentModel) return null;
    
    return (
      <ARViewer
        modelUrl={currentModel.id}  // Truyền model ID thay vì modelPath
        onClose={() => {
          setViewMode('menu');
          setCurrentModel(null);
        }}
      />
    );
  };

  // Render theo mode
  switch (viewMode) {
    case 'scanner':
      return renderScanner();
    case 'ar':
      return renderARViewer();
    default:
      return renderMenu();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  menuContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionBox: {
    backgroundColor: '#FFF9E6',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  qrSection: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  qrInfo: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    fontFamily: 'monospace',
    marginTop: 10,
  },
  qrNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default ARScreen;

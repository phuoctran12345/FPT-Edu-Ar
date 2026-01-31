// 🎨 Đông Sơn Background Pattern Component
// Tạo họa tiết trống đồng Đông Sơn với màu đỏ đô và các element Việt Nam

import React from 'react';
import { View, StyleSheet, Image, ImageStyle } from 'react-native';

interface DongSonBackgroundProps {
  opacity?: number;
  scale?: number;
}

const DongSonBackground: React.FC<DongSonBackgroundProps> = ({ 
  opacity = 0.15,
  scale = 1 
}) => {
  return (
    <View style={[styles.container, { opacity }]}>
      {/* Pattern layers - tạo hiệu ứng trống đồng */}
      {/* Layer 1: Concentric circles pattern - các vòng tròn đồng tâm */}
      <View style={styles.patternLayer1}>
        {[1, 2, 3, 4, 5].map((ring) => (
          <View
            key={`ring-${ring}`}
            style={[
              styles.concentricRing,
              {
                width: 180 * scale * ring * 0.8,
                height: 180 * scale * ring * 0.8,
                borderRadius: 90 * scale * ring * 0.8,
                borderWidth: ring === 1 ? 3 / scale : 1.5 / scale,
                opacity: 1 - (ring - 1) * 0.15,
              }
            ]}
          />
        ))}
      </View>

      {/* Layer 2: Geometric patterns - mặt trời và tia sáng */}
      <View style={styles.patternLayer2}>
        {/* Sunburst pattern ở trung tâm - tượng trưng cho mặt trời */}
        <View style={[styles.sunburst, { 
          width: 140 * scale, 
          height: 140 * scale,
          transform: [{ scale }] 
        }]}>
          {/* Central circle */}
          <View style={[styles.centerCircle, {
            width: 20 * scale,
            height: 20 * scale,
            borderRadius: 10 * scale,
          }]} />
          
          {/* Rays - tia sáng */}
          {Array.from({ length: 14 }).map((_, i) => (
            <View
              key={`ray-${i}`}
              style={[
                styles.ray,
                {
                  transform: [{ rotate: `${i * (360 / 14)}deg` }],
                  width: 60 * scale,
                  height: 3 * scale,
                  top: '50%',
                  left: '50%',
                  marginLeft: -30 * scale,
                  marginTop: -1.5 * scale,
                }
              ]}
            />
          ))}
        </View>
        
        {/* Additional decorative circles */}
        <View style={[styles.decorativeCircle1, {
          width: 100 * scale,
          height: 100 * scale,
          borderRadius: 50 * scale,
          borderWidth: 2 / scale,
        }]} />
        <View style={[styles.decorativeCircle2, {
          width: 70 * scale,
          height: 70 * scale,
          borderRadius: 35 * scale,
          borderWidth: 1.5 / scale,
        }]} />
      </View>

      {/* Layer 3: Geometric line patterns - họa tiết đường thẳng */}
      <View style={styles.geometricLayer}>
        {/* Horizontal lines */}
        {[0, 1, 2, 3, 4].map((line) => (
          <View
            key={`hline-${line}`}
            style={[
              styles.horizontalLine,
              {
                top: `${20 + line * 15}%`,
                width: '80%',
                opacity: 0.1 - line * 0.015,
              }
            ]}
          />
        ))}
        
        {/* Vertical lines */}
        {[0, 1, 2, 3].map((line) => (
          <View
            key={`vline-${line}`}
            style={[
              styles.verticalLine,
              {
                left: `${15 + line * 20}%`,
                height: '60%',
                opacity: 0.08 - line * 0.01,
              }
            ]}
          />
        ))}
      </View>

      {/* Layer 4: Wave patterns - tạo cảm giác sóng nước */}
      <View style={styles.waveLayer}>
        {[0, 1, 2].map((wave) => (
          <View
            key={`wave-${wave}`}
            style={[
              styles.wave,
              {
                bottom: wave * 150 * scale,
                opacity: 0.05 - wave * 0.01,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  patternLayer1: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  concentricRing: {
    position: 'absolute',
    borderColor: '#EFEAA8', // Golden color
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  patternLayer2: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunburst: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    position: 'absolute',
    backgroundColor: '#EFEAA8',
    borderWidth: 2,
    borderColor: '#EFEAA8',
  },
  ray: {
    position: 'absolute',
    backgroundColor: '#EFEAA8',
    borderRadius: 1.5,
  },
  decorativeCircle1: {
    position: 'absolute',
    borderColor: '#EFEAA8',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    top: '30%',
    left: '20%',
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    borderColor: '#EFEAA8',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    bottom: '25%',
    right: '15%',
    opacity: 0.25,
  },
  geometricLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  horizontalLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#EFEAA8',
    left: '10%',
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#EFEAA8',
    top: '20%',
  },
  waveLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EFEAA8',
    borderRadius: 1,
  },
});

export default DongSonBackground;


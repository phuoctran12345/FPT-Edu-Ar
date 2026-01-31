// 💡 Lightbulb Icon SVG Component
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface LightbulbIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const LightbulbIcon: React.FC<LightbulbIconProps> = ({ 
  width = 20, 
  height = 20, 
  color = '#FFD700' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      {/* Bulb */}
      <Path
        d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z"
        fill={color}
        stroke="#FFA500"
        strokeWidth="1"
      />
      {/* Base */}
      <Path
        d="M9 21H15M10 21V22C10 22.55 10.45 23 11 23H13C13.55 23 14 22.55 14 22V21"
        stroke="#666"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Glow effect */}
      <Circle cx="12" cy="9" r="3" fill="#FFF" opacity="0.3" />
    </Svg>
  );
};

export default LightbulbIcon;








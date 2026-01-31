// 🤖 Robot Icon SVG Component
import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface RobotIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const RobotIcon: React.FC<RobotIconProps> = ({ 
  width = 24, 
  height = 24, 
  color = '#4A90E2' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <Rect x="6" y="4" width="12" height="10" rx="2" fill={color} stroke="#333" strokeWidth="1.5" />
      {/* Eyes */}
      <Circle cx="9" cy="8" r="1.5" fill="#FFF" />
      <Circle cx="15" cy="8" r="1.5" fill="#FFF" />
      {/* Antenna */}
      <Circle cx="12" cy="2" r="1" fill={color} />
      <Path d="M12 2L12 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Body */}
      <Rect x="8" y="14" width="8" height="6" rx="1" fill={color} stroke="#333" strokeWidth="1.5" />
      {/* Buttons */}
      <Circle cx="11" cy="17" r="0.8" fill="#FFF" />
      <Circle cx="13" cy="17" r="0.8" fill="#FFF" />
    </Svg>
  );
};

export default RobotIcon;








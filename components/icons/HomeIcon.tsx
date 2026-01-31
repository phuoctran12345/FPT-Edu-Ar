// 🏠 Home Icon SVG Component
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HomeIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const HomeIcon: React.FC<HomeIconProps> = ({ 
  width = 24, 
  height = 24, 
  color = '#333' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21C9.55 21 10 20.55 10 20V16C10 15.45 10.45 15 11 15H13C13.55 15 14 15.45 14 16V20C14 20.55 14.45 21 15 21M9 21H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default HomeIcon;








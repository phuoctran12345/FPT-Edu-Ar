// ⭐ Star Icon SVG Component
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface StarIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const StarIcon: React.FC<StarIconProps> = ({ 
  width = 18, 
  height = 18, 
  color = '#FFD700' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={color}
        stroke="#FFA500"
        strokeWidth="0.5"
      />
    </Svg>
  );
};

export default StarIcon;








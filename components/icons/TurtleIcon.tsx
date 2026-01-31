// 🐢 Turtle Icon SVG Component
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface TurtleIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const TurtleIcon: React.FC<TurtleIconProps> = ({ 
  width = 60, 
  height = 60, 
  color = '#8B4513' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100">
      {/* Shell */}
      <Path
        d="M50 20 C30 20, 15 35, 15 55 C15 75, 30 90, 50 90 C70 90, 85 75, 85 55 C85 35, 70 20, 50 20 Z"
        fill="#228B22"
        stroke={color}
        strokeWidth="2"
      />
      {/* Shell pattern */}
      <Path
        d="M50 25 L50 85 M35 50 L65 50 M25 40 L75 40 M25 60 L75 60"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Head */}
      <Circle cx="50" cy="15" r="12" fill="#8B4513" />
      {/* Eyes */}
      <Circle cx="46" cy="12" r="2" fill="#000" />
      <Circle cx="54" cy="12" r="2" fill="#000" />
      {/* Legs */}
      <Circle cx="25" cy="50" r="6" fill="#8B4513" />
      <Circle cx="75" cy="50" r="6" fill="#8B4513" />
      <Circle cx="30" cy="75" r="6" fill="#8B4513" />
      <Circle cx="70" cy="75" r="6" fill="#8B4513" />
      {/* Tail */}
      <Path
        d="M50 90 L45 100 L50 95 L55 100 Z"
        fill="#8B4513"
      />
    </Svg>
  );
};

export default TurtleIcon;








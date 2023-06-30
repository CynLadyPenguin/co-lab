import React, { useState } from 'react';
import '../styles.css';


interface IconProps {
  size?: number;
  className?: string;
}
interface TooltipIconProps {
  children?: React.ReactNode;
  icon: React.ComponentType<IconProps>;
  tooltipText: string;
  handleClick: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}



const TooltipIcon: React.FC<TooltipIconProps> = ({ icon: Icon, tooltipText, handleClick, style }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  }

  const handleMouseLeave = () => {
    setIsHovered(false);
  }

  return (
    <div
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ handleMouseLeave }
      onClick={ handleClick }
      style={{ ...style, position: 'relative' }}
    >
      <Icon size={30} />
      {isHovered && <div className="tooltip-text">{ tooltipText }</div>}
    </div>
  );
};

export default TooltipIcon;


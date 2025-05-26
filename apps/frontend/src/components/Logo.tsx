'use client';

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  showText?: boolean;
}

export const Logo = ({ 
  width = 40, 
  height = 40, 
  className = '', 
  variant = 'default',
  showText = true,
  ...props 
}: LogoProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) => {
  // Calculate aspect ratio based on the full logo (with text below)
  // Original logo proportions are approximately 1:1.5 (width:height) when including the text
  const calculatedHeight = showText ? height * 1.5 : height;
  
  // Background is transparent by default
  const containerClass = variant === 'light' 
    ? 'bg-white bg-opacity-10' 
    : variant === 'dark' 
      ? 'bg-indigo-600/10' 
      : '';

  return (
    <div 
      className={`relative flex items-center justify-center ${containerClass} ${className}`}
      style={{ width, height: calculatedHeight }}
    >
      <Image 
        src="/SuiZkCredLogo.png" 
        alt="SuiZkCred Logo" 
        width={width}
        height={calculatedHeight}
        className="object-contain" 
        priority
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          // Show fallback text if image fails to load
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const textColor = variant === 'light' ? 'text-white' : variant === 'dark' ? 'text-white' : 'text-blue-800';
            const textNode = document.createElement('div');
            textNode.className = `${textColor} font-bold text-center`;
            textNode.innerHTML = '<div style="font-size: 150%">ZK</div><div>SuiZkCred</div>';
            parent.appendChild(textNode);
          }
        }}
        {...props}
      />
    </div>
  );
};

export default Logo;
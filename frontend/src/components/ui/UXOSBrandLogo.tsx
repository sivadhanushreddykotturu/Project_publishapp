import React from 'react';

interface UXOSBrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const UXOSBrandLogo: React.FC<UXOSBrandLogoProps> = ({
  size = 'md',
  isDarkMode = true,
  showText = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-lg' },
    md: { img: 'w-9 h-9', text: 'text-xl' },
    lg: { img: 'w-11 h-11', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`${currentSize.img} rounded-full flex items-center justify-center shrink-0`}>
        <img
          src="/logo-purple.png"
          alt="UXOS Logo"
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </div>
      {showText && (
        <span
          className={`font-extrabold tracking-widest uppercase transition-colors ${currentSize.text} ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          UX<span className="text-[#4F37FE]">OS</span>
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        type="button"
        className="cursor-pointer focus:outline-none border-0 bg-transparent p-0 text-left"
      >
        {content}
      </button>
    );
  }

  return content;
};

export default UXOSBrandLogo;

import React, { useState } from 'react';

export interface TokenLogoProps {
  underlying?: string;
  symbol?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  iconColor?: string;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showBadge?: boolean;
  leverage?: number;
  isShort?: boolean;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({
  underlying,
  symbol,
  size = 'md',
  iconColor = '#00C805',
  className = '',
  rounded = 'full',
  showBadge = false,
  leverage,
  isShort,
}) => {
  const [hasError, setHasError] = useState(false);

  // Extract clean underlying token code
  const cleanUnderlying = React.useMemo(() => {
    if (underlying) return underlying.toUpperCase();
    if (symbol) {
      // e.g. dBTC3L -> BTC, dSOL5L -> SOL, dETH3S -> ETH
      const match = symbol.match(/^d?([A-Za-z0-9]+?)(?:\d+[LS])?$/i);
      if (match && match[1]) return match[1].toUpperCase();
      return symbol.toUpperCase();
    }
    return 'TOK';
  }, [underlying, symbol]);

  const logoSrc = `/logos/${cleanUnderlying.toLowerCase()}.png`;

  // Size mapping (px)
  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg',
    '2xl': 'w-16 h-16 text-xl',
  }[size];

  const roundedClasses = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      <div 
        className={`${sizeClasses} ${roundedClasses} overflow-hidden flex items-center justify-center font-bold font-mono shadow-md border border-white/[0.12] bg-[#0A0D14]`}
        style={{
          boxShadow: `0 2px 10px -2px ${iconColor}25`,
        }}
      >
        {!hasError ? (
          <img
            src={logoSrc}
            alt={`${cleanUnderlying} logo`}
            className="w-full h-full object-cover p-0.5"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center font-bold tracking-tight"
            style={{
              backgroundColor: `${iconColor}20`,
              color: iconColor,
            }}
          >
            {cleanUnderlying.slice(0, 3)}
          </div>
        )}
      </div>

      {/* Optional Leverage Badge on corner */}
      {showBadge && leverage !== undefined && (
        <span 
          className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[9px] font-mono font-bold leading-tight border shadow-md ${
            isShort 
              ? 'bg-red-500 text-white border-red-400/50' 
              : 'bg-rh-green text-black border-white/40'
          }`}
        >
          {isShort ? `${Math.abs(leverage)}S` : `${leverage}L`}
        </span>
      )}
    </div>
  );
};

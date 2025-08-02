import { DollarSign } from "lucide-react";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showIcon = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-lg',
      iconSize: 'h-3 w-3'
    },
    md: {
      icon: 'w-10 h-10',
      text: 'text-2xl',
      iconSize: 'h-6 w-6'
    },
    lg: {
      icon: 'w-12 h-12',
      text: 'text-3xl',
      iconSize: 'h-7 w-7'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showIcon && (
        <div className={`${classes.icon} bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg`}>
          <DollarSign className={`${classes.iconSize} text-white`} />
        </div>
      )}
      
      <div>
        <h1 className={`${classes.text} font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent`}>
          InvestLocal
        </h1>
      </div>
    </div>
  );
} 
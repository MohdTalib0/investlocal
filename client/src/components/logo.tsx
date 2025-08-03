interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const sizeClasses = {
    sm: {
      container: 'w-24 h-6',
      image: 'w-20 h-4'
    },
    md: {
      container: 'w-32 h-8',
      image: 'w-38 h-40'
    },
    lg: {
      container: 'w-48 h-12',
      image: 'w-44 h-10'
    },
    xl: {
      container: 'w-64 h-16',
      image: 'w-60 h-14'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${classes.container} flex items-center justify-center`}>
        <img
          src="/image.png"
          alt="InvestLocal Logo"
          className={`${classes.image} object-contain drop-shadow-lg`}
        />
      </div>
    </div>
  );
};

export default Logo; 
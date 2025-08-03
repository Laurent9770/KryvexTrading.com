import { TrendingUp } from "lucide-react";

interface KryvexLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const KryvexLogo = ({ size = "md", showText = true, className = "" }: KryvexLogoProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10",
    xl: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl", 
    xl: "text-3xl"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-kucoin flex items-center justify-center relative overflow-hidden`}>
        {/* Geometric background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-kucoin-green to-kucoin-yellow opacity-90"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='10,0 20,10 10,20 0,10'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Main Icon */}
        <TrendingUp className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'} text-black font-bold relative z-10`} />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-kucoin-green/50 to-kucoin-yellow/50 blur-sm"></div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-gradient-crypto tracking-tight`}>
          Kryvex
        </span>
      )}
    </div>
  );
};

export default KryvexLogo;
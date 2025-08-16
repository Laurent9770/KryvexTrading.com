import React from 'react';

interface SimulationDisclaimerProps {
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
}

export const SimulationDisclaimer: React.FC<SimulationDisclaimerProps> = ({ 
  variant = 'banner',
  className = ''
}) => {
  const baseStyles = "flex items-center gap-2 text-sm font-medium";
  
  const variants = {
    banner: `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg`,
    card: `${baseStyles} bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-md`,
    inline: `${baseStyles} text-yellow-600`
  };

  const styles = `${variants[variant]} ${className}`;

  return (
    <div className={styles}>
      <span className="text-lg">⚠️</span>
      <span>
        {variant === 'banner' && (
          <>
            <strong>Simulation Mode:</strong> All balances, transactions, and trading activities are for educational purposes only. No real money is involved.
          </>
        )}
        {variant === 'card' && (
          <>
            <strong>Demo:</strong> This is a simulation environment for learning trading strategies.
          </>
        )}
        {variant === 'inline' && (
          <>
            Simulation money only
          </>
        )}
      </span>
    </div>
  );
};

export default SimulationDisclaimer;

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-slate-600">{text}</span>}
    </div>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
}> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full bg-slate-100 rounded-full h-2 ${className}`}>
      <div 
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

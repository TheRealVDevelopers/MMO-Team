
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-border/50 p-6 transition-all duration-300 ${
        hover ? 'hover:shadow-luxury hover:border-kurchi-gold-500/30 hover:-translate-y-0.5' : ''
      } ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

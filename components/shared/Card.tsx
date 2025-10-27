
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-surface rounded-lg shadow-sm p-4 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
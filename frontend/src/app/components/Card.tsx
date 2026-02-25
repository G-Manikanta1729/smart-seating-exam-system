import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  gradient?: boolean;
}

export function Card({ children, className = '', title, gradient = false }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${gradient ? 'bg-gradient-to-br from-white to-[#F7FAFC]' : ''} ${className}`}>
      {title && <h3 className="mb-4 text-[#2D3748] bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">{title}</h3>}
      {children}
    </div>
  );
}

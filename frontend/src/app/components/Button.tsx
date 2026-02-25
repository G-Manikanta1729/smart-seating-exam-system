import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'gradient';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseClasses = 'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:from-[#5568d3] hover:to-[#6a3f8f]',
    secondary: 'bg-white text-[#667eea] border-2 border-[#667eea] hover:bg-[#667eea] hover:text-white',
    danger: 'bg-gradient-to-r from-[#F56565] to-[#E53E3E] text-white hover:from-[#E53E3E] hover:to-[#C53030]',
    success: 'bg-gradient-to-r from-[#48BB78] to-[#38A169] text-white hover:from-[#38A169] hover:to-[#2F855A]',
    ghost: 'bg-transparent text-[#718096] hover:bg-[#F7FAFC] hover:text-[#667eea]',
    gradient: 'bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#F093FB] text-white hover:shadow-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

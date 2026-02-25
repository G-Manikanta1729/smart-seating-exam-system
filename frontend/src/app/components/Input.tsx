import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm mb-2 text-[#2D3748] font-medium">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl bg-white text-[#2D3748] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all duration-200 hover:border-[#CBD5E0] ${className}`}
        {...props}
      />
    </div>
  );
}

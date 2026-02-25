import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm mb-2 text-[#2D3748] font-medium">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl bg-white text-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all duration-200 hover:border-[#CBD5E0] cursor-pointer ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

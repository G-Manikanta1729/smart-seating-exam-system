import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  gradient?: string;
}

export function StatCard({ title, value, icon, color = '#667eea', gradient }: StatCardProps) {
  const defaultGradient = `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`;
  const bgGradient = gradient || defaultGradient;

  return (
    <div
      className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      style={{ background: `linear-gradient(to bottom right, white, ${color}08)` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#718096] mb-2 font-medium">{title}</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">{value}</p>
        </div>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transform transition-transform duration-300 hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: `0 8px 16px ${color}40`
          }}
        >
          <div style={{ color: 'white' }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

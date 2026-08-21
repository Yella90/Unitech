// components/public/AgentIcon.tsx
'use client';

import { IconType } from 'react-icons';

interface AgentIconProps {
  icon: IconType;
  color: string;
  size?: number;
  className?: string;
}

export default function AgentIcon({ icon: Icon, color, size = 48, className = '' }: AgentIconProps) {
  return (
    <div
      className={`flex items-center justify-center text-white shadow-lg ${className}`}
      style={{ backgroundColor: color, width: size, height: size, borderRadius: '1rem' }}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}
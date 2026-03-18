import { Settings } from 'lucide-react';
import { AdminMode } from './AdminMode';
import { Screen } from '../../types/ui';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSettingsClick: () => void;
  onNavigate: (screen: Screen) => void;
}

export function Header({ title, subtitle, onSettingsClick, onNavigate }: HeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 glass-header sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-medium text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-jsv-orange text-[10px] font-medium tracking-widest uppercase mt-0.5 opacity-90">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <AdminMode onNavigate={onNavigate} />
        <button 
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-white glass-button rounded-full transition-all"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

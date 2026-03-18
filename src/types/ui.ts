import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export type Screen = 'dashboard' | 'inventory' | 'audit' | 'export' | 'settings' | 'settings-ai' | 'settings-workflows' | 'settings-components' | 'quotes' | 'canvas' | 'warranty' | 'notifications' | 'tasks' | 'messages' | 'browser' | 'agent' | 'agent-workspace' | 'live-voice';

export type SettingsTab = 'general' | 'ai' | 'workflows' | 'components' | 'agents';

export interface CanvasData {
  vehicle: {
    model: string;
    yearRange: string;
  };
  part: {
    name: string;
    price: number;
  };
  imageUrl?: string;
}

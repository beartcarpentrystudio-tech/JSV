import React from 'react';
import { GeminiLiveSession } from '../components/GeminiLiveSession';

interface LiveVoiceScreenProps {
  onClose: () => void;
}

export function LiveVoiceScreen({ onClose }: LiveVoiceScreenProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col">
      <div className="flex-1">
        <GeminiLiveSession onClose={onClose} />
      </div>
      
      <div className="p-8 text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
          Powered by Gemini 2.5 Native Audio • MondayOS Intelligence
        </p>
      </div>
    </div>
  );
}

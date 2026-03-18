import React, { useState, useRef, useEffect } from 'react';
import { Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';

interface FloatingJoystickProps {
  onMove: (x: number, y: number) => void;
  label?: string;
}

export function FloatingJoystick({ onMove, label }: FloatingJoystickProps) {
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMoving = (dx: number, dy: number) => {
    // Immediate move
    onMove(dx, dy);
    
    // Continuous move
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      onMove(dx, dy);
    }, 50); // 50ms interval for smooth-ish movement
  };

  const stopMoving = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMoving();
  }, []);

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {label && isOpen && (
        <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded-md mb-2 font-mono border border-gray-700">
          MOVIENDO: <span className="text-jsv-orange font-bold">{label}</span>
        </div>
      )}

      <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'} flex flex-col items-center gap-1 bg-gray-900/90 p-2 rounded-full border border-gray-700 backdrop-blur-sm shadow-xl`}>
        {/* UP */}
        <button
          className="p-3 bg-gray-800 rounded-full active:bg-jsv-orange active:text-black text-white transition-colors"
          onPointerDown={() => startMoving(0, -5)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
        >
          <ChevronUp size={24} />
        </button>
        
        <div className="flex gap-1">
          {/* LEFT */}
          <button
            className="p-3 bg-gray-800 rounded-full active:bg-jsv-orange active:text-black text-white transition-colors"
            onPointerDown={() => startMoving(-5, 0)}
            onPointerUp={stopMoving}
            onPointerLeave={stopMoving}
          >
            <ChevronLeft size={24} />
          </button>
          
          {/* CENTER / INDICATOR */}
          <div className="w-12 h-12 flex items-center justify-center bg-black rounded-full border border-gray-800">
            <Move size={20} className="text-gray-500" />
          </div>

          {/* RIGHT */}
          <button
            className="p-3 bg-gray-800 rounded-full active:bg-jsv-orange active:text-black text-white transition-colors"
            onPointerDown={() => startMoving(5, 0)}
            onPointerUp={stopMoving}
            onPointerLeave={stopMoving}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* DOWN */}
        <button
          className="p-3 bg-gray-800 rounded-full active:bg-jsv-orange active:text-black text-white transition-colors"
          onPointerDown={() => startMoving(0, 5)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-2 ${isOpen ? 'bg-gray-800 border-gray-600 text-white rotate-45' : 'bg-jsv-orange border-white text-black hover:scale-110'}`}
      >
        {isOpen ? <span className="text-2xl font-bold">+</span> : <MousePointer2 size={24} />}
      </button>
    </div>
  );
}

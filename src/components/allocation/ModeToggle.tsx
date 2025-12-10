import { AllocationMode } from '@/types/allocation';
import { Sparkles, User } from 'lucide-react';

interface ModeToggleProps {
  mode: AllocationMode;
  onModeChange: (mode: AllocationMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="relative inline-flex p-1 rounded-lg bg-white/5 border border-white/8">
      {/* Sliding indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-200 ease-out ${
          mode === 'auto'
            ? 'left-1 bg-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.4)]'
            : 'left-[calc(50%+2px)] bg-[#FFB84D] shadow-[0_0_20px_rgba(255,184,77,0.4)]'
        }`}
      />

      {/* Auto Mode Button */}
      <button
        onClick={() => onModeChange('auto')}
        className={`relative z-10 px-6 py-2 rounded-md text-sm font-display font-bold transition-colors duration-200 flex items-center gap-2 ${
          mode === 'auto' ? 'text-[#0F1419]' : 'text-white/60 hover:text-white/80'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        Auto
      </button>

      {/* Manual Mode Button */}
      <button
        onClick={() => onModeChange('manual')}
        className={`relative z-10 px-6 py-2 rounded-md text-sm font-display font-bold transition-colors duration-200 flex items-center gap-2 ${
          mode === 'manual' ? 'text-[#0F1419]' : 'text-white/60 hover:text-white/80'
        }`}
      >
        <User className="w-4 h-4" />
        Manual
      </button>
    </div>
  );
}

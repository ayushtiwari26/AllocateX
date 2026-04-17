import { AllocationMode } from '@/types/allocation';
import { Sparkles, User } from 'lucide-react';

interface ModeToggleProps {
  mode: AllocationMode;
  onModeChange: (mode: AllocationMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="relative inline-flex p-1 rounded-lg bg-gray-100 border border-gray-200">
      {/* Sliding indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-200 ease-out shadow-sm ${mode === 'auto'
            ? 'left-1 bg-white ring-1 ring-gray-200'
            : 'left-[calc(50%+2px)] bg-white ring-1 ring-gray-200'
          }`}
      />

      {/* Auto Mode Button */}
      <button
        onClick={() => onModeChange('auto')}
        className={`relative z-10 px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${mode === 'auto' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
          }`}
      >
        <Sparkles className="w-4 h-4" />
        Auto
      </button>

      {/* Manual Mode Button */}
      <button
        onClick={() => onModeChange('manual')}
        className={`relative z-10 px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${mode === 'manual' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
          }`}
      >
        <User className="w-4 h-4" />
        Manual
      </button>
    </div>
  );
}

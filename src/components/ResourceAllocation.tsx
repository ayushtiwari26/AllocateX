import { useState } from 'react';
import { AllocationMode } from '@/types/allocation';
import { ModeToggle } from './allocation/ModeToggle';
import { TaskQueue } from './allocation/TaskQueue';
import { TeamTree } from './allocation/TeamTree';
import { AssignmentHistory } from './allocation/AssignmentHistory';
import { mockTasks, mockProjects, mockAssignments } from '@/data/mockData';

export default function ResourceAllocation() {
  const [mode, setMode] = useState<AllocationMode>('auto');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [balanceMode, setBalanceMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F1419] noise-texture text-white">
      {/* Header */}
      <div className="border-b border-white/8 backdrop-blur-sm bg-[#0F1419]/80 sticky top-0 z-50">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-display font-bold text-white mb-1">
              Resource Allocation
            </h1>
            <p className="text-sm text-white/60 font-body">
              Intelligent task assignment with AI-powered matching
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBalanceMode(!balanceMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                balanceMode
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'bg-white/5 text-white/60 border border-white/8 hover:bg-white/10'
              }`}
            >
              Balance Mode
            </button>
            <ModeToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-97px)]">
        {/* Task Queue - 20% */}
        <div className="w-[20%] border-r border-white/8">
          <TaskQueue
            tasks={mockTasks}
            selectedTaskId={selectedTaskId}
            onTaskSelect={setSelectedTaskId}
          />
        </div>

        {/* Team Tree - 50% */}
        <div className="w-[50%] border-r border-white/8">
          <TeamTree
            projects={mockProjects}
            mode={mode}
            selectedTaskId={selectedTaskId}
            balanceMode={balanceMode}
          />
        </div>

        {/* Assignment History - 30% */}
        <div className="w-[30%]">
          <AssignmentHistory assignments={mockAssignments} />
        </div>
      </div>
    </div>
  );
}

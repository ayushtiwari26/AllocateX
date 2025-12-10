import { Task } from '@/types/allocation';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskQueueProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
}

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function TaskQueue({ tasks, selectedTaskId, onTaskSelect }: TaskQueueProps) {
  const formatDeadline = (date: Date) => {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-white/8">
        <h2 className="text-lg font-display font-bold text-white">Task Queue</h2>
        <p className="text-xs text-white/60 mt-1 font-mono">{tasks.length} unassigned</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskSelect(task.id)}
            className={`glass-panel rounded-lg p-4 cursor-pointer transition-all hover:bg-white/10 ${
              selectedTaskId === task.id
                ? 'ring-2 ring-[#00D9FF] bg-[#00D9FF]/10'
                : ''
            }`}
          >
            {/* Priority Badge */}
            <div className="flex items-start justify-between mb-2">
              <Badge
                variant="outline"
                className={`text-[10px] font-mono uppercase ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </Badge>
              {task.priority === 'critical' && (
                <AlertCircle className="w-4 h-4 text-[#FF6B6B]" />
              )}
            </div>

            {/* Task Title */}
            <h3 className="text-sm font-body font-semibold text-white mb-2 line-clamp-2">
              {task.title}
            </h3>

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{task.estimatedHours}h</span>
                <Calendar className="w-3 h-3 ml-2" />
                <span className="font-mono">{formatDeadline(task.deadline)}</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1">
                {task.requiredSkills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10"
                  >
                    {skill}
                  </span>
                ))}
                {task.requiredSkills.length > 3 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 text-white/50">
                    +{task.requiredSkills.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

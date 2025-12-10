import { Assignment } from '@/types/allocation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, Clock } from 'lucide-react';
import { mockTasks, mockMembers } from '@/data/mockData';

interface AssignmentHistoryProps {
  assignments: Assignment[];
}

export function AssignmentHistory({ assignments }: AssignmentHistoryProps) {
  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-white/8">
        <h2 className="text-lg font-display font-bold text-white">Assignment History</h2>
        <p className="text-xs text-white/60 mt-1 font-mono">
          {assignments.length} recent allocations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {assignments.map((assignment) => {
          const task = mockTasks.find((t) => t.id === assignment.taskId);
          const member = mockMembers.find((m) => m.id === assignment.memberId);

          if (!task || !member) return null;

          return (
            <div
              key={assignment.id}
              className="glass-panel rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono uppercase ${
                    assignment.mode === 'auto'
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/30'
                      : 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/30'
                  }`}
                >
                  {assignment.mode === 'auto' ? (
                    <Sparkles className="w-3 h-3 mr-1 inline" />
                  ) : (
                    <User className="w-3 h-3 mr-1 inline" />
                  )}
                  {assignment.mode}
                </Badge>

                <div className="flex items-center gap-1 text-[10px] font-mono text-white/50">
                  <Clock className="w-3 h-3" />
                  {formatTime(assignment.assignedAt)}
                </div>
              </div>

              {/* Task Info */}
              <h3 className="text-sm font-body font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#00D9FF] transition-colors">
                {task.title}
              </h3>

              {/* Member Info */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6 border border-white/10">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-white/10 text-white text-[10px]">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-body text-white/80">{member.name}</span>
              </div>

              {/* AI Match Score or Assignee */}
              {assignment.mode === 'auto' && assignment.aiMatchScore && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/60 font-body">Match Score:</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00D9FF] to-[#00D9FF]/60"
                      style={{ width: `${assignment.aiMatchScore * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[#00D9FF]">
                    {Math.round(assignment.aiMatchScore * 100)}%
                  </span>
                </div>
              )}

              {assignment.mode === 'manual' && (
                <div className="text-xs text-white/60 font-body">
                  Assigned by <span className="text-[#FFB84D]">{assignment.assignedBy}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

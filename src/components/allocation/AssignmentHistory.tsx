import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, Clock } from 'lucide-react';

export interface AssignmentHistoryEntry {
  id: string;
  mode: 'auto' | 'manual';
  assignedAt: string | Date;
  assignedBy?: string;
  aiMatchScore?: number;
  task: {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  member: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
}

interface AssignmentHistoryProps {
  assignments: AssignmentHistoryEntry[];
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
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Assignment History</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          {assignments.length} recent allocations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {assignments.map((assignment) => {
          const { task, member } = assignment;
          return (
            <div
              key={assignment.id}
              className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono uppercase ${assignment.mode === 'auto'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}
                >
                  {assignment.mode === 'auto' ? (
                    <Sparkles className="w-3 h-3 mr-1 inline" />
                  ) : (
                    <User className="w-3 h-3 mr-1 inline" />
                  )}
                  {assignment.mode}
                </Badge>

                <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatTime(new Date(assignment.assignedAt))}
                </div>
              </div>

              {/* Task Info */}
              <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {task.title}
              </h3>

              {/* Member Info */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6 border border-gray-200">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px]">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600">{member.name}{member.role ? ` • ${member.role}` : ''}</span>
              </div>

              {/* AI Match Score or Assignee */}
              {assignment.mode === 'auto' && assignment.aiMatchScore && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Match:</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${assignment.aiMatchScore * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-indigo-600 font-medium">
                    {Math.round(assignment.aiMatchScore * 100)}%
                  </span>
                </div>
              )}

              {assignment.mode === 'manual' && assignment.assignedBy && (
                <div className="text-xs text-gray-500">
                  Assigned by <span className="text-orange-600 font-medium">{assignment.assignedBy}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

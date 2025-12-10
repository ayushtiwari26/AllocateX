import { TeamMember, AIMatch } from '@/types/allocation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface MemberCardProps {
  member: TeamMember;
  mode: 'auto' | 'manual';
  balanceMode: boolean;
  isTaskSelected: boolean;
  aiMatch?: AIMatch;
}

export function MemberCard({ member, mode, balanceMode, isTaskSelected, aiMatch }: MemberCardProps) {
  const utilizationPercentage = (member.currentWorkload / member.maxCapacity) * 100;

  const getAvailabilityColor = () => {
    if (member.availability === 'available') return 'bg-green-500';
    if (member.availability === 'busy') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBalanceColor = () => {
    if (utilizationPercentage < 70) return 'border-green-500/50 bg-green-500/10';
    if (utilizationPercentage < 95) return 'border-yellow-500/50 bg-yellow-500/10';
    return 'border-red-500/50 bg-red-500/10';
  };

  const isAIRecommended = aiMatch && aiMatch.confidenceScore > 0.6;

  return (
    <div
      className={`glass-panel rounded-lg p-3 cursor-pointer transition-all hover:bg-white/10 relative ${
        balanceMode ? getBalanceColor() : ''
      } ${isTaskSelected && mode === 'auto' ? 'hover:ring-2 hover:ring-[#00D9FF]' : ''} ${
        isAIRecommended ? 'ring-2 ring-[#00D9FF] bg-[#00D9FF]/5' : ''
      }`}
    >
      {/* AI Match Badge */}
      {aiMatch && (
        <div className="absolute -top-2 -right-2 bg-[#00D9FF] text-[#0F1419] text-[10px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Sparkles className="w-3 h-3" />
          {Math.round(aiMatch.confidenceScore * 100)}%
        </div>
      )}
      <div className="flex items-start gap-3">
        {/* Avatar with status */}
        <div className="relative">
          <Avatar className="w-10 h-10 border-2 border-white/10">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="bg-white/10 text-white text-xs">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F1419] ${getAvailabilityColor()}`}
          />
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-body font-semibold text-white truncate">
              {member.name}
            </h4>
            {member.availability === 'overloaded' && (
              <AlertTriangle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 animate-pulse" />
            )}
          </div>

          {/* Workload Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-white/60 mb-1">
              <span>Workload</span>
              <span>
                {member.currentWorkload}h / {member.maxCapacity}h
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-400 ${
                  utilizationPercentage < 70
                    ? 'bg-green-500'
                    : utilizationPercentage < 95
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {member.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/70 border border-white/10"
              >
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 text-white/50">
                +{member.skills.length - 3}
              </span>
            )}
          </div>

          {/* AI Reasoning */}
          {aiMatch && aiMatch.reasoning && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-[10px] text-[#00D9FF] font-body leading-relaxed">
                {aiMatch.reasoning}
              </p>
              {aiMatch.conflicts.length > 0 && (
                <div className="mt-1 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#FFB84D] flex-shrink-0 mt-0.5" />
                  <p className="text-[9px] text-[#FFB84D] font-body">
                    {aiMatch.conflicts.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

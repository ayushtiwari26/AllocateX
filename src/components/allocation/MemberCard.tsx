import { useDraggable } from '@dnd-kit/core';
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
  onEdit?: (updates: Partial<TeamMember>) => void;
  onDelete?: () => void;
  draggableId?: string;
}

import { AddMemberDialog } from './AddMemberDialog';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MemberCard({ member, mode, balanceMode, isTaskSelected, aiMatch, onEdit, onDelete, draggableId }: MemberCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId || member.id,
    data: { member }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : undefined,
  } : undefined;

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
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`glass-panel rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-white/10 relative group ${balanceMode ? getBalanceColor() : ''
        } ${isTaskSelected && mode === 'auto' ? 'hover:ring-2 hover:ring-[#00D9FF]' : ''} ${isAIRecommended ? 'ring-2 ring-[#00D9FF] bg-[#00D9FF]/5' : ''
        } ${isDragging ? 'opacity-50 rotate-3 scale-105 shadow-xl' : ''}`}
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
        <div className="relative group/avatar">
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

          {/* Actions - visible on hover of card (using parent group hover) */}
          <div className="absolute -bottom-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#151a21]/90 rounded-full p-1 border border-white/10 shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <AddMemberDialog
                member={member}
                onSave={onEdit}
                trigger={
                  <button className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-[#00D9FF]">
                    <Pencil className="w-3 h-3" />
                  </button>
                }
              />
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#151a21] border-white/10 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Member?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                      Are you sure you want to remove {member.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-sm truncate pr-2">
              {member.name}
            </h3>
            {aiMatch && (
              <div className="flex items-center gap-1 text-[#00D9FF]">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-mono font-bold">98%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
              {member.role}
            </span>
            {member.skills && member.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-[9px] h-4 px-1 py-0 border-white/10 text-white/60">{skill}</Badge>
            ))}
            {member.skills && member.skills.length > 3 && (
              <span className="text-[9px] text-white/40">+{member.skills.length - 3}</span>
            )}
          </div>

          {/* Workload Stats */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px] text-white/40">
              <span>Load ({Math.round(utilizationPercentage)}%)</span>
              <span>{member.currentWorkload}h / {member.maxCapacity}h</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-400 ${utilizationPercentage < 70
                  ? 'bg-green-500'
                  : utilizationPercentage < 95
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-white/40 bg-white/5 px-1.5 rounded">
                3 Tasks
              </span>
              <span className="text-[10px] text-white/40 bg-white/5 px-1.5 rounded">
                Avg 6.5h
              </span>
            </div>
          </div>
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
  );
}

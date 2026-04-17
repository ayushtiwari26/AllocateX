import { useDraggable } from '@dnd-kit/core';
import { TeamMember, AIMatch, ProjectRequirement } from '@/types/allocation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface MemberCardProps {
  member: TeamMember;
  projectId: string;
  projectName: string;
  teamId: string;
  teamName: string;
  requirements?: ProjectRequirement[];
  teamMembers?: TeamMember[];
  projectMembers?: TeamMember[];
  mode: 'auto' | 'manual';
  balanceMode: boolean;
  isTaskSelected: boolean;
  aiMatch?: AIMatch;
  onEdit?: (updates: { role?: string; allocationPercentage?: number }) => Promise<void>;
  onDelete?: () => Promise<void>;
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

export function MemberCard({ member, projectId, projectName, teamId, teamName, requirements, teamMembers = [], projectMembers = [], mode, balanceMode, isTaskSelected, aiMatch, onEdit, onDelete, draggableId }: MemberCardProps) {
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
    if (utilizationPercentage < 70) return 'border-green-500 bg-green-50';
    if (utilizationPercentage < 95) return 'border-yellow-500 bg-yellow-50';
    return 'border-red-500 bg-red-50';
  };

  const isAIRecommended = aiMatch && aiMatch.confidenceScore > 0.6;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 relative group ${balanceMode ? getBalanceColor() : 'border-gray-100 shadow-sm'
        } ${isTaskSelected && mode === 'auto' ? 'ring-2 ring-indigo-500/50' : ''} ${isAIRecommended ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''
        } ${isDragging ? 'opacity-90 rotate-2 scale-105 shadow-2xl ring-2 ring-indigo-600 z-50' : ''}`}
    >
      {/* AI Match Badge */}
      {aiMatch && (
        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-10 animate-in fade-in zoom-in duration-300">
          <Sparkles className="w-3 h-3" />
          {Math.round(aiMatch.confidenceScore * 100)}%
        </div>
      )}
      <div className="flex items-start gap-3.5">
        {/* Avatar with status */}
        <div className="relative group/avatar flex-shrink-0">
          <Avatar className="w-11 h-11 border-2 border-white shadow-sm ring-1 ring-gray-100">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-slate-100 text-indigo-600 text-xs font-medium">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${getAvailabilityColor()}`}
          />

          {/* Actions - visible on hover of card (using parent group hover) */}
          <div className="absolute -bottom-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white shadow-lg rounded-full p-1 border border-gray-100 z-10 scale-90 group-hover:scale-100" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <AddMemberDialog
                member={member}
                projectId={projectId}
                projectName={projectName}
                teamId={teamId}
                teamName={teamName}
                requirements={requirements}
                teamMembers={teamMembers}
                projectMembers={projectMembers}
                onUpdate={onEdit}
                trigger={
                  <button className="p-1.5 hover:bg-indigo-50 rounded-full transition-colors text-gray-400 hover:text-indigo-600">
                    <Pencil className="w-3 h-3" />
                  </button>
                }
              />
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-gray-200 text-gray-900">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Member?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500">
                      Are you sure you want to remove {member.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-gray-200 text-gray-900 hover:bg-gray-50 hover:text-gray-900">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm truncate pr-2 tracking-tight">
              {member.name}
            </h3>
            {aiMatch && (
              <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-bold">98%</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              {member.role}
            </span>
            {member.skills && member.skills.slice(0, 2).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[9px] h-4 px-1.5 py-0 bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 font-medium">{skill}</Badge>
            ))}
            {member.skills && member.skills.length > 2 && (
              <span className="text-[9px] text-gray-400 font-medium">+{member.skills.length - 2}</span>
            )}
          </div>

          {/* Workload Stats */}
          <div className="pt-1 space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-gray-500">
              <span>Load ({Math.round(utilizationPercentage)}%)</span>
              <span>{member.currentWorkload}h / {member.maxCapacity}h</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-500 ease-out rounded-full ${utilizationPercentage < 70
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : utilizationPercentage < 95
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      {aiMatch && aiMatch.reasoning && (
        <div className="mt-3 pt-2 border-t border-indigo-100/50 w-full">
          <p className="text-[10px] text-indigo-600/90 leading-relaxed font-medium">
            {aiMatch.reasoning}
          </p>
          {aiMatch.conflicts.length > 0 && (
            <div className="mt-1.5 flex items-start gap-1.5 bg-orange-50 p-1.5 rounded border border-orange-100">
              <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-orange-700 font-medium">
                {aiMatch.conflicts.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

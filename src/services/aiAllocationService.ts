import { Project, TeamMember } from '@/types/allocation';
import { chatService } from './ChatService';

export interface AIAllocationMove {
  memberId: string;
  sourceTeamId: string | null;
  targetTeamId: string;
  memberName?: string;
  targetTeamName?: string;
  reasoning?: string;
  priority?: string;
  expectedImpact?: string;
}

export interface AIReplacement {
  currentMemberId: string;
  replacementMemberId: string;
  teamId: string;
  currentMemberName?: string;
  replacementMemberName?: string;
  reasoning?: string;
  urgency?: string;
}

export interface TimelineShift {
  memberId: string;
  memberName?: string;
  fromTeamId: string | null;
  fromTeamName?: string;
  targetTeamId: string;
  targetTeamName?: string;
  reasoning?: string;
  impact?: string;
}

export interface TimelineInsights {
  onTrackProjects?: string[];
  atRiskProjects?: string[];
  recommendedShifts?: TimelineShift[];
  urgentActions?: string[];
}

export interface AIAllocationResult {
  moves: AIAllocationMove[];
  replacements: AIReplacement[];
  risks: string[];
  summary: string;
  timeline?: TimelineInsights;
  rawResponse?: string;
  metadata?: {
    generatedAt: string;
    projectCount: number;
    poolSampleSize: number;
  };
}

type MemberContext = {
  member?: TeamMember;
  teamId: string | null;
  teamName?: string;
  projectName?: string;
};

const SYSTEM_PROMPT = [
  'You are AllocX, an AI resource allocation strategist for an IT services organization. Your goal is to rebalance engineers so projects hit their deadlines without overloading anyone.',
  'You must respond with a STRICT JSON object wrapped in <json> and </json> tags.',
  'Do not include any conversational text, markdown, or explanations outside the tags.',
  'The JSON structure must be exactly as follows:',
  '{',
  '  "moves": [',
  '    {',
  '      "memberId": "string",',
  '      "targetTeamId": "string",',
  '      "reasoning": "string",',
  '      "priority": "low" | "medium" | "high" | "critical",',
  '      "expectedImpact": "string"',
  '    }',
  '  ],',
  '  "replacements": [',
  '    {',
  '      "currentMemberId": "string",',
  '      "replacementMemberId": "string",',
  '      "teamId": "string",',
  '      "reasoning": "string",',
  '      "urgency": "string"',
  '    }',
  '  ],',
  '  "risks": ["string"],',
  '  "timeline": {',
  '    "onTrackProjects": ["Project Name"],',
  '    "atRiskProjects": ["Project Name"],',
  '    "recommendedShifts": [',
  '      {',
  '        "memberId": "string",',
  '        "targetTeamId": "string",',
  '        "reasoning": "string",',
  '        "impact": "string"',
  '      }',
  '    ],',
  '    "urgentActions": ["string"]',
  '  },',
  '  "summary": "short status line"',
  '}',
  'Use empty arrays when you have no data. Ensure all strings are properly escaped. Do not hallucinate or include unrelated text.',
  'IMPORTANT: For "onTrackProjects" and "atRiskProjects", return the Project Name, NOT the ID.',
  'Example Response:',
  '<json>',
  '{',
  '  "moves": [],',
  '  "replacements": [],',
  '  "risks": [],',
  '  "timeline": {},',
  '  "summary": "No changes needed"',
  '}',
  '</json>'
].join('\n');

const trimText = (value: unknown, max = 160): string => {
  const text = value == null ? '' : String(value);
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
};

const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

const collectAssignedMemberIds = (projects: Project[]): Set<string> => {
  const ids = new Set<string>();
  projects.forEach(project => {
    project.teams.forEach(team => {
      team.members.forEach(member => ids.add(member.id));
    });
  });
  return ids;
};

const buildPoolPromptContext = (projects: Project[], poolMembers: TeamMember[]) => {
  const assigned = collectAssignedMemberIds(projects);
  const uniquePool = uniqueById(poolMembers);

  const filteredPool = uniquePool.filter(member => !assigned.has(member.id));

  const capacityFiltered = filteredPool.filter(member => {
    if (member.availability === 'overloaded') return false;
    const capacity = member.maxCapacity || 40;
    const utilization = capacity > 0 ? member.currentWorkload / capacity : 0;
    if (member.availability === 'busy' && utilization >= 0.9) return false;
    return utilization < 1.05;
  });

  const finalPool = capacityFiltered.length ? capacityFiltered : filteredPool;

  const summaryPool = finalPool.slice(0, 30).map(member => ({
    id: member.id,
    name: member.name,
    role: member.role,
    skills: member.skills.slice(0, 6),
    workload: member.currentWorkload,
    capacity: member.maxCapacity,
    availability: member.availability,
  }));

  return {
    promptPool: summaryPool,
    totalAvailable: finalPool.length,
  };
};

const buildProjectsPromptContext = (projects: Project[]) => {
  return projects.slice(0, 6).map(project => {
    const teams = project.teams.slice(0, 5).map(team => {
      const memberCount = team.members.length;
      const totalCapacity = team.members.reduce((acc, member) => acc + (member.maxCapacity || 0), 0);
      const totalWorkload = team.members.reduce((acc, member) => acc + (member.currentWorkload || 0), 0);
      const utilization = totalCapacity > 0 ? Number((totalWorkload / totalCapacity).toFixed(2)) : 0;

      return {
        id: team.id,
        name: team.name,
        memberCount,
        utilization,
        requirements: team.requirements,
        members: team.members.slice(0, 6).map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          skills: member.skills.slice(0, 6),
          workload: member.currentWorkload,
          capacity: member.maxCapacity,
          availability: member.availability,
        })),
      };
    });

    return {
      id: project.id,
      name: project.name,
      priority: project.priority,
      status: project.status,
      requirements: project.requirements,
      teams,
    };
  });
};

const closeBraces = (text: string, startIndex: number) => {
  const snippet = text.slice(startIndex);
  const stack: string[] = [];

  for (let i = 0; i < snippet.length; i += 1) {
    const char = snippet[i];
    if (char === '{' || char === '[') stack.push(char);
    if (char === '}' || char === ']') {
      const opener = stack.pop();
      if (!opener) {
        return snippet.slice(0, i + 1);
      }
      const isPair = (opener === '{' && char === '}') || (opener === '[' && char === ']');
      if (!isPair) {
        stack.push(opener);
      }
    }
  }

  if (!stack.length) return snippet;
  const tail = stack
    .reverse()
    .map((ch) => (ch === '{' ? '}' : ']'))
    .join('');
  return `${snippet}${tail}`;
};

const extractTaggedJson = (text: string) => {
  const lower = text.toLowerCase();
  const start = lower.indexOf('<json>');
  let end = lower.lastIndexOf('</json>');
  if (end === -1) end = lower.lastIndexOf('[/json]'); // Handle common hallucination

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start + 6, end).trim();
  }
  return null;
};

const parseModelJson = (responseText: string): any => {
  const tagged = extractTaggedJson(responseText);
  const clean = (tagged ?? responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()).trim();
  const jsonStart = clean.indexOf('{');
  if (jsonStart === -1) {
    throw new Error('AI response did not contain JSON.');
  }

  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < clean.length; i += 1) {
    const char = clean[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        jsonEnd = i;
        break;
      }
    }
  }

  const hasCompleteObject = jsonEnd !== -1;
  const candidate = hasCompleteObject
    ? clean.substring(jsonStart, jsonEnd + 1)
    : closeBraces(clean, jsonStart);

  try {
    return JSON.parse(candidate);
  } catch (parseError) {
    const repaired = candidate
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    try {
      return JSON.parse(repaired);
    } catch (error) {
      throw new Error(hasCompleteObject ? 'AI response JSON parse failed.' : 'AI response JSON appears truncated.');
    }
  }
};

const normalizeRisks = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map(risk => {
      if (typeof risk === 'string') return risk;
      if (risk && typeof risk === 'object') {
        const payload = risk as Record<string, unknown>;
        const text = payload.reasoning || payload.description || payload.message || payload.name;
        return text ? String(text) : JSON.stringify(payload);
      }
      return String(risk ?? '');
    })
    .filter(risk => Boolean(risk && risk.trim().length > 0));
};

const toStringArray = (input: unknown): string[] | undefined => {
  if (!Array.isArray(input)) return undefined;
  const values = input
    .map(entry => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const candidate = (entry as any).description || (entry as any).reason || (entry as any).message || (entry as any).name;
        return candidate ? String(candidate) : JSON.stringify(entry);
      }
      return entry != null ? String(entry) : undefined;
    })
    .filter((value): value is string => Boolean(value && value.trim().length > 0));
  return values.length ? values : undefined;
};

const locateMemberContext = (memberId: string, projects: Project[], poolMembers: TeamMember[]): MemberContext => {
  let member = poolMembers.find(candidate => candidate.id === memberId);
  if (member) {
    return {
      member,
      teamId: member.teamId ?? null,
    };
  }

  for (const project of projects) {
    for (const team of project.teams) {
      const found = team.members.find(candidate => candidate.id === memberId);
      if (found) {
        return {
          member: found,
          teamId: team.id,
          teamName: team.name,
          projectName: project.name,
        };
      }
    }
  }

  return {
    member: undefined,
    teamId: null,
  };
};

const lookupTeamContext = (teamId: string, projects: Project[]) => {
  for (const project of projects) {
    const team = project.teams.find(candidate => candidate.id === teamId);
    if (team) {
      return {
        teamName: team.name,
        projectName: project.name,
      };
    }
  }
  return {
    teamName: undefined,
    projectName: undefined,
  };
};

const buildTimelineInsights = (
  rawTimeline: unknown,
  projects: Project[],
  poolMembers: TeamMember[],
): TimelineInsights | undefined => {
  if (!rawTimeline || typeof rawTimeline !== 'object') return undefined;

  const timeline = rawTimeline as Record<string, unknown>;

  const onTrackProjects = toStringArray(timeline.onTrackProjects);
  const atRiskProjects = toStringArray(timeline.atRiskProjects ?? timeline.criticalProjects ?? timeline.estimatedBottlenecks);
  const urgentActions = toStringArray(timeline.urgentActions ?? timeline.capacityWarnings ?? timeline.estimatedBottlenecks);

  let recommendedShifts: TimelineShift[] | undefined;
  if (Array.isArray(timeline.recommendedShifts)) {
    const shifts = timeline.recommendedShifts
      .map(shift => {
        if (!shift || typeof shift !== 'object') return null;
        const payload = shift as Record<string, unknown>;
        if (!payload.memberId || !payload.targetTeamId) return null;

        const memberId = String(payload.memberId);
        const targetTeamId = String(payload.targetTeamId);

        const memberContext = locateMemberContext(memberId, projects, poolMembers);
        const teamContext = lookupTeamContext(targetTeamId, projects);
        const fromTeamId = payload.fromTeamId != null ? String(payload.fromTeamId) : memberContext.teamId ?? null;

        return {
          memberId,
          memberName: memberContext.member?.name,
          fromTeamId,
          fromTeamName: payload.fromTeamName ? String(payload.fromTeamName) : memberContext.teamName,
          targetTeamId,
          targetTeamName: payload.targetTeamName ? String(payload.targetTeamName) : teamContext.teamName,
          reasoning: trimText(payload.reasoning ?? payload.reason ?? ''),
          impact: trimText(payload.impact ?? payload.expectedImpact ?? ''),
        } as TimelineShift;
      })
      .filter((entry): entry is TimelineShift => Boolean(entry));

    if (shifts.length) {
      recommendedShifts = shifts;
    }
  }

  const insights: TimelineInsights = {};
  if (onTrackProjects) insights.onTrackProjects = onTrackProjects;
  if (atRiskProjects) insights.atRiskProjects = atRiskProjects;
  if (urgentActions) insights.urgentActions = urgentActions;
  if (recommendedShifts) insights.recommendedShifts = recommendedShifts;

  return Object.keys(insights).length ? insights : undefined;
};

const normalizeMoves = (
  input: unknown,
  projects: Project[],
  poolMembers: TeamMember[],
): AIAllocationMove[] => {
  if (!Array.isArray(input)) return [];

  return input
    .filter(move => move && typeof move === 'object')
    .map(move => {
      const payload = move as Record<string, unknown>;
      if (!payload.memberId || !payload.targetTeamId) return null;

      const memberId = String(payload.memberId);
      const targetTeamId = String(payload.targetTeamId);

      const memberContext = locateMemberContext(memberId, projects, poolMembers);
      const targetContext = lookupTeamContext(targetTeamId, projects);

      return {
        memberId,
        sourceTeamId: memberContext.teamId ?? null,
        targetTeamId,
        memberName: memberContext.member?.name,
        targetTeamName: targetContext.teamName,
        reasoning: payload.reasoning ? trimText(payload.reasoning) : undefined,
        priority: payload.priority ? String(payload.priority) : undefined,
        expectedImpact: payload.expectedImpact ? trimText(payload.expectedImpact) : undefined,
      } as AIAllocationMove;
    })
    .filter((entry): entry is AIAllocationMove => Boolean(entry));
};

const normalizeReplacements = (
  input: unknown,
  projects: Project[],
  poolMembers: TeamMember[],
): AIReplacement[] => {
  if (!Array.isArray(input)) return [];

  return input
    .filter(replacement => replacement && typeof replacement === 'object')
    .map(replacement => {
      const payload = replacement as Record<string, unknown>;
      if (!payload.currentMemberId || !payload.replacementMemberId || !payload.teamId) return null;

      const current = locateMemberContext(String(payload.currentMemberId), projects, poolMembers);
      const replacementContext = locateMemberContext(String(payload.replacementMemberId), projects, poolMembers);

      return {
        currentMemberId: String(payload.currentMemberId),
        replacementMemberId: String(payload.replacementMemberId),
        teamId: String(payload.teamId),
        currentMemberName: current.member?.name,
        replacementMemberName: replacementContext.member?.name,
        reasoning: payload.reasoning ? trimText(payload.reasoning) : undefined,
        urgency: payload.urgency ? String(payload.urgency) : undefined,
      } as AIReplacement;
    })
    .filter((entry): entry is AIReplacement => Boolean(entry));
};

const buildSummary = (moves: AIAllocationMove[], timeline?: TimelineInsights): string => {
  const base = moves.length ? `Proposed ${moves.length} allocation${moves.length === 1 ? '' : 's'}` : 'No reallocations required';

  if (!timeline) return `OK: ${base}`;

  if (timeline.atRiskProjects?.length) {
    return `WARNING: ${base} - ${timeline.atRiskProjects.length} project${timeline.atRiskProjects.length === 1 ? '' : 's'} at risk`;
  }

  if (timeline.onTrackProjects?.length) {
    return `OK: ${base} - ${timeline.onTrackProjects.length} project${timeline.onTrackProjects.length === 1 ? '' : 's'} on track`;
  }

  return `OK: ${base}`;
};

export const aiAllocationService = {
  async generateOptimizationPlan(projects: Project[], poolMembers: TeamMember[]): Promise<AIAllocationResult> {
    if (!projects.length) {
      return {
        moves: [],
        replacements: [],
        risks: ['No projects available for optimization.'],
        summary: 'No allocation plan generated because there are no active projects.',
        metadata: {
          generatedAt: new Date().toISOString(),
          projectCount: 0,
          poolSampleSize: poolMembers.length,
        },
      };
    }

    chatService.clearHistory();

    const { promptPool, totalAvailable } = buildPoolPromptContext(projects, poolMembers);
    const projectsContext = buildProjectsPromptContext(projects);

    const userMessage = `Available Members (${totalAvailable}):\n${JSON.stringify(promptPool)}\n\nProjects (${projectsContext.length}):\n${JSON.stringify(projectsContext)}\n\nHighlight schedule risks, call out critical role gaps, and recommend the minimal set of moves needed to protect timelines. Respond with valid JSON only.`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userMessage}`;
    let attempts = 0;
    const maxAttempts = 2;
    let lastResponseText = '';
    let lastError: unknown;

    while (attempts < maxAttempts) {
      attempts++;
      if (attempts > 1) {
        console.log(`[AI Allocation] Retrying attempt ${attempts}...`);
        chatService.clearHistory();
      }

      try {
        const responseText = await chatService.sendMessage(fullPrompt);
        lastResponseText = responseText;

        if (!responseText || !responseText.trim()) {
          throw new Error('Empty response from AI');
        }

        let parsed: any;
        try {
          parsed = parseModelJson(responseText);
        } catch (parseError) {
          console.warn(`[AI Allocation] Attempt ${attempts} JSON parse failed.`);
          if (attempts === maxAttempts) throw parseError;
          continue;
        }

        const moves = normalizeMoves(parsed.moves, projects, poolMembers);
        const replacements = normalizeReplacements(parsed.replacements, projects, poolMembers);
        const risks = normalizeRisks(parsed.risks);
        const timeline = buildTimelineInsights(parsed.timeline, projects, poolMembers);
        const summary = parsed.summary && typeof parsed.summary === 'string' ? parsed.summary : buildSummary(moves, timeline);

        if (!moves.length && !replacements.length && !risks.length) {
          risks.push('AI response did not contain actionable items. Try running the optimization again.');
        }

        return {
          moves,
          replacements,
          risks,
          timeline,
          summary,
          rawResponse: responseText,
          metadata: {
            generatedAt: new Date().toISOString(),
            projectCount: projects.length,
            poolSampleSize: promptPool.length,
          },
        };
      } catch (error) {
        lastError = error;
        console.error(`[AI Allocation] Attempt ${attempts} failed:`, error);
        if (attempts === maxAttempts) break;
      }
    }

    // Fallback error response
    let message = 'AI allocation failed.';
    if (lastError instanceof Error) {
      if (lastError.message.includes('Ollama')) {
        message = 'Cannot connect to Ollama. Ensure `ollama serve` is running and the phi3 model is installed (`ollama pull phi3`).';
      } else if (lastError.message.includes('JSON')) {
        message = 'AI response was not valid JSON after retries. Adjust the prompt or retry.';
      } else {
        message = lastError.message;
      }
    }

    return {
      moves: [],
      replacements: [],
      risks: [message],
      summary: 'AI allocation failed. Review the risk message and retry when ready.',
      rawResponse: lastResponseText,
      metadata: {
        generatedAt: new Date().toISOString(),
        projectCount: projects.length,
        poolSampleSize: poolMembers.length,
      },
    };
  },
};

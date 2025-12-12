import { Task, TeamMember, AIMatch, Project } from '@/types/allocation';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize SDK
// Use gemini-1.5-flash as it is the standard stable model for free tier
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

export async function getAITaskAssignment(
  task: Task,
  availableMembers: TeamMember[]
): Promise<AIMatch[]> {
  if (!model) {
    console.warn('Gemini API key not configured, using fallback matching');
    return getFallbackMatches(task, availableMembers);
  }

  try {
    const prompt = `You are an AI task assignment system. Analyze the following task and team members to suggest the best matches.

Task:
- Title: ${task.title}
- Description: ${task.description}
- Priority: ${task.priority}
- Estimated Hours: ${task.estimatedHours}
- Required Skills: ${task.requiredSkills.join(', ')}
- Deadline: ${task.deadline.toISOString()}

Available Team Members:
${availableMembers.map((member, idx) => `
${idx + 1}. ${member.name}
   - Skills: ${member.skills.join(', ')}
   - Current Workload: ${member.currentWorkload}h / ${member.maxCapacity}h
   - Availability: ${member.availability}
   - Velocity: ${member.velocity} tasks/week
`).join('\n')}

Provide the top 3 best matches with:
1. Member ID
2. Confidence score (0-1)
3. Brief reasoning
4. Any potential conflicts

Respond in JSON format:
{
  "matches": [
    {
      "memberId": "string",
      "confidenceScore": number,
      "reasoning": "string",
      "conflicts": ["string"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    if (!aiResponse) throw new Error('Invalid AI response');

    // Parse JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.matches || [];
  } catch (error) {
    console.error('AI matching error:', error);
    return getFallbackMatches(task, availableMembers);
  }
}

// Fallback matching algorithm
function getFallbackMatches(task: Task, members: TeamMember[]): AIMatch[] {
  const scored = members.map((member) => {
    // Calculate skill match
    const matchingSkills = task.requiredSkills.filter((skill) =>
      member.skills.includes(skill)
    );
    const skillScore = matchingSkills.length / task.requiredSkills.length;

    // Calculate availability score
    const utilizationPercentage = member.currentWorkload / member.maxCapacity;
    const availabilityScore = Math.max(0, 1 - utilizationPercentage);

    // Calculate capacity score
    const hasCapacity = member.currentWorkload + task.estimatedHours <= member.maxCapacity;
    const capacityScore = hasCapacity ? 1 : 0.3;

    // Combined score
    const confidenceScore = (skillScore * 0.5 + availabilityScore * 0.3 + capacityScore * 0.2);

    // Identify conflicts
    const conflicts: string[] = [];
    if (!hasCapacity) conflicts.push('Would exceed capacity');
    if (member.availability === 'overloaded') conflicts.push('Currently overloaded');
    if (skillScore < 0.5) conflicts.push('Missing some required skills');

    return {
      memberId: member.id,
      confidenceScore,
      reasoning: `Skill match: ${Math.round(skillScore * 100)}%, Availability: ${member.availability}, Workload: ${member.currentWorkload}h/${member.maxCapacity}h`,
      conflicts,
    };
  });

  return scored.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 3);
}

export async function explainAssignment(
  task: Task,
  member: TeamMember,
  matchScore: number
): Promise<string> {
  if (!model) {
    return `${member.name} was assigned to "${task.title}" with a ${Math.round(matchScore * 100)}% match score.`;
  }

  try {
    const prompt = `Explain in 1-2 sentences why ${member.name} is a good match for the task "${task.title}". 
    
Task requires: ${task.requiredSkills.join(', ')}
Member has: ${member.skills.join(', ')}
Match score: ${Math.round(matchScore * 100)}%
Current workload: ${member.currentWorkload}h / ${member.maxCapacity}h`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || 'Assignment completed successfully.';
  } catch (error) {
    console.error('AI explanation error:', error);
    return `${member.name} was assigned to "${task.title}" with a ${Math.round(matchScore * 100)}% match score.`;
  }
}

export type AIAction =
  | { type: 'create_project'; data: { name: string; requirements: { role: string; count: number }[] } }
  | { type: 'add_member'; data: { name: string; role: string; skills: string[]; teamName?: string; projectName?: string } }
  | { type: 'assign_member'; data: { memberName: string; projectName: string; teamName?: string } }
  | { type: 'unknown'; message: string };

export async function parseNaturalLanguageAction(
  input: string,
  context: { projects: Project[]; members: TeamMember[] }
): Promise<AIAction> {
  if (!model) {
    return { type: 'unknown', message: 'AI not configured (Missing Key)' };
  }

  const projectNames = context.projects.map(p => p.name).join(', ');
  const memberNames = context.members.map(m => m.name).join(', ');
  const validRoles = ['Senior Frontend Engineer', 'Backend Engineer', 'Product Manager', 'UI Designer', 'DevOps Engineer'].join(', ');

  const prompt = `You are an AI assistant for a Resource Allocation system. 
  Parse the user's natural language input into a structured JSON action.
  
  Context:
  - Existing Projects: ${projectNames}
  - Existing Members: ${memberNames}
  - Valid Roles: ${validRoles}

  User Input: "${input}"

  Return ONLY JSON.
  
  Schemas:
  1. Create Project: { "type": "create_project", "data": { "name": "Project Name", "requirements": [{ "role": "Role Name", "count": 1 }] } }
  2. Add Member to Pool/Team: { "type": "add_member", "data": { "name": "Member Name", "role": "Role Name", "skills": ["Skill1", "Skill2"], "projectName": "Optional Target Project", "teamName": "Optional Target Team" } }
  3. Assign/Move Member: { "type": "assign_member", "data": { "memberName": "Existing Member Name", "projectName": "Target Project", "teamName": "Target Team" } }
  
  If unclear, return { "type": "unknown", "message": "Clarification needed..." }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { type: 'unknown', message: 'Failed to parse AI response' };

    return JSON.parse(jsonMatch[0]) as AIAction;
  } catch (error) {
    console.error('AI Parse Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { type: 'unknown', message: `AI Error: ${errorMessage}` };
  }
}

export async function generateProjectReportSummary(project: Project): Promise<string> {
  if (!model) return `Report for ${project.name} generated successfully.`;

  const totalMembers = project.teams.reduce((acc, t) => acc + t.members.length, 0);
  const roles = project.teams.flatMap(t => t.members.map(m => m.role));
  const roleCounts = roles.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {} as Record<string, number>);

  const prompt = `Generate a professional executive summary (max 100 words) for a project report.
    Project: ${project.name}
    Total Members: ${totalMembers}
    Composition: ${JSON.stringify(roleCounts)}
    Status: Active
    
    Highlight the team composition and readiness.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    return 'Summary not available.';
  }
}

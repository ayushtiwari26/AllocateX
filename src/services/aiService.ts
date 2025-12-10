import { Task, TeamMember, AIMatch } from '@/types/allocation';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function getAITaskAssignment(
  task: Task,
  availableMembers: TeamMember[]
): Promise<AIMatch[]> {
  if (!GEMINI_API_KEY) {
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

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('Invalid AI response');
    }

    // Parse JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.matches || [];
  } catch (error) {
    console.error('AI matching error:', error);
    return getFallbackMatches(task, availableMembers);
  }
}

// Fallback matching algorithm when AI is unavailable
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
    if (!hasCapacity) {
      conflicts.push('Would exceed capacity');
    }
    if (member.availability === 'overloaded') {
      conflicts.push('Currently overloaded');
    }
    if (skillScore < 0.5) {
      conflicts.push('Missing some required skills');
    }

    return {
      memberId: member.id,
      confidenceScore,
      reasoning: `Skill match: ${Math.round(skillScore * 100)}%, Availability: ${member.availability}, Workload: ${member.currentWorkload}h/${member.maxCapacity}h`,
      conflicts,
    };
  });

  // Sort by confidence score and return top 3
  return scored
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 3);
}

export async function explainAssignment(
  task: Task,
  member: TeamMember,
  matchScore: number
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `${member.name} was assigned to "${task.title}" with a ${Math.round(matchScore * 100)}% match score based on skills and availability.`;
  }

  try {
    const prompt = `Explain in 1-2 sentences why ${member.name} is a good match for the task "${task.title}". 
    
Task requires: ${task.requiredSkills.join(', ')}
Member has: ${member.skills.join(', ')}
Match score: ${Math.round(matchScore * 100)}%
Current workload: ${member.currentWorkload}h / ${member.maxCapacity}h`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Assignment completed successfully.';
  } catch (error) {
    console.error('AI explanation error:', error);
    return `${member.name} was assigned to "${task.title}" with a ${Math.round(matchScore * 100)}% match score.`;
  }
}

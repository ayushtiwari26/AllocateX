import type { EmployeeProfile } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Code, Database, Cloud, TestTube, Palette, Smartphone, Brain, Award, TrendingUp } from 'lucide-react';

interface SkillsExperienceProps {
    profile: EmployeeProfile;
    isEditing: boolean;
    onUpdate: (profile: EmployeeProfile) => void;
}

const categoryIcons: Record<string, any> = {
    'Frontend': Code,
    'Backend': Database,
    'Database': Database,
    'DevOps': Cloud,
    'Testing': TestTube,
    'Design': Palette,
    'Mobile': Smartphone,
    'ML/AI': Brain,
    'Other': Code
};

const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const proficiencyColors = {
    'Beginner': 'bg-gray-200 text-gray-700',
    'Intermediate': 'bg-blue-100 text-blue-700',
    'Advanced': 'bg-indigo-100 text-indigo-700',
    'Expert': 'bg-purple-100 text-purple-700'
};

export default function SkillsExperience({ profile, isEditing, onUpdate }: SkillsExperienceProps) {
    // Group skills by category
    const skillsByCategory = profile.skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
    }, {} as Record<string, typeof profile.skills>);

    const getProficiencyPercentage = (level: string) => {
        const index = proficiencyLevels.indexOf(level);
        return ((index + 1) / proficiencyLevels.length) * 100;
    };

    return (
        <div className="space-y-6">
            {/* Skills Matrix */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Skills Matrix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {Object.entries(skillsByCategory).map(([category, skills]) => {
                        const Icon = categoryIcons[category] || Code;
                        return (
                            <div key={category} className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Icon className="w-4 h-4 text-indigo-600" />
                                    {category}
                                </div>
                                <div className="grid gap-3">
                                    {skills.map((skill, idx) => (
                                        <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">{skill.name}</span>
                                                <Badge className={proficiencyColors[skill.proficiency]}>
                                                    {skill.proficiency}
                                                </Badge>
                                            </div>
                                            <Progress value={getProficiencyPercentage(skill.proficiency)} className="h-2" />
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>{skill.yearsOfExperience} years exp.</span>
                                                {skill.lastUsed && (
                                                    <span>Last used: {new Date(skill.lastUsed).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Experience Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Experience Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                        <p className="text-3xl font-bold text-indigo-900">{profile.yearsOfExperience}</p>
                        <p className="text-sm text-indigo-700">Years of Professional Experience</p>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">Past Projects</h4>
                        {profile.pastProjects.map((project, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 p-4 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h5 className="font-semibold text-gray-900">{project.name}</h5>
                                        <p className="text-sm text-gray-600">{project.role} • {project.duration}</p>
                                    </div>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {project.technologies.map((tech, techIdx) => (
                                        <Badge key={techIdx} variant="outline" className="text-xs">
                                            {tech}
                                        </Badge>
                                    ))}
                                </div>
                                {project.achievements && project.achievements.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Key Achievements:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {project.achievements.map((achievement, achIdx) => (
                                                <li key={achIdx} className="text-xs text-gray-600">{achievement}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                        {profile.pastProjects.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No past projects recorded</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-600" />
                            Certifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {profile.certifications.map((cert, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                                    <Award className="w-5 h-5 text-indigo-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900">{cert.name}</h5>
                                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                            <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                                            {cert.expiryDate && (
                                                <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                                            )}
                                            {cert.credentialId && (
                                                <span className="font-mono">ID: {cert.credentialId}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

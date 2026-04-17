/**
 * GitLab Integration Service
 * --------------------------
 * Lists projects from a GitLab instance.
 *
 * When GITLAB_BASE_URL + GITLAB_TOKEN are configured, uses the REST API:
 *   GET {base}/api/v4/projects?membership=true&per_page=100
 *
 * Otherwise falls back to a small demo list so the UI stays functional.
 */

import axios from 'axios';

export interface GitlabProject {
    id: number;
    name: string;
    name_with_namespace: string;
    path_with_namespace: string;
    description: string | null;
    web_url: string;
    default_branch: string | null;
    visibility: string;
    last_activity_at: string;
    star_count?: number;
    forks_count?: number;
    open_issues_count?: number;
    topics?: string[];
    avatar_url?: string | null;
    namespace?: { name: string; kind: string; full_path: string };
}

const GITLAB_BASE = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_GROUP = process.env.GITLAB_GROUP; // optional: scope to a group

const FALLBACK_PROJECTS: GitlabProject[] = [
    {
        id: 101, name: 'gemba-connect-web', name_with_namespace: 'gembaconnect / gemba-connect-web',
        path_with_namespace: 'gembaconnect/gemba-connect-web', description: 'Customer-facing web application',
        web_url: 'https://gitlab.com/gembaconnect/gemba-connect-web', default_branch: 'main',
        visibility: 'private', last_activity_at: new Date().toISOString(),
        star_count: 12, forks_count: 3, open_issues_count: 24, topics: ['react', 'typescript'],
        avatar_url: null, namespace: { name: 'gembaconnect', kind: 'group', full_path: 'gembaconnect' },
    },
    {
        id: 102, name: 'gemba-connect-api', name_with_namespace: 'gembaconnect / gemba-connect-api',
        path_with_namespace: 'gembaconnect/gemba-connect-api', description: 'Core backend API',
        web_url: 'https://gitlab.com/gembaconnect/gemba-connect-api', default_branch: 'main',
        visibility: 'private', last_activity_at: new Date().toISOString(),
        star_count: 8, forks_count: 2, open_issues_count: 18, topics: ['nodejs', 'nestjs'],
        avatar_url: null, namespace: { name: 'gembaconnect', kind: 'group', full_path: 'gembaconnect' },
    },
    {
        id: 103, name: 'gemba-mobile', name_with_namespace: 'gembaconnect / gemba-mobile',
        path_with_namespace: 'gembaconnect/gemba-mobile', description: 'Mobile app (iOS + Android)',
        web_url: 'https://gitlab.com/gembaconnect/gemba-mobile', default_branch: 'main',
        visibility: 'private', last_activity_at: new Date().toISOString(),
        star_count: 5, forks_count: 1, open_issues_count: 9, topics: ['react-native'],
        avatar_url: null, namespace: { name: 'gembaconnect', kind: 'group', full_path: 'gembaconnect' },
    },
    {
        id: 104, name: 'allocatex', name_with_namespace: 'gembaconnect / allocatex',
        path_with_namespace: 'gembaconnect/allocatex', description: 'Resource allocation + HRMS platform',
        web_url: 'https://gitlab.com/gembaconnect/allocatex', default_branch: 'main',
        visibility: 'private', last_activity_at: new Date().toISOString(),
        star_count: 4, forks_count: 0, open_issues_count: 7, topics: ['react', 'express', 'postgres'],
        avatar_url: null, namespace: { name: 'gembaconnect', kind: 'group', full_path: 'gembaconnect' },
    },
    {
        id: 105, name: 'data-pipeline', name_with_namespace: 'gembaconnect / data-pipeline',
        path_with_namespace: 'gembaconnect/data-pipeline', description: 'ETL + analytics',
        web_url: 'https://gitlab.com/gembaconnect/data-pipeline', default_branch: 'main',
        visibility: 'private', last_activity_at: new Date().toISOString(),
        star_count: 2, forks_count: 0, open_issues_count: 3, topics: ['python', 'airflow'],
        avatar_url: null, namespace: { name: 'gembaconnect', kind: 'group', full_path: 'gembaconnect' },
    },
];

export const gitlabService = {
    isLiveConfigured(): boolean {
        return Boolean(GITLAB_TOKEN);
    },

    async listProjects(params?: { search?: string; perPage?: number }): Promise<{ projects: GitlabProject[]; source: 'live' | 'fallback' }> {
        if (!gitlabService.isLiveConfigured()) {
            const q = params?.search?.toLowerCase();
            const filtered = q
                ? FALLBACK_PROJECTS.filter(p => p.name.toLowerCase().includes(q) || p.path_with_namespace.toLowerCase().includes(q))
                : FALLBACK_PROJECTS;
            return { projects: filtered, source: 'fallback' };
        }

        const url = GITLAB_GROUP
            ? `${GITLAB_BASE}/api/v4/groups/${encodeURIComponent(GITLAB_GROUP)}/projects`
            : `${GITLAB_BASE}/api/v4/projects`;
        const { data } = await axios.get<GitlabProject[]>(url, {
            headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN! },
            params: {
                membership: GITLAB_GROUP ? undefined : true,
                per_page: params?.perPage ?? 100,
                search: params?.search,
                order_by: 'last_activity_at',
                include_subgroups: GITLAB_GROUP ? true : undefined,
            },
            timeout: 20000,
        });
        return { projects: data, source: 'live' };
    },
};

export default gitlabService;

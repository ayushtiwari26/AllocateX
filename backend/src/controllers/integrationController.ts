import { Request, Response } from 'express';
import kekaService from '../services/kekaService';
import gitlabService from '../services/gitlabService';
import { seedFromKeka } from '../seeders/keka-seed';

export const getKekaEmployees = async (_req: Request, res: Response) => {
    try {
        const employees = await kekaService.fetchAllEmployees();
        res.json({
            source: kekaService.isLiveConfigured() ? 'live' : 'snapshot',
            count: employees.length,
            employees,
        });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch Keka employees', details: err.message });
    }
};

export const syncKekaEmployees = async (req: Request, res: Response) => {
    try {
        const wipe = req.body?.wipe !== false; // default true
        const result = await seedFromKeka({ wipeExisting: wipe });
        res.json({ ok: true, ...result });
    } catch (err: any) {
        console.error('Keka sync failed:', err);
        res.status(500).json({ error: 'Keka sync failed', details: err.message });
    }
};

export const getGitlabProjects = async (req: Request, res: Response) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const { projects, source } = await gitlabService.listProjects({ search });
        res.json({ source, count: projects.length, projects });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch GitLab projects', details: err.message });
    }
};

export const integrationStatus = async (_req: Request, res: Response) => {
    res.json({
        keka: { live: kekaService.isLiveConfigured() },
        gitlab: { live: gitlabService.isLiveConfigured() },
    });
};

import { Router } from 'express';
import {
    getKekaEmployees,
    syncKekaEmployees,
    getGitlabProjects,
    integrationStatus,
} from '../controllers/integrationController';

const router = Router();

router.get('/status', integrationStatus);

// Keka
router.get('/keka/employees', getKekaEmployees);
router.post('/keka/sync', syncKekaEmployees);

// GitLab
router.get('/gitlab/projects', getGitlabProjects);

export default router;

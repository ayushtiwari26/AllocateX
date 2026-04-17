import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTeams,
  addTeamToProject,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getRoleCandidates,
  getGitLabProjectDevelopers,
  importProjectTeamMembers,
  importProjectTeamFromGitLab,
} from '../controllers/projectController';
import { verifyFirebaseToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyFirebaseToken);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', requireRole('admin', 'manager'), createProject);
router.put('/:id', requireRole('admin', 'manager'), updateProject);
router.delete('/:id', requireRole('admin'), deleteProject);

router.get('/:id/teams', getProjectTeams);
router.post('/:id/teams', requireRole('admin', 'manager'), addTeamToProject);
router.put('/:id/teams/:teamId', requireRole('admin', 'manager'), updateTeam);
router.delete('/:id/teams/:teamId', requireRole('admin'), deleteTeam);

router.post('/:id/teams/:teamId/members', requireRole('admin', 'manager', 'team_lead'), addTeamMember);
router.patch('/:id/teams/:teamId/members/:memberId', requireRole('admin', 'manager', 'team_lead'), updateTeamMember);
router.delete('/:id/teams/:teamId/members/:memberId', requireRole('admin', 'manager', 'team_lead'), removeTeamMember);

router.get('/:id/roles/:role/candidates', requireRole('admin', 'manager', 'team_lead'), getRoleCandidates);

router.post('/:id/gitlab/developers', requireRole('admin', 'manager'), getGitLabProjectDevelopers);
router.post('/:id/teams/import-members', requireRole('admin', 'manager'), importProjectTeamMembers);
router.post('/:id/teams/import-gitlab', requireRole('admin', 'manager'), importProjectTeamFromGitLab);

export default router;

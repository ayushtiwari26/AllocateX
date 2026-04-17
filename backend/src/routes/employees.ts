import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSkills,
  addEmployeeSkill,
  updateEmployeeSkill,
  deleteEmployeeSkill,
} from '../controllers/employeeController';
import { verifyFirebaseToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyFirebaseToken);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, partially-available, unavailable]
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get('/', getAllEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 */
router.get('/:id', getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - employeeCode
 *               - firstName
 *               - lastName
 *               - email
 *               - dateOfJoining
 *               - designation
 *               - department
 *             properties:
 *               userId:
 *                 type: string
 *               employeeCode:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post('/', requireRole('admin', 'manager'), createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 */
router.put('/:id', requireRole('admin', 'manager'), updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 */
router.delete('/:id', requireRole('admin'), deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/skills:
 *   get:
 *     summary: Get employee skills
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of employee skills
 */
router.get('/:id/skills', getEmployeeSkills);

/**
 * @swagger
 * /api/employees/{id}/skills:
 *   post:
 *     summary: Add employee skill
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Skill added successfully
 */
router.post('/:id/skills', addEmployeeSkill);

router.put('/:id/skills/:skillId', updateEmployeeSkill);
router.delete('/:id/skills/:skillId', deleteEmployeeSkill);

export default router;

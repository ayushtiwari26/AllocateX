import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AllocateX API Documentation',
      version: '1.0.0',
      description: 'IT Resource Allocation System + Mini HRMS Backend API',
      contact: {
        name: 'API Support',
        email: 'support@allocatex.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.allocatex.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Firebase JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string', nullable: true },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'team_lead', 'employee'],
            },
            isActive: { type: 'boolean' },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            employeeCode: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            dateOfJoining: { type: 'string', format: 'date' },
            designation: { type: 'string' },
            department: { type: 'string' },
            availability: {
              type: 'string',
              enum: ['available', 'partially-available', 'unavailable'],
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['active', 'on-hold', 'completed', 'cancelled'],
            },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date', nullable: true },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employeeId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            clockInTime: { type: 'string', format: 'date-time', nullable: true },
            clockOutTime: { type: 'string', format: 'date-time', nullable: true },
            status: {
              type: 'string',
              enum: ['present', 'absent', 'half-day', 'leave', 'wfh', 'on-duty'],
            },
            totalHours: { type: 'number', nullable: true },
          },
        },
        LeaveRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employeeId: { type: 'string', format: 'uuid' },
            leaveType: {
              type: 'string',
              enum: ['casual', 'sick', 'earned', 'wfh', 'on-duty', 'unpaid'],
            },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            reason: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'cancelled'],
            },
            totalDays: { type: 'integer' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

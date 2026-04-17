# AllocateX Backend API

Complete backend system for IT Resource Allocation + Mini HRMS platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize
- **Authentication**: Firebase Admin SDK
- **Geofencing**: Haversine distance calculation

## Features

### 1. Authentication & Authorization
- Firebase ID token verification
- Role-based access control (Admin, Manager, Team Lead, Employee)
- JWT session management

### 2. Employee Management
- Complete CRUD operations
- Skills management
- Workload tracking
- Hierarchical reporting structure

### 3. HRMS - Attendance
- Clock-in/clock-out with GPS geofencing
- Automatic status detection (Present/WFH/On-duty)
- Monthly attendance summaries
- Real-time location verification

### 4. HRMS - Leave Management
- Leave request workflow
- Multi-level approval system
- Leave balance tracking
- Calendar integration with holidays
- Auto-deduction on approval

### 5. HRMS - Finance
- Salary information (Monthly/Hourly)
- CTC breakdown (HRA, DA, Allowances)
- Bank account management with verification
- PF/ESI/PT details
- PAN & Aadhaar integration

### 6. Project & Team Management
- Project CRUD operations
- Team hierarchy
- Member assignments
- Workload tracking

### 7. AI Allocation Engine
- Available resource pool
- Smart allocation suggestions
- Skill-based matching
- Workload balancing

## Setup Instructions

### 1. Prerequisites

```bash
# Install PostgreSQL
brew install postgresql@14  # macOS
# or
sudo apt install postgresql-14  # Ubuntu

# Start PostgreSQL
brew services start postgresql@14
```

### 2. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
```

Required environment variables:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=allocatex_db
DB_USER=postgres
DB_PASSWORD=your_password

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

OFFICE_LATITUDE=28.6139
OFFICE_LONGITUDE=77.2090
GEOFENCE_RADIUS_METERS=100
```

### 3. Database Setup

```bash
# Create database
createdb allocatex_db

# Run migrations
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000`

### 6. Build for Production

```bash
npm run build
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Endpoints

#### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee (Admin/Manager)
- `PUT /api/employees/:id` - Update employee (Admin/Manager)
- `DELETE /api/employees/:id` - Delete employee (Admin)
- `GET /api/employees/:id/skills` - Get employee skills
- `POST /api/employees/:id/skills` - Add skill
- `PUT /api/employees/:id/skills/:skillId` - Update skill
- `DELETE /api/employees/:id/skills/:skillId` - Delete skill

#### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance` - List attendance (Admin/Manager)
- `GET /api/attendance/employee/:employeeId` - Employee attendance
- `GET /api/attendance/employee/:employeeId/summary` - Attendance summary
- `PUT /api/attendance/:id` - Update attendance (Admin/Manager)

#### Leave
- `POST /api/leave/request` - Create leave request
- `GET /api/leave/requests` - List leave requests
- `GET /api/leave/requests/:id` - Get leave request
- `PUT /api/leave/requests/:id/status` - Approve/Reject (Manager/Admin)
- `PUT /api/leave/requests/:id/cancel` - Cancel leave request
- `GET /api/leave/balance/:employeeId` - Get leave balance
- `GET /api/leave/calendar/:employeeId` - Leave calendar

#### Finance
- `GET /api/finance/:employeeId` - Get finance details
- `PUT /api/finance/:employeeId` - Update finance (Admin/Manager)
- `GET /api/finance/:employeeId/bank` - Get bank accounts
- `POST /api/finance/:employeeId/bank` - Add bank account
- `PUT /api/finance/:employeeId/bank/:bankId` - Update bank account
- `DELETE /api/finance/:employeeId/bank/:bankId` - Delete bank account
- `POST /api/finance/:employeeId/bank/:bankId/verify` - Verify bank (Admin)

#### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `POST /api/projects` - Create project (Admin/Manager)
- `PUT /api/projects/:id` - Update project (Admin/Manager)
- `DELETE /api/projects/:id` - Delete project (Admin)
- `GET /api/projects/:id/teams` - Get project teams
- `POST /api/projects/:id/teams` - Add team (Admin/Manager)
- `POST /api/projects/:id/teams/:teamId/members` - Add team member
- `DELETE /api/projects/:id/teams/:teamId/members/:memberId` - Remove member

#### Allocation
- `POST /api/allocation/generate` - Generate AI allocation plan
- `GET /api/allocation/available` - Get available employees
- `GET /api/allocation/current` - Get current allocations
- `POST /api/allocation/apply` - Apply allocation

## Database Schema

### Core Tables
- `users` - Firebase user accounts
- `employees` - Employee profiles
- `employee_skills` - Skills & proficiency
- `projects` - Project information
- `teams` - Project teams
- `team_members` - Team member assignments

### HRMS Tables
- `attendance` - Daily attendance with GPS
- `leave_requests` - Leave applications
- `leave_balances` - Leave balances per year
- `holidays` - Holiday calendar
- `employee_finance` - Salary & finance info
- `bank_details` - Bank account information

## Geofencing

The system uses Haversine formula to calculate distance between GPS coordinates:

```typescript
// Check if employee is within office radius
const withinGeofence = isWithinGeofence({
  latitude: 28.6139,
  longitude: 77.2090
});
```

Configure geofencing in `.env`:
```
OFFICE_LATITUDE=28.6139
OFFICE_LONGITUDE=77.2090
GEOFENCE_RADIUS_METERS=100
```

## Security

- All routes protected with Firebase authentication
- Role-based authorization middleware
- Input validation on all endpoints
- SQL injection prevention via Sequelize
- Password hashing for sensitive data
- CORS configuration for allowed origins

## Error Handling

Standard error response format:
```json
{
  "error": "Error message",
  "details": "Additional context (dev only)"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Running Tests
```bash
npm test
```

### Database Commands
```bash
# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:migrate:undo

# Reset database
npm run db:reset
```

### Code Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Auth, error handling
├── models/          # Sequelize models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── migrations/      # Database migrations
├── seeders/         # Seed data
└── index.ts         # App entry point
```

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper PostgreSQL credentials
- [ ] Set up Firebase production project
- [ ] Configure CORS for production domains
- [ ] Enable SSL/TLS
- [ ] Set up database backups
- [ ] Configure logging service
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Use migrations instead of `sync()`

### Docker Deployment
```bash
# Build image
docker build -t allocatex-backend .

# Run container
docker run -p 5000:5000 --env-file .env allocatex-backend
```

## Support

For issues or questions, contact the development team.

## License

ISC

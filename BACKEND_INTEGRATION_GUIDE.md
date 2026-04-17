# Backend-Frontend Integration Guide

## Overview

This guide explains how to connect the React frontend with the Express backend.

## ✅ Completed Setup

### Backend
- ✅ Express + TypeScript server running on port 5000
- ✅ PostgreSQL database connected (allocatex_db)
- ✅ All 13 models defined and synced
- ✅ Controllers and routes implemented
- ✅ Firebase authentication middleware ready
- ✅ Swagger documentation at http://localhost:5001/api-docs
- ✅ Demo data seeded (20 employees, 3 projects, attendance, leave, finance)

### Frontend
- ✅ React + TypeScript + Vite on port 5173
- ✅ API service layer created (`src/services/api.ts`)
- ✅ Axios configured with interceptors
- ✅ Authentication token handling
- ✅ Environment variables configured

## 🚀 Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

Server runs at: http://localhost:5001

### 2. Start Frontend

```bash
cd /Users/ayushtiwari/Desktop/workspace/AllocateX
npm run dev
```

Frontend runs at: http://localhost:5173

### 3. Configure Environment Variables

Update `.env.local` in root directory with your Firebase credentials:

```env
VITE_API_URL=http://localhost:5001/api
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📡 API Service Usage

### Authentication

The API service automatically handles authentication tokens:

```typescript
import { employeeApi } from '@/services/api';

// Token is automatically attached to requests
const employees = await employeeApi.getAll();
```

### Available APIs

#### Employee Management

```typescript
import { employeeApi } from '@/services/api';

// Get all employees
const employees = await employeeApi.getAll();

// Get specific employee
const employee = await employeeApi.getById(employeeId);

// Create employee
const newEmployee = await employeeApi.create({
  userId: userId,
  employeeCode: 'EMP021',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  designation: 'Software Engineer',
  department: 'Engineering',
  dateOfJoining: new Date().toISOString(),
});

// Update employee
await employeeApi.update(employeeId, {
  designation: 'Senior Software Engineer',
});

// Get employee skills
const skills = await employeeApi.getSkills(employeeId);
```

#### Project Management

```typescript
import { projectApi } from '@/services/api';

// Get all projects
const projects = await projectApi.getAll();

// Create project
const project = await projectApi.create({
  name: 'AllocateX v2.0',
  description: 'Next generation allocation system',
  status: 'active',
  priority: 'high',
  startDate: new Date().toISOString(),
  managerId: managerId,
});

// Get project teams
const teams = await projectApi.getTeams(projectId);
```

#### Attendance Management

```typescript
import { attendanceApi } from '@/services/api';

// Clock in
const attendance = await attendanceApi.clockIn({
  employeeId: employeeId,
  location: { lat: 12.9716, lon: 77.5946 },
});

// Clock out
await attendanceApi.clockOut(attendanceId, {
  location: { lat: 12.9716, lon: 77.5946 },
});

// Get attendance history
const history = await attendanceApi.getByEmployee(
  employeeId,
  '2024-01-01',
  '2024-01-31'
);
```

#### Leave Management

```typescript
import { leaveApi } from '@/services/api';

// Apply for leave
const leaveRequest = await leaveApi.create({
  employeeId: employeeId,
  leaveType: 'casual',
  startDate: '2024-02-01',
  endDate: '2024-02-03',
  reason: 'Personal work',
  totalDays: 3,
});

// Get pending leave requests (for managers)
const pending = await leaveApi.getPending();

// Approve leave
await leaveApi.approve(leaveId, 'Approved for personal reasons');

// Get leave balance
const balance = await leaveApi.getBalance(employeeId, 2024);
```

#### Finance Management

```typescript
import { financeApi } from '@/services/api';

// Get employee finance details
const finance = await financeApi.getByEmployee(employeeId);

// Get bank details
const bankDetails = await financeApi.getBankDetails(employeeId);
```

#### AI-Powered Allocation

```typescript
import { allocationApi, employeeApi } from '@/services/api';

// Get all employees
const employees = await employeeApi.getAll();

// Generate team allocation
const allocation = await allocationApi.generateAllocation({
  projectId: projectId,
  requirements: 'Need React developers with 3+ years experience',
  employees: employees,
  teamSize: 5,
});
```

## 🔄 Replacing Mock Services

### Step 1: Update Employee Service

Replace `src/services/employeeProfileService.ts`:

```typescript
import { employeeApi } from './api';

export const getEmployeeProfile = async (employeeId: string) => {
  return await employeeApi.getById(employeeId);
};

export const updateEmployeeProfile = async (
  employeeId: string,
  data: any
) => {
  return await employeeApi.update(employeeId, data);
};
```

### Step 2: Update Attendance Service

Replace mock attendance service:

```typescript
import { attendanceApi } from './api';

export const clockIn = async (employeeId: string) => {
  if ('geolocation' in navigator) {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    );
    
    return await attendanceApi.clockIn({
      employeeId,
      location: {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      },
    });
  }
  
  throw new Error('Geolocation not supported');
};
```

### Step 3: Update Leave Service

```typescript
import { leaveApi } from './api';

export const applyLeave = async (data: any) => {
  return await leaveApi.create(data);
};

export const getLeaveBalance = async (employeeId: string) => {
  return await leaveApi.getBalance(employeeId, new Date().getFullYear());
};
```

## 🔒 Authentication Flow

### Login

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const login = async (email: string, password: string) => {
  // Firebase handles authentication
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  
  // Token is automatically attached to API requests via interceptor
  const user = userCredential.user;
  
  // Fetch employee profile
  const employees = await employeeApi.getAll();
  const employee = employees.find(e => e.email === email);
  
  return { user, employee };
};
```

### Protected Routes

API interceptor automatically adds token:

```typescript
// In src/services/api.ts (already implemented)
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🧪 Testing the Integration

### 1. Test Employee API

Open browser console and run:

```javascript
import { employeeApi } from './services/api';

// Should return 20 employees from seeded data
employeeApi.getAll().then(console.log);
```

### 2. Test Attendance

```javascript
import { attendanceApi } from './services/api';

// Get attendance for Eleanor (EMP001)
attendanceApi.getByEmployee('employee-uuid-here').then(console.log);
```

### 3. Test Projects

```javascript
import { projectApi } from './services/api';

// Should return 3 projects
projectApi.getAll().then(console.log);
```

## 📊 Demo Data Available

The seeded database contains:

- **20 Employees**
  - 2 Co-founders (Eleanor Sterling, Rajiv Kapoor)
  - 3 Project Managers
  - 5 Team Leads
  - 10 Developers/Engineers

- **3 Projects**
  - Customer Portal Redesign
  - Mobile Banking App
  - Cloud Migration

- **3 Teams** with member allocations

- **Finance Data**
  - Salary ranges: ₹60,000 - ₹2,50,000
  - PF details, bank accounts

- **Attendance Records**
  - 80+ records across last 7 days
  - Mix of Present, WFH, Half-day statuses

- **Leave Management**
  - Leave balances for all employees
  - 2 sample leave requests

## 🐛 Debugging

### Check Backend Status

```bash
curl http://localhost:5001/api/employees
```

Should return JSON array of employees.

### Check Frontend API Calls

Open browser DevTools → Network tab, filter by "Fetch/XHR":

- Look for requests to `localhost:5000/api/*`
- Check status codes (200 = success)
- Inspect request/response payloads

### Common Issues

1. **CORS Error**
   - Backend already configured for `http://localhost:5173`
   - If frontend port changes, update backend CORS config

2. **401 Unauthorized**
   - User not logged in
   - Firebase token expired
   - Check `localStorage` for Firebase auth state

3. **500 Server Error**
   - Check backend logs
   - Verify database is running
   - Check `.env` configuration

## 🎯 Next Steps

1. **Replace Mock Services**
   - Update all components using mock data
   - Point to real API endpoints

2. **Add Error Handling**
   - Show user-friendly error messages
   - Add retry logic for failed requests

3. **Implement Loading States**
   - Show spinners during API calls
   - Disable buttons while processing

4. **Add Caching**
   - Use React Query or SWR
   - Cache frequently accessed data

5. **Real-time Updates**
   - Implement WebSocket for live attendance
   - Push notifications for leave approvals

## 📚 API Documentation

Full API documentation available at:
http://localhost:5001/api-docs

Interactive Swagger UI with:
- All endpoints listed
- Request/response schemas
- Try-it-out functionality
- Example payloads

## 🚢 Production Checklist

- [ ] Update `.env` with production API URL
- [ ] Enable HTTPS
- [ ] Set up proper Firebase production project
- [ ] Configure production database
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable rate limiting
- [ ] Add request validation
- [ ] Set up CI/CD pipeline

## 📞 Support

For integration issues:
1. Check backend logs: `backend/` directory
2. Check browser console for frontend errors
3. Test API directly with Swagger UI
4. Review this integration guide

---

**Status**: Backend seeded and ready. Frontend API service layer configured. Ready to integrate!

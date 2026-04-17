# Employee Profile Module - Implementation Guide

## 📋 Overview
Complete employee profile management system with skills tracking, project allocation, dependency comparison, and AI-powered impact analysis.

## 🏗️ Architecture

### Data Layer
- **Types**: `/src/types/employee.ts` ✅ Created
- **Service**: `/src/services/employeeProfileService.ts` ✅ Created
- **Storage**: LocalStorage (Development) → PostgreSQL (Production)

### UI Components
1. **Main Profile Page**: `/src/pages/dashboard/EmployeeProfile.tsx`
2. **Profile List**: `/src/pages/dashboard/EmployeeList.tsx` (already exists, needs enhancement)
3. **Sub-components**:
   - `/src/components/employee/ProfileOverview.tsx`
   - `/src/components/employee/SkillsExperience.tsx`
   - `/src/components/employee/AllocatedProjects.tsx`
   - `/src/components/employee/DependencyComparison.tsx`
   - `/src/components/employee/ActivityHistory.tsx`
   - `/src/components/employee/EditProfileDialog.tsx`
   - `/src/components/employee/ImpactAnalysisPanel.tsx`

## 📐 Database Schema (PostgreSQL)

```sql
-- Employees Table
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    organisation_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    join_date DATE NOT NULL,
    years_of_experience INTEGER,
    current_workload INTEGER DEFAULT 0,
    max_capacity INTEGER DEFAULT 40,
    velocity DECIMAL(5,2) DEFAULT 5.0,
    availability VARCHAR(20) DEFAULT 'available',
    team_id VARCHAR(50),
    manager_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organisation_id) REFERENCES organisations(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);

-- Skills Table
CREATE TABLE employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    proficiency VARCHAR(20) CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    years_of_experience DECIMAL(3,1),
    last_used DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Past Projects
CREATE TABLE employee_past_projects (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    duration VARCHAR(50),
    technologies TEXT[], -- Array of technologies
    description TEXT,
    achievements TEXT[],
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Certifications
CREATE TABLE employee_certifications (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Leaves
CREATE TABLE employee_leaves (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    leave_type VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Project Allocations
CREATE TABLE project_allocations (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    role_in_project VARCHAR(100),
    allocation_percentage INTEGER CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    hours_allocated INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Sprint Tasks
CREATE TABLE sprint_tasks (
    id VARCHAR(50) PRIMARY KEY,
    allocation_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo',
    priority VARCHAR(20),
    story_points INTEGER,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    assigned_date TIMESTAMP,
    due_date TIMESTAMP,
    completed_date TIMESTAMP,
    FOREIGN KEY (allocation_id) REFERENCES project_allocations(id) ON DELETE CASCADE
);

-- Activity Logs
CREATE TABLE employee_activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activity_type VARCHAR(50),
    description TEXT,
    metadata JSONB,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_employees_org ON employees(organisation_id);
CREATE INDEX idx_employees_team ON employees(team_id);
CREATE INDEX idx_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_allocations_employee ON project_allocations(employee_id);
CREATE INDEX idx_allocations_project ON project_allocations(project_id);
CREATE INDEX idx_tasks_allocation ON sprint_tasks(allocation_id);
CREATE INDEX idx_activity_employee ON employee_activity_logs(employee_id);
```

## 🔌 API Endpoints

### Employee CRUD
```
GET    /api/employees                    - List all employees (filtered by org)
GET    /api/employees/:id                - Get employee profile
POST   /api/employees                    - Create employee
PUT    /api/employees/:id                - Update employee
DELETE /api/employees/:id                - Delete employee
```

### Skills & Experience
```
GET    /api/employees/:id/skills         - Get employee skills
POST   /api/employees/:id/skills         - Add skill
PUT    /api/employees/:id/skills/:skillId - Update skill
DELETE /api/employees/:id/skills/:skillId - Remove skill
```

### Projects & Allocations
```
GET    /api/employees/:id/allocations    - Get allocated projects
POST   /api/employees/:id/allocations    - Assign to project
PUT    /api/employees/:id/allocations/:allocId - Update allocation
DELETE /api/employees/:id/allocations/:allocId - Remove from project
```

### Analysis & Comparisons
```
GET    /api/employees/:id/comparisons?with=emp1,emp2 - Compare with other employees
GET    /api/employees/:id/impact/:projectId - Project impact analysis
GET    /api/employees/:id/activity        - Activity logs
```

## 📊 Example JSON Responses

### Employee Profile Response
```json
{
  "id": "emp-123",
  "fullName": "Alice Johnson",
  "email": "alice@company.com",
  "phone": "+1-555-0100",
  "location": "San Francisco, CA",
  "avatar": "https://i.pravatar.cc/150?img=1",
  "role": "Developer",
  "department": "Engineering",
  "employeeId": "EMP-001",
  "joinDate": "2022-01-15",
  "skills": [
    {
      "name": "React",
      "category": "Frontend",
      "proficiency": "Expert",
      "yearsOfExperience": 4,
      "lastUsed": "2024-12-10"
    },
    {
      "name": "Node.js",
      "category": "Backend",
      "proficiency": "Advanced",
      "yearsOfExperience": 3
    }
  ],
  "yearsOfExperience": 5,
  "techStack": ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
  "strongAreas": ["Frontend Development", "API Design", "Performance Optimization"],
  "currentWorkload": 32,
  "maxCapacity": 40,
  "velocity": 8.5,
  "availability": "available",
  "allocatedProjects": [
    {
      "projectId": "proj-1",
      "projectName": "E-Commerce Platform",
      "roleInProject": "Frontend Lead",
      "allocationPercentage": 60,
      "startDate": "2024-11-01",
      "isActive": true,
      "hoursAllocated": 24,
      "currentSprintTasks": [
        {
          "id": "task-1",
          "title": "Implement checkout flow",
          "status": "in-progress",
          "priority": "high",
          "storyPoints": 8,
          "estimatedHours": 16
        }
      ]
    }
  ],
  "completedTasks": 45,
  "ongoingTasks": 3,
  "qualityScore": 92,
  "collaborationScore": 88,
  "organisationId": "org-1"
}
```

### Comparison Response
```json
{
  "employeeId": "emp-123",
  "comparedWith": ["emp-456", "emp-789"],
  "skillComparisons": [
    {
      "skill": "React",
      "myProficiency": "Expert",
      "comparisons": [
        {
          "employeeId": "emp-456",
          "employeeName": "Bob Smith",
          "proficiency": "Advanced",
          "isStronger": false
        }
      ]
    }
  ],
  "workloadComparison": {
    "myWorkload": 32,
    "myCapacity": 40,
    "myUtilization": 80,
    "comparisons": [
      {
        "employeeId": "emp-456",
        "employeeName": "Bob Smith",
        "workload": 38,
        "utilization": 95,
        "difference": 6
      }
    ]
  },
  "utilizationStatus": "optimal"
}
```

### Impact Analysis Response
```json
{
  "projectId": "proj-1",
  "projectName": "E-Commerce Platform",
  "currentRole": "Frontend Lead",
  "impactIfRemoved": {
    "timelineImpact": "2 weeks delay",
    "riskScore": 75,
    "criticalTasks": 2,
    "affectedSprints": 1,
    "skillGap": ["React", "TypeScript", "UI/UX Design"]
  },
  "suggestedReplacements": [
    {
      "employeeId": "emp-456",
      "employeeName": "Bob Smith",
      "matchScore": 85,
      "matchingSkills": ["React", "TypeScript"],
      "missingSkills": ["UI/UX Design"],
      "currentWorkload": 28,
      "availableCapacity": 12,
      "riskOfReplacement": "low",
      "reasoning": "85% skill match. 2/3 skills matched. 12h capacity available."
    }
  ]
}
```

## 🔗 Integration Points

### 1. Auto Allocation Engine
- Use employee skills, workload, velocity in AI allocation decisions
- Consider availability status when assigning tasks
- Factor in past project experience

### 2. Manual Allocation
- PM/CTO can see employee profiles before assignment
- Quick view of capacity and skills
- Drag-and-drop with profile preview

### 3. Organization Tree
- Click employee → View full profile
- Show utilization badges
- Display current projects

### 4. Sprint Planning
- View employee availability
- Check velocity for estimation
- Assign tasks based on skills

## 🎨 UI Design Principles
- Clean, minimal, professional
- Tabbed interface for different sections
- Edit mode with inline editing
- Responsive cards and charts
- Consistent with existing dashboard theme

## 🚀 Implementation Priority
1. ✅ Data types & schema
2. ✅ Service layer
3. ⏳ Profile overview component (Next)
4. ⏳ Skills & experience tab
5. ⏳ Allocated projects view
6. ⏳ Dependency comparison panel
7. ⏳ Impact analysis
8. ⏳ Activity history
9. ⏳ Edit functionality
10. ⏳ Integration with existing modules

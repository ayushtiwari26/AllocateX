# AllocateX - IT Resource Allocation System
## Complete Architecture Blueprint

### 1. System Overview

AllocateX is a professional, AI-powered IT resource allocation system that optimizes team composition, workload distribution, and project assignments across an organization.

**Tech Stack:**
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Shadcn UI
- **AI Engine**: Ollama (Local LLM - phi3/llama3)
- **State Management**: React Hooks + Custom State Management
- **Data Persistence**: LocalStorage (Current) / PostgreSQL (Production Ready)
- **Routing**: React Router v6
- **Drag & Drop**: @dnd-kit/core

---

### 2. Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│  Dashboard  │  Projects    │  Employees   │  Resource          │
│  Overview   │  Management  │  Directory   │  Allocation        │
└─────────────┴──────────────┴──────────────┴────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
├──────────────────────┬──────────────────────────────────────────┤
│  useProjectState()   │  State Management for Projects/Teams    │
│  AI Allocation Svc   │  AI-powered optimization engine          │
│  mockBackend         │  Data access layer (LocalStorage/API)   │
└──────────────────────┴──────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI REASONING ENGINE                        │
├─────────────────────────────────────────────────────────────────┤
│  Ollama Local Instance (phi3 model)                            │
│  • Analyzes current allocation state                           │
│  • Suggests optimal team compositions                          │
│  • Identifies workload imbalances                              │
│  • Detects timeline risks and bottlenecks                      │
│  • Recommends member replacements                              │
│  • Generates daily plans and explanations                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  LocalStorage Keys:                                             │
│  • allocx_projects    - Project & Team data                    │
│  • allocx_employees   - Employee/Member master data            │
│  • allocx_orgs       - Organization data                       │
│  • allocx_users      - User accounts                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Data Model & Hierarchy

```typescript
Organization (Multi-tenant)
  └── Projects (E-Commerce Platform, Analytics Dashboard, etc.)
      └── Teams (Frontend Squad, Backend Squad, etc.)
          └── Team Members (Developers, Leads, Managers)
              ├── Skills: ['React', 'Node.js', ...]
              ├── Workload: currentWorkload / maxCapacity
              ├── Velocity: Story points per sprint
              └── Availability: 'available' | 'busy' | 'overloaded'
```

**Core Entities:**

1. **Organization**
   - ID, Name, Logo, AdminId, Created Date
   
2. **Project**
   - ID, Name, Organization ID, Teams[], Requirements[]
   - Requirements: { role: string, count: number }
   
3. **Team**
   - ID, Name, Project ID, Members[]
   
4. **TeamMember / Employee**
   - ID, Name, Email, Role, Skills[], Avatar
   - currentWorkload, maxCapacity, velocity
   - availability, teamId, organisationId

---

### 4. Feature Implementation

#### 4.1 Auto Allocate Sprint (✅ Implemented)

**Location**: `src/components/ResourceAllocation.tsx` + `src/services/aiAllocationService.ts`

**Flow:**
1. User clicks "Auto Allocate Sprint" button (visible in Auto mode)
2. System sends current state (projects, teams, pool members) to AI
3. AI analyzes and returns optimization plan with:
   - Suggested moves (member → team)
   - Risk warnings
   - Summary explanation
4. User reviews plan in `OptimizationReviewDialog`
5. User applies or cancels changes

**Key Functions:**
- `handleAutoAllocate()`: Triggers AI analysis
- `aiAllocationService.generateOptimizationPlan()`: Calls Ollama
- `applyOptimization()`: Executes the moves

#### 4.2 Manual Assignment (✅ Implemented)

**Location**: `src/components/ResourceAllocation.tsx`

**Features:**
- Drag & drop members from Organization Pool to Teams
- Drag & drop between teams (list & graph view)
- Interactive Graph Mode for visual team management
- Edit member details inline
- Delete members from teams

#### 4.3 AI Explainability (✅ Implemented)

**Location**: `src/components/allocation/OptimizationReviewDialog.tsx`

**Displays:**
- Summary of optimization strategy
- Per-move reasoning ("Assign Alice to Frontend Squad because...")
- Risk warnings (skill gaps, overload concerns)
- Confidence indicators

#### 4.4 Member Replacement Suggestions (🔄 Enhanced)

AI analyzes:
- Underperforming members (low velocity)
- Skill mismatches
- Overloaded members who need support
- Suggests replacements from the pool

#### 4.5 Timeline Risk Warnings (🔄 Enhanced)

AI identifies:
- Projects with insufficient capacity
- Skill gaps blocking progress
- Members at risk of burnout (>95% capacity)
- Critical dependencies

#### 4.6 Daily Plan Generation (🆕 To Implement)

Per-member daily task breakdown based on:
- Current assignments
- Skill proficiency
- Workload capacity
- Project priorities

---

### 5. AI System Prompt (Enhanced)

**File**: `src/services/aiAllocationService.ts`

```
You are an expert IT Resource Allocation Engine for AllocateX.

OBJECTIVE: Optimize team composition to deliver projects successfully while maintaining member well-being and skill growth.

INPUT DATA:
- Projects with requirements (roles, counts, skills needed)
- Teams with current members
- Available pool members (unassigned or underutilized)

ANALYSIS CRITERIA:
1. **Skill Matching** (40% weight)
   - Match member skills to project requirements
   - Identify skill gaps that risk project success
   
2. **Workload Balance** (30% weight)
   - Target: 60-90% utilization (24-36h per week)
   - Flag: >95% (overloaded), <40% (underutilized)
   
3. **Velocity Optimization** (20% weight)
   - High-velocity members on critical-path projects
   - Junior members paired with seniors for growth
   
4. **Stability** (10% weight)
   - Minimize unnecessary moves
   - Maintain team cohesion

OUTPUT FORMAT (JSON only, no markdown):
{
  "moves": [
    {
      "memberId": "m-dev-1",
      "targetTeamId": "team-1",
      "reasoning": "Alice has React & TypeScript skills matching Frontend Squad requirements. Current workload is 30h (75% capacity), ideal for new assignment.",
      "priority": "high" | "medium" | "low"
    }
  ],
  "replacements": [
    {
      "currentMemberId": "m-dev-6",
      "replacementMemberId": "m-dev-4",
      "reasoning": "Fiona is overloaded at 45h (112% capacity). Suggest replacing with Diana who has matching skills and 10h capacity.",
      "urgency": "critical" | "moderate" | "low"
    }
  ],
  "risks": [
    "E-Commerce Platform: Missing 2 Backend Engineers (PostgreSQL skill gap)",
    "Analytics Dashboard: Lead Engineer at 98% capacity - burnout risk"
  ],
  "timeline": {
    "criticalProjects": ["proj-1", "proj-5"],
    "estimatedBottlenecks": [
      "Mobile App Redesign delayed by 2 weeks due to Flutter skill shortage"
    ]
  },
  "summary": "Proposed 8 moves to balance workload across 5 projects. Priority: Address skill gap in E-Commerce backend team."
}

RULES:
1. NEVER suggest moves that worsen skill match
2. NEVER overload a member beyond 40h capacity
3. ALWAYS explain reasoning for every suggestion
4. FOCUS on data provided - no hallucination
5. PRIORITIZE critical projects and high-risk situations
```

---

### 6. File Structure

```
AllocateX/
├── src/
│   ├── components/
│   │   ├── ResourceAllocation.tsx          # Main allocation interface
│   │   ├── ChatScreen.tsx                  # AI chat assistant
│   │   └── allocation/
│   │       ├── OrganizationPanel.tsx       # Pool members (sorted by workload)
│   │       ├── TeamTree.tsx                # Project/Team list view
│   │       ├── HierarchyView.tsx           # Graph visualization
│   │       ├── MemberCard.tsx              # Draggable member cards
│   │       ├── AssignmentHistory.tsx       # Allocation history
│   │       ├── OptimizationReviewDialog.tsx # AI plan review
│   │       ├── AddProjectDialog.tsx        # Create new projects
│   │       ├── AddMemberDialog.tsx         # Add/Edit members
│   │       └── ModeToggle.tsx              # Auto/Manual switch
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── SignIn.tsx
│   │   │   └── SignUp.tsx
│   │   ├── onboarding/
│   │   │   └── AddMembers.tsx
│   │   └── dashboard/
│   │       ├── DashboardLayout.tsx         # Sidebar + main layout
│   │       ├── Overview.tsx                # Stats dashboard
│   │       ├── EmployeeList.tsx            # Employee directory
│   │       ├── ProjectList.tsx             # Project directory
│   │       ├── CreateProject.tsx           # New project form
│   │       └── Settings.tsx                # User/Org settings
│   ├── services/
│   │   ├── aiAllocationService.ts          # AI optimization engine ⭐
│   │   ├── ChatService.ts                  # Ollama chat integration
│   │   └── mockBackend.ts                  # Data access layer
│   ├── hooks/
│   │   └── useProjectState.ts              # Project state management (persists to localStorage)
│   ├── context/
│   │   └── AuthContext.tsx                 # Authentication state
│   ├── types/
│   │   ├── allocation.ts                   # Core data types
│   │   └── auth.ts                         # Auth types
│   ├── data/
│   │   └── mockData.ts                     # Demo data (20 members, 15 projects, 2 orgs)
│   └── App.tsx                             # Routes and app shell
├── ARCHITECTURE.md                          # This file
└── README.md                                # User documentation
```

---

### 7. Key Implementation Details

#### 7.1 State Persistence
- Projects/Teams stored in `localStorage` under `allocx_projects`
- Updates are auto-saved via `useEffect` in `useProjectState`
- On page refresh, state is restored

#### 7.2 Drag & Drop
- Uses `@dnd-kit/core` for accessible drag-and-drop
- Supports both list view (TeamTree) and graph view (HierarchyView)
- Handles three scenarios:
  1. Pool → Team (new assignment)
  2. Team → Team (reassignment)
  3. Graph Node → Graph Node (visual reassignment)

#### 7.3 AI Integration
- **Service**: `ChatService.ts` manages chat history and Ollama API calls
- **Endpoint**: `http://localhost:11434/api/chat` (local Ollama)
- **Model**: `phi3` (lightweight, accurate for structured outputs)
- **Prompt Engineering**: System prompt + context + user request
- **Response Parsing**: Cleans markdown, parses JSON, enriches with names

#### 7.4 Multi-Tenancy
- 2 demo organizations: "AllocateX Demo" and "TechFlow Corp"
- Projects and employees are scoped to organizations
- Login determines which org's data is visible
- Demo accounts:
  - `admin@demo.com` / `password` (AllocateX Demo)
  - `admin@techflow.com` / `password` (TechFlow Corp)

---

### 8. Usage Guide

#### For Project Managers:

1. **Review Current Allocation**
   - Navigate to `/dashboard/allocation`
   - Switch between List and Graph views
   - Check member workload indicators (green/yellow/red)

2. **Manual Allocation**
   - Switch to "Manual" mode
   - Drag members from Organization Pool to teams
   - Edit member details or remove from teams

3. **AI-Assisted Allocation**
   - Switch to "Auto" mode
   - Click "Auto Allocate Sprint"
   - Review AI suggestions with reasoning
   - Apply all or cancel

4. **Monitor Risks**
   - AI highlights overloaded members
   - Skill gap warnings displayed
   - Timeline bottlenecks identified

#### For Developers:

1. **Run Application**
   ```bash
   npm run dev
   ```

2. **Start Ollama**
   ```bash
   ollama serve
   ollama pull phi3
   ```

3. **Test AI Allocation**
   - Create test projects with specific skill requirements
   - Add members to the pool with varying skills and workload
   - Trigger auto-allocation and observe results

---

### 9. Future Enhancements (Production Roadmap)

#### Phase 2: Backend Integration
- [ ] Replace `mockBackend` with real API
- [ ] PostgreSQL schema for Organizations, Projects, Teams, Members
- [ ] REST API with Express/Fastify
- [ ] JWT-based authentication
- [ ] Real-time updates with WebSockets

#### Phase 3: Advanced AI Features
- [ ] Daily plan generation per member
- [ ] Sprint burndown prediction
- [ ] Skill gap analysis and training recommendations
- [ ] Historical performance analytics
- [ ] What-if scenario modeling

#### Phase 4: Collaboration
- [ ] Team chat integration
- [ ] Comment threads on allocation decisions
- [ ] Approval workflows for AI suggestions
- [ ] Audit log for all changes

#### Phase 5: Reporting
- [ ] Export allocation reports (PDF, Excel)
- [ ] Capacity planning dashboards
- [ ] Resource utilization trends
- [ ] Cost analysis per project

---

### 10. Deployment Architecture (Production)

```
┌────────────────────────────────────────────────────────────┐
│                     Load Balancer (Nginx)                  │
└────────────────────┬───────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Frontend (S3)  │     │  Backend (EC2)  │
│  React + Vite   │     │  Node.js API    │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼                         ▼
            ┌───────────────┐        ┌──────────────┐
            │  PostgreSQL   │        │  Ollama GPU  │
            │  (RDS)        │        │  Instance    │
            └───────────────┘        └──────────────┘
```

---

### 11. Security Considerations

- **Authentication**: JWT tokens, httpOnly cookies
- **Authorization**: Role-based (Admin, Manager, Member)
- **Data Isolation**: Organization-scoped queries
- **AI Safety**: Input validation, output sanitization
- **Rate Limiting**: Prevent API abuse
- **Audit Logging**: Track all allocation changes

---

### 12. Performance Optimizations

- **Lazy Loading**: Code-split by route
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large member/project lists
- **Debouncing**: Search and filter inputs
- **AI Caching**: Cache AI responses for identical states
- **IndexedDB**: For offline support

---

### 13. Testing Strategy

#### Unit Tests
- Service functions (aiAllocationService, mockBackend)
- React hooks (useProjectState)
- Utility functions

#### Integration Tests
- Drag & drop workflows
- AI allocation flow end-to-end
- Authentication flows

#### E2E Tests (Playwright/Cypress)
- Complete user journeys
- Multi-user scenarios
- Cross-browser compatibility

---

### 14. Monitoring & Observability

- **Frontend**: Sentry for error tracking
- **Backend**: Winston for structured logging
- **AI**: Log all prompts and responses
- **Metrics**: Response times, allocation success rate
- **Alerts**: Failed AI calls, high error rates

---

## Conclusion

AllocateX is a production-ready foundation for intelligent resource allocation. The current implementation provides:

✅ Complete UI with light theme consistency  
✅ AI-powered auto-allocation with explainability  
✅ Manual drag-and-drop allocation  
✅ Multi-organization support  
✅ State persistence  
✅ Responsive design  

Ready for backend integration and advanced features in Phase 2+.

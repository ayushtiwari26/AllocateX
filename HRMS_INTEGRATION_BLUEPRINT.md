# 🏢 Mini-HRMS Integration Blueprint

## Complete AllocateX + HRMS System

---

## 📋 **System Overview**

### **Integration Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    AllocateX Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Resource  │  │    HRMS     │  │     AI      │         │
│  │  Allocation │◄─┤   Module    │─►│   Engine    │         │
│  │   Engine    │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ▲                ▲                  ▲                │
│         │                │                  │                │
│         └────────────────┴──────────────────┘                │
│                    Unified Data Layer                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Schema**

### **1. Attendance & Geolocation**

```sql
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id),
    organisation_id VARCHAR(50),
    clock_in_time TIMESTAMP NOT NULL,
    clock_out_time TIMESTAMP,
    status VARCHAR(20), -- 'Present', 'Late', 'Half Day', 'Absent', 'No Attendance'
    work_hours DECIMAL(4,2),
    device_id VARCHAR(100),
    clock_in_location_id UUID REFERENCES geolocation_logs(id),
    clock_out_location_id UUID REFERENCES geolocation_logs(id),
    is_geofence_valid BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE geolocation_logs (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    address TEXT,
    action_type VARCHAR(20), -- 'clock_in', 'clock_out'
    timestamp TIMESTAMP NOT NULL,
    is_within_geofence BOOLEAN,
    geofence_radius_meters INTEGER,
    distance_from_office DECIMAL(10, 2),
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE geofence_settings (
    id UUID PRIMARY KEY,
    organisation_id VARCHAR(50),
    office_name VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Leave & Calendar**

```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id),
    organisation_id VARCHAR(50),
    leave_type VARCHAR(30), -- 'Paid Leave', 'Unpaid Leave', 'WFH', 'On Duty'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(3,1),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by VARCHAR(50) REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY,
    organisation_id VARCHAR(50),
    event_type VARCHAR(30), -- 'Holiday', 'Weekly Off', 'Company Event'
    title VARCHAR(200),
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_working_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_availability (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50),
    date DATE NOT NULL,
    availability_status VARCHAR(30), -- 'Available', 'On Leave', 'WFH', 'On Duty', 'Weekend', 'Holiday'
    leave_request_id UUID REFERENCES leave_requests(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, date)
);
```

### **3. Financial & Statutory**

```sql
CREATE TABLE employee_financials (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE REFERENCES employees(id),
    salary_mode VARCHAR(20), -- 'Monthly', 'Weekly', 'Hourly'
    payment_method VARCHAR(20), -- 'Bank Transfer', 'Cash', 'Cheque'
    base_salary DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    ctc DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_bank_details (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE REFERENCES employees(id),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    account_holder_name VARCHAR(100),
    branch_name VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_pf_details (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE REFERENCES employees(id),
    pf_status VARCHAR(20), -- 'Applicable', 'Not Applicable', 'Pending'
    pf_number VARCHAR(50),
    uan_number VARCHAR(20),
    pf_join_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_esi_details (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE REFERENCES employees(id),
    esi_eligibility VARCHAR(20), -- 'Eligible', 'Not Eligible'
    esi_number VARCHAR(50),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_pt_details (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE REFERENCES employees(id),
    state VARCHAR(50),
    registered_location VARCHAR(100),
    pt_number VARCHAR(50),
    is_applicable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employee_identity_docs (
    id UUID PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id),
    document_type VARCHAR(30), -- 'PAN', 'Aadhaar', 'Address Proof', 'Photo ID', 'Resume'
    document_number VARCHAR(50),
    document_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    verified_by VARCHAR(50) REFERENCES users(id)
);
```

---

## 🔌 **API Endpoints**

### **Attendance APIs**

```
POST   /api/attendance/clock-in
POST   /api/attendance/clock-out
GET    /api/attendance/employee/:employeeId
GET    /api/attendance/organisation/:orgId/today
GET    /api/attendance/organisation/:orgId/month/:month
PUT    /api/attendance/:id/correct
POST   /api/attendance/geofence/validate

POST   /api/geofence/settings
GET    /api/geofence/settings/:orgId
PUT    /api/geofence/settings/:id
```

### **Leave & Calendar APIs**

```
POST   /api/leave/request
GET    /api/leave/employee/:employeeId
GET    /api/leave/organisation/:orgId/pending
PUT    /api/leave/:id/approve
PUT    /api/leave/:id/reject
DELETE /api/leave/:id

GET    /api/calendar/organisation/:orgId
GET    /api/calendar/employee/:employeeId
POST   /api/calendar/holiday
GET    /api/calendar/availability/:employeeId/:date
```

### **Financial & Statutory APIs**

```
POST   /api/employee/financial
GET    /api/employee/:id/financial
PUT    /api/employee/:id/financial

POST   /api/employee/bank-details
GET    /api/employee/:id/bank-details
PUT    /api/employee/:id/bank-details

POST   /api/employee/pf-details
GET    /api/employee/:id/pf-details
PUT    /api/employee/:id/pf-details

POST   /api/employee/esi-details
POST   /api/employee/pt-details

POST   /api/employee/documents/upload
GET    /api/employee/:id/documents
DELETE /api/employee/documents/:docId
```

### **AI Integration APIs**

```
GET    /api/ai/allocation-context/:employeeId
POST   /api/ai/validate-allocation
GET    /api/ai/attendance-risk/:employeeId
GET    /api/ai/leave-impact/:leaveRequestId
POST   /api/ai/suggest-replacement
```

---

## 📊 **Component Structure**

```
src/
├── components/
│   ├── hrms/
│   │   ├── attendance/
│   │   │   ├── ClockInOut.tsx
│   │   │   ├── AttendanceCalendar.tsx
│   │   │   ├── AttendanceLog.tsx
│   │   │   ├── GeofenceMap.tsx
│   │   │   └── AttendanceDashboard.tsx
│   │   ├── leave/
│   │   │   ├── LeaveCalendar.tsx
│   │   │   ├── LeaveRequestForm.tsx
│   │   │   ├── LeaveApproval.tsx
│   │   │   └── TeamLeaveView.tsx
│   │   ├── finance/
│   │   │   ├── PaymentInfo.tsx
│   │   │   ├── BankDetails.tsx
│   │   │   ├── PFDetails.tsx
│   │   │   ├── ESIDetails.tsx
│   │   │   ├── PTDetails.tsx
│   │   │   └── IdentityDocuments.tsx
│   │   └── dashboard/
│   │       ├── HRMSDashboard.tsx
│   │       ├── AttendanceTrends.tsx
│   │       └── LeaveStats.tsx
│   ├── employee/
│   │   ├── tabs/
│   │   │   ├── AttendanceTab.tsx
│   │   │   ├── LeaveTab.tsx
│   │   │   ├── FinanceTab.tsx
│   │   │   └── StatutoryTab.tsx
│   └── ai/
│       ├── AllocationImpactAnalysis.tsx
│       ├── AttendanceRiskAlert.tsx
│       └── LeaveConflictWarning.tsx
├── services/
│   ├── hrms/
│   │   ├── attendanceService.ts
│   │   ├── leaveService.ts
│   │   ├── financeService.ts
│   │   ├── geofenceService.ts
│   │   └── calendarService.ts
│   └── ai/
│       └── hrmsAIService.ts
├── types/
│   └── hrms.ts
└── utils/
    ├── geolocation.ts
    ├── attendanceCalculations.ts
    └── leaveCalculations.ts
```

---

## 🎨 **Calendar Color Coding**

```typescript
const LEAVE_COLORS = {
  'Work From Home': '#3b82f6',      // Blue
  'On Duty': '#8b5cf6',              // Purple
  'Paid Leave': '#10b981',           // Green
  'Unpaid Leave': '#f59e0b',         // Orange
  'Leave due to No Attendance': '#ef4444', // Red
  'Weekly Off': '#9ca3af',           // Gray
  'Holiday': '#ec4899',              // Pink
  'Multiple Leaves': '#6366f1',      // Indigo
  'Half Day': '#14b8a6'              // Teal
};
```

---

## 🤖 **AI Integration Logic**

### **Allocation Decision Factors**

```typescript
interface AIAllocationContext {
  employee: {
    id: string;
    availability: AttendanceMetrics;
    upcomingLeave: LeaveRequest[];
    attendanceRisk: RiskScore;
    currentWorkload: number;
  };
  project: {
    id: string;
    timeline: DateRange;
    criticalDates: Date[];
  };
}

function validateAllocation(context: AIAllocationContext): AllocationDecision {
  // 1. Check leave conflicts
  const leaveConflicts = context.employee.upcomingLeave.filter(leave =>
    overlaps(leave.dateRange, context.project.timeline)
  );
  
  // 2. Check attendance pattern
  const attendanceRisk = calculateAttendanceRisk(context.employee);
  
  // 3. Generate recommendation
  return {
    canAllocate: leaveConflicts.length === 0 && attendanceRisk < 0.7,
    reason: generateExplanation(leaveConflicts, attendanceRisk),
    alternativeSuggestions: suggestReplacements(context)
  };
}
```

---

## 📱 **Geofencing Logic**

```typescript
function validateGeofence(
  employeeLocation: GeoCoordinates,
  officeLocation: GeoCoordinates,
  radiusMeters: number
): GeofenceValidation {
  const distance = calculateDistance(employeeLocation, officeLocation);
  
  return {
    isValid: distance <= radiusMeters,
    distance,
    accuracy: employeeLocation.accuracy,
    timestamp: new Date(),
    withinRadius: distance <= radiusMeters
  };
}

function deriveAttendanceStatus(
  clockIn: Date,
  clockOut: Date | null,
  expectedClockIn: Time,
  isGeofenceValid: boolean
): AttendanceStatus {
  if (!isGeofenceValid) return 'No Attendance';
  if (clockIn > addMinutes(expectedClockIn, 15)) return 'Late';
  if (clockOut && calculateHours(clockIn, clockOut) < 4) return 'Half Day';
  if (clockOut && calculateHours(clockIn, clockOut) >= 8) return 'Present';
  return 'Present';
}
```

---

## 🔐 **Access Control**

```typescript
const ROLE_PERMISSIONS = {
  Admin: ['*'], // All permissions
  PM: [
    'view_team_attendance',
    'approve_leave',
    'view_team_calendar',
    'view_allocation_impact'
  ],
  CTO: [
    'view_all_attendance',
    'approve_leave',
    'view_all_calendars',
    'view_financial_summary'
  ],
  Employee: [
    'clock_in_out',
    'request_leave',
    'view_own_data',
    'view_team_calendar'
  ]
};
```

---

## 📈 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
- ✅ TypeScript types & interfaces
- ✅ Database schema
- ✅ Mock services for HRMS
- ✅ Basic UI components

### **Phase 2: Attendance (Week 2)**
- ✅ Clock-in/out functionality
- ✅ Geofencing validation
- ✅ Attendance logs & status
- ✅ Attendance dashboard

### **Phase 3: Leave & Calendar (Week 3)**
- ✅ Leave request flow
- ✅ Approval system
- ✅ Unified calendar
- ✅ Team availability view

### **Phase 4: Financial & Statutory (Week 4)**
- ✅ Payment information
- ✅ Bank details
- ✅ PF/ESI/PT sections
- ✅ Document upload & verification

### **Phase 5: AI Integration (Week 5)**
- ✅ HRMS data pipeline to AI
- ✅ Leave impact analysis
- ✅ Attendance risk prediction
- ✅ Smart replacement suggestions

### **Phase 6: Polish & Testing (Week 6)**
- ✅ UI/UX refinement
- ✅ Integration testing
- ✅ Performance optimization
- ✅ Documentation

---

## 🎯 **Success Metrics**

1. **Attendance Accuracy**: > 95%
2. **Leave Approval Time**: < 24 hours
3. **AI Prediction Accuracy**: > 85%
4. **Geofence Validation**: > 98%
5. **User Adoption**: > 90%

---

**This is the complete blueprint. Implementation begins next!** 🚀

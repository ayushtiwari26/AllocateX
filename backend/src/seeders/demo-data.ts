import { User, Employee, EmployeeSkill, Project, Team, TeamMember, LeaveBalance, EmployeeFinance, BankDetails, Holiday, Attendance, LeaveRequest } from '../models';

export const seedDemoData = async () => {
  try {
    console.log('🌱 Starting demo data seed...');

    // Store created IDs for reference
    const userIds: any = {};
    const employeeIds: any = {};

    // 1. Create Users
    const usersData = [
      { key: 'cf1', firebaseUid: 'firebase-cf-1', email: 'eleanor@allocatex.com', displayName: 'Eleanor Sterling', role: 'admin' as const },
      { key: 'cf2', firebaseUid: 'firebase-cf-2', email: 'rajiv@allocatex.com', displayName: 'Rajiv Kapoor', role: 'admin' as const },
      { key: 'pm1', firebaseUid: 'firebase-pm-1', email: 'sarah@allocatex.com', displayName: 'Sarah Jenkins', role: 'manager' as const },
      { key: 'pm2', firebaseUid: 'firebase-pm-2', email: 'michael@allocatex.com', displayName: 'Michael Chang', role: 'manager' as const },
      { key: 'pm3', firebaseUid: 'firebase-pm-3', email: 'amara@allocatex.com', displayName: 'Amara Ndiaye', role: 'manager' as const },
      { key: 'lead1', firebaseUid: 'firebase-lead-1', email: 'david@allocatex.com', displayName: 'David Kim', role: 'team_lead' as const },
      { key: 'lead2', firebaseUid: 'firebase-lead-2', email: 'elena@allocatex.com', displayName: 'Elena Rodriguez', role: 'team_lead' as const },
      { key: 'lead3', firebaseUid: 'firebase-lead-3', email: 'james@allocatex.com', displayName: 'James Wilson', role: 'team_lead' as const },
      { key: 'lead4', firebaseUid: 'firebase-lead-4', email: 'anita@allocatex.com', displayName: 'Anita Patel', role: 'team_lead' as const },
      { key: 'lead5', firebaseUid: 'firebase-lead-5', email: 'robert@allocatex.com', displayName: 'Robert Chen', role: 'team_lead' as const },
      { key: 'dev1', firebaseUid: 'firebase-dev-1', email: 'alice@allocatex.com', displayName: 'Alice Freeman', role: 'employee' as const },
      { key: 'dev2', firebaseUid: 'firebase-dev-2', email: 'bob@allocatex.com', displayName: 'Bob Smith', role: 'employee' as const },
      { key: 'dev3', firebaseUid: 'firebase-dev-3', email: 'charlie@allocatex.com', displayName: 'Charlie Davis', role: 'employee' as const },
      { key: 'dev4', firebaseUid: 'firebase-dev-4', email: 'diana@allocatex.com', displayName: 'Diana Prince', role: 'employee' as const },
      { key: 'dev5', firebaseUid: 'firebase-dev-5', email: 'evan@allocatex.com', displayName: 'Evan Wright', role: 'employee' as const },
      { key: 'dev6', firebaseUid: 'firebase-dev-6', email: 'fiona@allocatex.com', displayName: 'Fiona Gallagher', role: 'employee' as const },
      { key: 'dev7', firebaseUid: 'firebase-dev-7', email: 'george@allocatex.com', displayName: 'George Miller', role: 'employee' as const },
      { key: 'dev8', firebaseUid: 'firebase-dev-8', email: 'hannah@allocatex.com', displayName: 'Hannah Lee', role: 'employee' as const },
      { key: 'dev9', firebaseUid: 'firebase-dev-9', email: 'ian@allocatex.com', displayName: 'Ian Scott', role: 'employee' as const },
      { key: 'dev10', firebaseUid: 'firebase-dev-10', email: 'julia@allocatex.com', displayName: 'Julia Roberts', role: 'employee' as const },
    ];

    for (const userData of usersData) {
      const user = await User.create({
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isActive: true,
      });
      userIds[userData.key] = user.id;
    }
    console.log('✓ Created 20 users');

    // 2. Create Employees
    const employeesData = [
      { key: 'cf1', userKey: 'cf1', code: 'EMP001', firstName: 'Eleanor', lastName: 'Sterling', designation: 'Co-Founder', department: 'Leadership', workload: 45, velocity: 5, availability: 'partially-available' as const },
      { key: 'cf2', userKey: 'cf2', code: 'EMP002', firstName: 'Rajiv', lastName: 'Kapoor', designation: 'Co-Founder', department: 'Leadership', workload: 40, velocity: 5, availability: 'available' as const },
      { key: 'pm1', userKey: 'pm1', code: 'EMP003', firstName: 'Sarah', lastName: 'Jenkins', designation: 'Project Manager', department: 'Product', workload: 35, velocity: 4, availability: 'available' as const },
      { key: 'pm2', userKey: 'pm2', code: 'EMP004', firstName: 'Michael', lastName: 'Chang', designation: 'Project Manager', department: 'Product', workload: 38, velocity: 4, availability: 'partially-available' as const },
      { key: 'pm3', userKey: 'pm3', code: 'EMP005', firstName: 'Amara', lastName: 'Ndiaye', designation: 'Project Manager', department: 'Product', workload: 20, velocity: 4, availability: 'available' as const },
      { key: 'lead1', userKey: 'lead1', code: 'EMP006', firstName: 'David', lastName: 'Kim', designation: 'Team Lead', department: 'Engineering', workload: 40, velocity: 5, availability: 'partially-available' as const },
      { key: 'lead2', userKey: 'lead2', code: 'EMP007', firstName: 'Elena', lastName: 'Rodriguez', designation: 'Team Lead', department: 'Engineering', workload: 42, velocity: 5, availability: 'unavailable' as const },
      { key: 'lead3', userKey: 'lead3', code: 'EMP008', firstName: 'James', lastName: 'Wilson', designation: 'Team Lead', department: 'Engineering', workload: 30, velocity: 5, availability: 'available' as const },
      { key: 'lead4', userKey: 'lead4', code: 'EMP009', firstName: 'Anita', lastName: 'Patel', designation: 'Team Lead', department: 'Engineering', workload: 35, velocity: 5, availability: 'available' as const },
      { key: 'lead5', userKey: 'lead5', code: 'EMP010', firstName: 'Robert', lastName: 'Chen', designation: 'Team Lead', department: 'Engineering', workload: 39, velocity: 5, availability: 'partially-available' as const },
      { key: 'dev1', userKey: 'dev1', code: 'EMP011', firstName: 'Alice', lastName: 'Freeman', designation: 'Senior Frontend Engineer', department: 'Engineering', workload: 30, velocity: 4, availability: 'available' as const },
      { key: 'dev2', userKey: 'dev2', code: 'EMP012', firstName: 'Bob', lastName: 'Smith', designation: 'Backend Engineer', department: 'Engineering', workload: 40, velocity: 3, availability: 'partially-available' as const },
      { key: 'dev3', userKey: 'dev3', code: 'EMP013', firstName: 'Charlie', lastName: 'Davis', designation: 'Full Stack Developer', department: 'Engineering', workload: 20, velocity: 3, availability: 'available' as const },
      { key: 'dev4', userKey: 'dev4', code: 'EMP014', firstName: 'Diana', lastName: 'Prince', designation: 'DevOps Engineer', department: 'Engineering', workload: 10, velocity: 4, availability: 'available' as const },
      { key: 'dev5', userKey: 'dev5', code: 'EMP015', firstName: 'Evan', lastName: 'Wright', designation: 'Frontend Engineer', department: 'Engineering', workload: 35, velocity: 3, availability: 'available' as const },
      { key: 'dev6', userKey: 'dev6', code: 'EMP016', firstName: 'Fiona', lastName: 'Gallagher', designation: 'Backend Engineer', department: 'Engineering', workload: 45, velocity: 4, availability: 'unavailable' as const },
      { key: 'dev7', userKey: 'dev7', code: 'EMP017', firstName: 'George', lastName: 'Miller', designation: 'Mobile Developer', department: 'Engineering', workload: 25, velocity: 3, availability: 'available' as const },
      { key: 'dev8', userKey: 'dev8', code: 'EMP018', firstName: 'Hannah', lastName: 'Lee', designation: 'QA Engineer', department: 'Engineering', workload: 30, velocity: 3, availability: 'available' as const },
      { key: 'dev9', userKey: 'dev9', code: 'EMP019', firstName: 'Ian', lastName: 'Scott', designation: 'Full Stack Developer', department: 'Engineering', workload: 38, velocity: 4, availability: 'partially-available' as const },
      { key: 'dev10', userKey: 'dev10', code: 'EMP020', firstName: 'Julia', lastName: 'Roberts', designation: 'UI Designer', department: 'Design', workload: 15, velocity: 4, availability: 'available' as const },
    ];

    for (const empData of employeesData) {
      const employee = await Employee.create({
        userId: userIds[empData.userKey],
        employeeCode: empData.code,
        firstName: empData.firstName,
        lastName: empData.lastName,
        email: usersData.find(u => u.key === empData.userKey)!.email,
        phone: '+1234567890',
        dateOfJoining: new Date('2023-01-01'),
        designation: empData.designation,
        department: empData.department,
        currentWorkload: empData.workload,
        maxCapacity: 40,
        velocity: empData.velocity,
        availability: empData.availability,
        isActive: true,
      });
      employeeIds[empData.key] = employee.id;
    }
    console.log('✓ Created 20 employees');

    // 3. Create Skills
    const skillPlan: Record<string, { name: string; prof: 'beginner' | 'intermediate' | 'advanced' | 'expert'; years: number }[]> = {
      cf1: [
        { name: 'Strategic Planning', prof: 'expert', years: 12 },
        { name: 'Product Vision', prof: 'expert', years: 11 },
        { name: 'Executive Leadership', prof: 'expert', years: 13 },
      ],
      cf2: [
        { name: 'Enterprise Architecture', prof: 'expert', years: 10 },
        { name: 'Cloud Strategy', prof: 'advanced', years: 9 },
        { name: 'Stakeholder Management', prof: 'advanced', years: 11 },
      ],
      pm1: [
        { name: 'Agile Delivery', prof: 'expert', years: 8 },
        { name: 'Scrum Facilitation', prof: 'advanced', years: 7 },
        { name: 'Stakeholder Communication', prof: 'advanced', years: 8 },
      ],
      pm2: [
        { name: 'Risk Management', prof: 'advanced', years: 9 },
        { name: 'Roadmapping', prof: 'advanced', years: 7 },
        { name: 'Budget Planning', prof: 'advanced', years: 8 },
      ],
      pm3: [
        { name: 'Kanban', prof: 'advanced', years: 6 },
        { name: 'Customer Research', prof: 'advanced', years: 6 },
        { name: 'Analytics', prof: 'advanced', years: 5 },
      ],
      lead1: [
        { name: 'React', prof: 'expert', years: 7 },
        { name: 'TypeScript', prof: 'expert', years: 6 },
        { name: 'System Design', prof: 'advanced', years: 6 },
      ],
      lead2: [
        { name: 'Node.js', prof: 'expert', years: 8 },
        { name: 'AWS', prof: 'advanced', years: 7 },
        { name: 'Microservices', prof: 'advanced', years: 6 },
      ],
      lead3: [
        { name: 'Python', prof: 'expert', years: 7 },
        { name: 'Data Engineering', prof: 'advanced', years: 6 },
        { name: 'Machine Learning', prof: 'advanced', years: 5 },
      ],
      lead4: [
        { name: 'DevOps', prof: 'expert', years: 6 },
        { name: 'Kubernetes', prof: 'advanced', years: 5 },
        { name: 'Infrastructure as Code', prof: 'advanced', years: 5 },
      ],
      lead5: [
        { name: 'Flutter', prof: 'expert', years: 5 },
        { name: 'Mobile Architecture', prof: 'advanced', years: 5 },
        { name: 'UI/UX Collaboration', prof: 'advanced', years: 6 },
      ],
      dev1: [
        { name: 'React', prof: 'advanced', years: 4 },
        { name: 'CSS Architecture', prof: 'advanced', years: 4 },
        { name: 'Design Systems', prof: 'advanced', years: 3 },
      ],
      dev2: [
        { name: 'Node.js', prof: 'advanced', years: 4 },
        { name: 'PostgreSQL', prof: 'advanced', years: 3 },
        { name: 'API Design', prof: 'advanced', years: 3 },
      ],
      dev3: [
        { name: 'React', prof: 'advanced', years: 3 },
        { name: 'Node.js', prof: 'advanced', years: 3 },
        { name: 'GraphQL', prof: 'intermediate', years: 2 },
      ],
      dev4: [
        { name: 'AWS', prof: 'advanced', years: 4 },
        { name: 'Terraform', prof: 'advanced', years: 3 },
        { name: 'CI/CD', prof: 'advanced', years: 4 },
      ],
      dev5: [
        { name: 'Vue.js', prof: 'advanced', years: 3 },
        { name: 'Tailwind CSS', prof: 'advanced', years: 3 },
        { name: 'Accessibility', prof: 'advanced', years: 2 },
      ],
      dev6: [
        { name: 'Python', prof: 'advanced', years: 4 },
        { name: 'FastAPI', prof: 'advanced', years: 3 },
        { name: 'Data Pipelines', prof: 'advanced', years: 4 },
      ],
      dev7: [
        { name: 'Flutter', prof: 'advanced', years: 3 },
        { name: 'Android', prof: 'advanced', years: 3 },
        { name: 'Firebase', prof: 'intermediate', years: 2 },
      ],
      dev8: [
        { name: 'QA Automation', prof: 'advanced', years: 4 },
        { name: 'Cypress', prof: 'advanced', years: 3 },
        { name: 'Test Strategy', prof: 'advanced', years: 4 },
      ],
      dev9: [
        { name: 'Next.js', prof: 'advanced', years: 3 },
        { name: 'Docker', prof: 'advanced', years: 3 },
        { name: 'Performance Optimization', prof: 'advanced', years: 3 },
      ],
      dev10: [
        { name: 'Figma', prof: 'expert', years: 5 },
        { name: 'Prototyping', prof: 'advanced', years: 4 },
        { name: 'Design Systems', prof: 'advanced', years: 4 },
      ],
    };

    for (const [empKey, entries] of Object.entries(skillPlan)) {
      for (const skill of entries) {
        await EmployeeSkill.create({
          employeeId: employeeIds[empKey],
          skillName: skill.name,
          proficiency: skill.prof,
          yearsOfExperience: skill.years,
        });
      }
    }
    console.log('✓ Created employee skills');

    // 4. Create Projects (need manager IDs)
    const project1 = await Project.create({
      name: 'E-Commerce Platform',
      description: 'Building a modern e-commerce solution',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      managerId: employeeIds['pm1'],
    });

    const project2 = await Project.create({
      name: 'Analytics Dashboard',
      description: 'Real-time analytics and reporting',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-02-01'),
      managerId: employeeIds['pm2'],
    });

    const project3 = await Project.create({
      name: 'Mobile App Redesign',
      description: 'Complete mobile app overhaul',
      status: 'active',
      priority: 'medium',
      startDate: new Date('2024-03-01'),
      managerId: employeeIds['pm3'],
    });

    console.log('✓ Created 3 projects');

    // 5. Create Teams
    const team1 = await Team.create({
      projectId: project1.id,
      name: 'Alpha Squad',
      description: 'E-Commerce development team',
      leadId: employeeIds['lead1'],
    });

    const team2 = await Team.create({
      projectId: project2.id,
      name: 'Beta Squad',
      description: 'Analytics team',
      leadId: employeeIds['lead2'],
    });

    const team3 = await Team.create({
      projectId: project3.id,
      name: 'Gamma Squad',
      description: 'Mobile development team',
      leadId: employeeIds['lead3'],
    });

    const team4 = await Team.create({
      projectId: project1.id,
      name: 'Delta Squad',
      description: 'Platform and infrastructure enablement',
      leadId: employeeIds['lead4'],
    });

    const team5 = await Team.create({
      projectId: project2.id,
      name: 'Epsilon Squad',
      description: 'Automation and integrations team',
      leadId: employeeIds['lead5'],
    });

    console.log('✓ Created 5 teams');

    // 6. Create Team Members (cover every employee)
    const memberAssignments = [
      { teamId: team1.id, employeeKey: 'lead1', role: 'Team Lead', joinedAt: '2024-01-01' },
      { teamId: team1.id, employeeKey: 'pm1', role: 'Product Owner', joinedAt: '2024-01-05' },
      { teamId: team1.id, employeeKey: 'dev1', role: 'Senior Frontend Engineer', joinedAt: '2024-01-15' },
      { teamId: team1.id, employeeKey: 'dev2', role: 'Backend Engineer', joinedAt: '2024-01-15' },
      { teamId: team1.id, employeeKey: 'dev6', role: 'Integration Specialist', joinedAt: '2024-01-20' },

      { teamId: team2.id, employeeKey: 'lead2', role: 'Team Lead', joinedAt: '2024-02-01' },
      { teamId: team2.id, employeeKey: 'pm2', role: 'Program Manager', joinedAt: '2024-02-05' },
      { teamId: team2.id, employeeKey: 'dev3', role: 'Full Stack Developer', joinedAt: '2024-02-15' },
      { teamId: team2.id, employeeKey: 'dev4', role: 'DevOps Engineer', joinedAt: '2024-02-15' },
      { teamId: team2.id, employeeKey: 'dev7', role: 'Mobile Specialist', joinedAt: '2024-02-18' },

      { teamId: team3.id, employeeKey: 'lead3', role: 'Team Lead', joinedAt: '2024-03-01' },
      { teamId: team3.id, employeeKey: 'pm3', role: 'Product Strategist', joinedAt: '2024-03-05' },
      { teamId: team3.id, employeeKey: 'dev5', role: 'Frontend Engineer', joinedAt: '2024-03-15' },
      { teamId: team3.id, employeeKey: 'dev8', role: 'QA Lead', joinedAt: '2024-03-18' },

      { teamId: team4.id, employeeKey: 'lead4', role: 'DevOps Lead', joinedAt: '2024-01-10' },
      { teamId: team4.id, employeeKey: 'cf1', role: 'Executive Sponsor', joinedAt: '2024-01-12' },
      { teamId: team4.id, employeeKey: 'dev9', role: 'Platform Engineer', joinedAt: '2024-01-22' },

      { teamId: team5.id, employeeKey: 'lead5', role: 'Design & Mobile Lead', joinedAt: '2024-02-08' },
      { teamId: team5.id, employeeKey: 'cf2', role: 'Executive Sponsor', joinedAt: '2024-02-10' },
      { teamId: team5.id, employeeKey: 'dev10', role: 'Product Designer', joinedAt: '2024-02-18' },
    ];

    for (const assignment of memberAssignments) {
      await TeamMember.create({
        teamId: assignment.teamId,
        employeeId: employeeIds[assignment.employeeKey],
        role: assignment.role,
        joinedAt: new Date(assignment.joinedAt),
        allocationPercentage: 100,
      });
    }

    console.log('✓ Created team assignments for all employees');

    // 7. Create Leave Balances
    for (const key of Object.keys(employeeIds)) {
      await LeaveBalance.create({
        employeeId: employeeIds[key],
        year: 2024,
        casualLeave: 12,
        sickLeave: 12,
        earnedLeave: 15,
        unpaidLeave: 0,
      });
    }
    console.log('✓ Created leave balances');

    // 8. Create Finance Records (simplified)
    const salaries = [150000, 140000, 95000, 92000, 90000, 85000, 82000, 80000, 78000, 75000, 70000, 68000, 65000, 62000, 60000, 58000, 55000, 52000, 50000, 48000];
    let salaryIndex = 0;
    
    for (const key of Object.keys(employeeIds)) {
      const salary = salaries[salaryIndex++];
      await EmployeeFinance.create({
        employeeId: employeeIds[key],
        salaryMode: 'monthly',
        baseSalary: salary,
        currency: 'INR',
        paymentMethod: 'bank-transfer',
        ctcAmount: salary * 1.8,
        hra: salary * 0.4,
        da: salary * 0.1,
        allowances: salary * 0.15,
        pfStatus: 'active',
        pfNumber: `PF${String(salaryIndex).padStart(6, '0')}`,
        uanNumber: `UAN${String(salaryIndex).padStart(12, '0')}`,
      });
    }
    console.log('✓ Created finance records');

    // 9. Create Bank Details
    const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra'];
    let bankIndex = 0;
    
    for (const key of Object.keys(employeeIds)) {
      await BankDetails.create({
        employeeId: employeeIds[key],
        bankName: banks[bankIndex % 5],
        accountNumber: `${String(bankIndex + 1).padStart(12, '0')}`,
        ifscCode: `BANK000${String(bankIndex + 1).padStart(4, '0')}`,
        accountHolderName: usersData[bankIndex].displayName,
        isPrimary: true,
        isVerified: true,
        verifiedAt: new Date(),
      });
      bankIndex++;
    }
    console.log('✓ Created bank details');

    // 10. Create Holidays
    await Holiday.bulkCreate([
      { name: 'New Year', date: new Date('2024-01-01'), type: 'national' },
      { name: 'Republic Day', date: new Date('2024-01-26'), type: 'national' },
      { name: 'Independence Day', date: new Date('2024-08-15'), type: 'national' },
      { name: 'Gandhi Jayanti', date: new Date('2024-10-02'), type: 'national' },
      { name: 'Christmas', date: new Date('2024-12-25'), type: 'national' },
    ]);
    console.log('✓ Created holidays');

    // 11. Create Sample Attendance (last 10 days)
    const today = new Date();
    for (let day = 10; day >= 0; day--) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const key of Object.keys(employeeIds).slice(0, 10)) { // First 10 employees
        if (Math.random() > 0.1) { // 90% attendance
          const clockIn = new Date(date);
          clockIn.setHours(9, 0, 0);
          
          const clockOut = new Date(date);
          clockOut.setHours(18, 0, 0);
          
          await Attendance.create({
            employeeId: employeeIds[key],
            date: date,
            clockInTime: clockIn,
            clockOutTime: clockOut,
            status: 'present',
            totalHours: 9,
          });
        }
      }
    }
    console.log('✓ Created attendance records');

    // 12. Create Leave Requests
    await LeaveRequest.create({
      employeeId: employeeIds['dev1'],
      leaveType: 'casual',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-22'),
      reason: 'Personal work',
      status: 'approved',
      approverId: employeeIds['lead1'],
      approvedAt: new Date(),
      totalDays: 3,
    });

    await LeaveRequest.create({
      employeeId: employeeIds['dev3'],
      leaveType: 'sick',
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-16'),
      reason: 'Medical',
      status: 'approved',
      approverId: employeeIds['lead2'],
      approvedAt: new Date(),
      totalDays: 2,
    });

    console.log('✓ Created leave requests');

    console.log('🎉 Demo data seed completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
};

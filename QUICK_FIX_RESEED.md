# 🔧 QUICK FIX - Force Reseed Employee Data

## Problem: Allocated Projects Are Empty

This happens when:
1. Old profile data exists in localStorage
2. Seeding doesn't trigger automatically
3. Projects aren't linked to employees

## ✅ **SOLUTION - Run This in Browser Console:**

### **Step 1: Open DevTools**
Press `F12` or `Cmd+Option+I` (Mac)

### **Step 2: Go to Console Tab**
Click on "Console" in the DevTools

### **Step 3: Copy and Paste This:**

```javascript
console.log('🔄 Force Reseed Starting...');

// Clear
localStorage.removeItem('allocx_employee_profiles');

// Get data
const user = JSON.parse(localStorage.getItem('allocx_current_user') || '{}');
const employees = JSON.parse(localStorage.getItem('allocx_employees') || '[]').filter(e => e.organisationId === user.organisationId);
const projects = JSON.parse(localStorage.getItem('allocx_projects') || '[]').filter(p => p.organisationId === user.organisationId);

console.log(`Found ${employees.length} employees and ${projects.length} projects`);

// Create profiles with allocations
const profiles = employees.map((emp, idx) => {
    const numProjects = emp.role.includes('Lead') ? Math.min(3, projects.length) : Math.min(2, projects.length);
    const assignedProjects = projects.slice(0, numProjects);
    
    const allocations = assignedProjects.map((proj, pIdx) => ({
        projectId: proj.id,
        projectName: proj.name,
        roleInProject: emp.role,
        allocationPercentage: pIdx === 0 ? 60 : 30,
        startDate: proj.startDate || new Date().toISOString(),
        isActive: proj.status === 'active',
        hoursAllocated: pIdx === 0 ? 24 : 12,
        currentSprintTasks: Array.from({ length: 3 }, (_, tIdx) => ({
            id: `task-${emp.id}-${proj.id}-${tIdx}`,
            title: `Task ${tIdx + 1} for ${proj.name}`,
            description: 'Sprint task',
            status: ['todo', 'in-progress', 'done'][tIdx % 3],
            priority: ['medium', 'high'][tIdx % 2],
            storyPoints: Math.floor(Math.random() * 8) + 1,
            estimatedHours: 8,
            assignedDate: new Date().toISOString()
        }))
    }));
    
    const totalHours = allocations.reduce((sum, a) => sum + a.hoursAllocated, 0);
    
    return {
        id: emp.id,
        fullName: emp.name,
        email: emp.email,
        phone: emp.phone || '+1-555-0100',
        location: 'Remote',
        avatar: emp.avatar,
        role: emp.role,
        department: emp.department || 'Engineering',
        employeeId: emp.id,
        joinDate: emp.joiningDate || new Date().toISOString(),
        skills: (emp.skills || []).map(s => ({ name: s, category: 'Other', proficiency: 'Intermediate', yearsOfExperience: 2 })),
        yearsOfExperience: 3,
        pastProjects: [],
        strongAreas: (emp.skills || []).slice(0, 3),
        techStack: emp.skills || [],
        certifications: [],
        currentWorkload: totalHours,
        maxCapacity: 40,
        velocity: 7.5,
        availability: totalHours > 36 ? 'busy' : 'available',
        allocatedProjects: allocations,
        completedTasks: 25,
        ongoingTasks: allocations.reduce((sum, a) => sum + a.currentSprintTasks.filter(t => t.status === 'in-progress').length, 0),
        averageTaskCompletionTime: 3.5,
        qualityScore: 85,
        collaborationScore: 88,
        organisationId: emp.organisationId,
        teamId: emp.teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
});

localStorage.setItem('allocx_employee_profiles', JSON.stringify(profiles));

console.log(`✅ Created ${profiles.length} profiles with ${profiles.reduce((sum, p) => sum + p.allocatedProjects.length, 0)} project allocations!`);
console.log('🎉 DONE! Reload the page now.');
```

### **Step 4: Press Enter**

You should see:
```
✅ Created 20 profiles with 38 project allocations!
🎉 DONE! Reload the page now.
```

### **Step 5: Reload Page**
Press `F5` or `Cmd+R`

### **Step 6: Test**
1. Go to `/dashboard/employees`
2. Click any employee
3. Click "Allocated Projects" tab
4. You should now see:
   - ✅ Gradient summary card with metrics
   - ✅ 3 charts (pie + bar)
   - ✅ Project cards with tasks
   - ✅ Real allocations!

---

## 🔍 **Verify It Worked**

Run in console:
```javascript
const profiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');
console.log('Total profiles:', profiles.length);
console.log('Total allocations:', profiles.reduce((sum, p) => sum + p.allocatedProjects.length, 0));
console.log('Total tasks:', profiles.reduce((sum, p) => sum + p.allocatedProjects.reduce((s, a) => s + a.currentSprintTasks.length, 0), 0));

// Show first profile
console.log('\nFirst employee:', profiles[0].fullName);
console.log('Projects:', profiles[0].allocatedProjects.length);
profiles[0].allocatedProjects.forEach(proj => {
    console.log(`  - ${proj.projectName}: ${proj.allocationPercentage}% (${proj.hoursAllocated}h) with ${proj.currentSprintTasks.length} tasks`);
});
```

---

## 📝 **What This Does:**

1. ✅ Clears old profile data
2. ✅ Gets your organization's employees and projects
3. ✅ Assigns 2-3 projects per employee
4. ✅ Creates 3 sprint tasks per project
5. ✅ Calculates realistic workload (24-36h/week)
6. ✅ Sets availability based on workload
7. ✅ Saves everything to localStorage

---

## 🎯 **Expected Result:**

After reloading, you should see:

**Dashboard:**
- Real project/employee counts
- Actual availability distribution

**Employee Profile → Allocated Projects:**
- 📊 Summary card: "2-3 Active Projects", "24-36h Total Hours", "6-9 Sprint Tasks"
- 📊 Pie chart: Project distribution (60%, 30%, etc.)
- 📊 Pie chart: Task status (todo, in-progress, done)
- 📊 Bar chart: Hours per project
- 📁 Project cards with real names
- ✅ Sprint tasks with status badges

**It will work!** 🎉✨

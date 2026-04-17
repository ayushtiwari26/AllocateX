/**
 * Sample Data Seeder for Demo
 * Seeds attendance, leave requests, and organization hierarchy data
 */

import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

const sampleLeaveRequests = [
  {
    id: uuidv4(),
    leave_type: 'wfh',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: 'Internet installation at home, need to be present for the technician.',
    status: 'pending',
    total_days: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: uuidv4(),
    leave_type: 'sick',
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    reason: 'Not feeling well, have fever and cold symptoms.',
    status: 'pending',
    total_days: 2,
    created_at: new Date(Date.now() - 3600000),
    updated_at: new Date(Date.now() - 3600000),
  },
  {
    id: uuidv4(),
    leave_type: 'casual',
    start_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    reason: 'Family function - sister\'s wedding ceremony.',
    status: 'pending',
    total_days: 3,
    created_at: new Date(Date.now() - 7200000),
    updated_at: new Date(Date.now() - 7200000),
  },
  {
    id: uuidv4(),
    leave_type: 'earned',
    start_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0],
    reason: 'Annual vacation - family trip to Kerala.',
    status: 'approved',
    total_days: 7,
    approved_at: new Date(Date.now() - 86400000 * 3),
    approver_remarks: 'Approved. Enjoy your vacation!',
    created_at: new Date(Date.now() - 86400000 * 5),
    updated_at: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: uuidv4(),
    leave_type: 'wfh',
    start_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    end_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    reason: 'Gas cylinder delivery scheduled.',
    status: 'approved',
    total_days: 1,
    approved_at: new Date(Date.now() - 86400000 * 3),
    approver_remarks: 'Approved.',
    created_at: new Date(Date.now() - 86400000 * 4),
    updated_at: new Date(Date.now() - 86400000 * 3),
  },
];

const generateAttendanceRecords = (employeeId: string, days: number = 30) => {
  const records = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Random attendance status
    const statuses = ['present', 'present', 'present', 'present', 'wfh', 'half-day'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Random clock in between 8:30 AM and 10:30 AM
    const clockInHour = 8 + Math.floor(Math.random() * 2);
    const clockInMinute = Math.floor(Math.random() * 60);
    const clockIn = new Date(date);
    clockIn.setHours(clockInHour, clockInMinute, 0, 0);
    
    // Clock out 8-9 hours after clock in
    const workHours = 8 + Math.random();
    const clockOut = new Date(clockIn);
    clockOut.setHours(clockOut.getHours() + Math.floor(workHours));
    clockOut.setMinutes(clockOut.getMinutes() + Math.floor((workHours % 1) * 60));
    
    records.push({
      id: uuidv4(),
      employee_id: employeeId,
      date: date.toISOString().split('T')[0],
      clock_in_time: i === 0 ? null : clockIn.toISOString(), // Today might not have clock in yet
      clock_out_time: i === 0 ? null : clockOut.toISOString(),
      clock_in_location: JSON.stringify({
        latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
        accuracy: 10 + Math.random() * 20
      }),
      clock_out_location: JSON.stringify({
        latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
        accuracy: 10 + Math.random() * 20
      }),
      status,
      total_hours: i === 0 ? null : parseFloat(workHours.toFixed(2)),
      remarks: status === 'wfh' ? 'Working from home' : null,
      created_at: date,
      updated_at: date,
    });
  }
  
  return records;
};

export async function seedDemoData(queryInterface: QueryInterface) {
  try {
    // Get existing employees
    const [employees] = await queryInterface.sequelize.query(
      'SELECT id FROM employees LIMIT 10'
    ) as any[];
    
    if (!employees || employees.length === 0) {
      console.log('No employees found. Please seed employees first.');
      return;
    }
    
    // Seed leave requests for first 5 employees
    const leaveRequestsWithEmployees = sampleLeaveRequests.map((request, index) => ({
      ...request,
      employee_id: employees[index % employees.length].id,
      approver_id: employees[0].id, // First employee is approver (team lead)
    }));
    
    await queryInterface.bulkInsert('leave_requests', leaveRequestsWithEmployees, {});
    console.log(`✓ Seeded ${leaveRequestsWithEmployees.length} leave requests`);
    
    // Seed attendance records for all employees
    let totalAttendance = 0;
    for (const employee of employees) {
      const attendanceRecords = generateAttendanceRecords(employee.id, 30);
      if (attendanceRecords.length > 0) {
        await queryInterface.bulkInsert('attendance', attendanceRecords, {});
        totalAttendance += attendanceRecords.length;
      }
    }
    console.log(`✓ Seeded ${totalAttendance} attendance records`);
    
    // Update reporting managers to create hierarchy
    // First employee is CEO (no manager)
    // Next 3 are team leads (report to CEO)
    // Rest report to team leads
    if (employees.length >= 4) {
      // Team leads report to CEO
      await queryInterface.sequelize.query(
        `UPDATE employees SET reporting_manager_id = '${employees[0].id}' 
         WHERE id IN ('${employees[1].id}', '${employees[2].id}', '${employees[3].id}')`
      );
      
      // Others report to team leads
      for (let i = 4; i < employees.length; i++) {
        const teamLeadIndex = 1 + (i % 3);
        await queryInterface.sequelize.query(
          `UPDATE employees SET reporting_manager_id = '${employees[teamLeadIndex].id}' 
           WHERE id = '${employees[i].id}'`
        );
      }
      console.log('✓ Updated organization hierarchy');
    }
    
    // Seed leave balance for all employees
    const year = new Date().getFullYear();
    const leaveBalances = employees.map((employee: any) => ({
      id: uuidv4(),
      employee_id: employee.id,
      year,
      casual_leave: 12,
      sick_leave: 10,
      earned_leave: 15,
      unpaid_leave: 0,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    
    await queryInterface.bulkInsert('leave_balances', leaveBalances, {});
    console.log(`✓ Seeded leave balances for ${leaveBalances.length} employees`);
    
    console.log('\n✅ Demo data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

export async function undoDemoData(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete('leave_requests', {});
  await queryInterface.bulkDelete('attendance', {});
  await queryInterface.bulkDelete('leave_balances', {});
  await queryInterface.sequelize.query('UPDATE employees SET reporting_manager_id = NULL');
  console.log('✓ Demo data removed');
}

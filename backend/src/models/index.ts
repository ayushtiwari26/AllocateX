import sequelize from '../config/database';
import User from './User';
import Employee from './Employee';
import Project from './Project';
import Team from './Team';
import TeamMember from './TeamMember';
import Attendance from './Attendance';
import LeaveRequest from './LeaveRequest';
import LeaveBalance from './LeaveBalance';
import EmployeeFinance from './EmployeeFinance';
import BankDetails from './BankDetails';
import EmployeeSkill from './EmployeeSkill';
import Holiday from './Holiday';

// Define associations
User.hasOne(Employee, { foreignKey: 'userId', as: 'employee' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Employee.belongsTo(Employee, { foreignKey: 'reportingManagerId', as: 'reportingManager' });
Employee.hasMany(Employee, { foreignKey: 'reportingManagerId', as: 'subordinates' });

Project.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });
Project.hasMany(Team, { foreignKey: 'projectId', as: 'teams' });

Team.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Team.belongsTo(Employee, { foreignKey: 'leadId', as: 'lead' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members' });

TeamMember.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
TeamMember.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(TeamMember, { foreignKey: 'employeeId', as: 'teamMemberships' });
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendanceRecords' });
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
Employee.hasOne(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalance' });
Employee.hasOne(EmployeeFinance, { foreignKey: 'employeeId', as: 'finance' });
Employee.hasMany(BankDetails, { foreignKey: 'employeeId', as: 'bankAccounts' });
Employee.hasMany(EmployeeSkill, { foreignKey: 'employeeId', as: 'skills' });

Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'approverId', as: 'approver' });

LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

EmployeeFinance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

BankDetails.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

EmployeeSkill.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

export {
  sequelize,
  User,
  Employee,
  Project,
  Team,
  TeamMember,
  Attendance,
  LeaveRequest,
  LeaveBalance,
  EmployeeFinance,
  BankDetails,
  EmployeeSkill,
  Holiday,
};

export default {
  sequelize,
  User,
  Employee,
  Project,
  Team,
  TeamMember,
  Attendance,
  LeaveRequest,
  LeaveBalance,
  EmployeeFinance,
  BankDetails,
  EmployeeSkill,
  Holiday,
};

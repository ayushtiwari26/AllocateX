import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LeaveRequestAttributes {
  id: string;
  employeeId: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'wfh' | 'on-duty' | 'unpaid';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId: string | null;
  approverRemarks: string | null;
  approvedAt: Date | null;
  totalDays: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LeaveRequestCreationAttributes = Optional<LeaveRequestAttributes, 'id' | 'status' | 'approverId' | 'approverRemarks' | 'approvedAt' | 'createdAt' | 'updatedAt'>;

class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
  public id!: string;
  public employeeId!: string;
  public leaveType!: 'casual' | 'sick' | 'earned' | 'wfh' | 'on-duty' | 'unpaid';
  public startDate!: Date;
  public endDate!: Date;
  public reason!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  public approverId!: string | null;
  public approverRemarks!: string | null;
  public approvedAt!: Date | null;
  public totalDays!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
    },
    leaveType: {
      type: DataTypes.ENUM('casual', 'sick', 'earned', 'wfh', 'on-duty', 'unpaid'),
      allowNull: false,
      field: 'leave_type',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending',
    },
    approverId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approver_id',
    },
    approverRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'approver_remarks',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    totalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_days',
    },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    underscored: true,
  }
);

export default LeaveRequest;

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface LeaveBalanceAttributes {
  id: string;
  employeeId: string;
  year: number;
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  unpaidLeave: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LeaveBalanceCreationAttributes = Optional<LeaveBalanceAttributes, 'id' | 'casualLeave' | 'sickLeave' | 'earnedLeave' | 'unpaidLeave' | 'createdAt' | 'updatedAt'>;

class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes> implements LeaveBalanceAttributes {
  public id!: string;
  public employeeId!: string;
  public year!: number;
  public casualLeave!: number;
  public sickLeave!: number;
  public earnedLeave!: number;
  public unpaidLeave!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveBalance.init(
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
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    casualLeave: {
      type: DataTypes.INTEGER,
      defaultValue: 12,
      field: 'casual_leave',
    },
    sickLeave: {
      type: DataTypes.INTEGER,
      defaultValue: 12,
      field: 'sick_leave',
    },
    earnedLeave: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      field: 'earned_leave',
    },
    unpaidLeave: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'unpaid_leave',
    },
  },
  {
    sequelize,
    tableName: 'leave_balances',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'year'],
      },
    ],
  }
);

export default LeaveBalance;

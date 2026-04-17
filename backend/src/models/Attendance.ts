import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AttendanceAttributes {
  id: string;
  employeeId: string;
  date: Date;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  clockInLocation: {
    latitude: number;
    longitude: number;
  } | null;
  clockOutLocation: {
    latitude: number;
    longitude: number;
  } | null;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'wfh' | 'on-duty';
  totalHours: number | null;
  remarks: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AttendanceCreationAttributes = Optional<AttendanceAttributes, 'id' | 'clockInTime' | 'clockOutTime' | 'clockInLocation' | 'clockOutLocation' | 'totalHours' | 'remarks' | 'createdAt' | 'updatedAt'>;

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: string;
  public employeeId!: string;
  public date!: Date;
  public clockInTime!: Date | null;
  public clockOutTime!: Date | null;
  public clockInLocation!: { latitude: number; longitude: number } | null;
  public clockOutLocation!: { latitude: number; longitude: number } | null;
  public status!: 'present' | 'absent' | 'half-day' | 'leave' | 'wfh' | 'on-duty';
  public totalHours!: number | null;
  public remarks!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    clockInTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'clock_in_time',
    },
    clockOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'clock_out_time',
    },
    clockInLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'clock_in_location',
    },
    clockOutLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'clock_out_location',
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'half-day', 'leave', 'wfh', 'on-duty'),
      defaultValue: 'absent',
    },
    totalHours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      field: 'total_hours',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'attendance',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'date'],
      },
    ],
  }
);

export default Attendance;

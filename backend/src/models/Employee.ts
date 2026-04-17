import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmployeeAttributes {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfJoining: Date;
  designation: string;
  department: string;
  reportingManagerId: string | null;
  currentWorkload: number;
  maxCapacity: number;
  velocity: number;
  availability: 'available' | 'partially-available' | 'unavailable';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EmployeeCreationAttributes = Optional<EmployeeAttributes, 'id' | 'phone' | 'reportingManagerId' | 'currentWorkload' | 'maxCapacity' | 'velocity' | 'availability' | 'isActive' | 'createdAt' | 'updatedAt'>;

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public id!: string;
  public userId!: string;
  public employeeCode!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string | null;
  public dateOfJoining!: Date;
  public designation!: string;
  public department!: string;
  public reportingManagerId!: string | null;
  public currentWorkload!: number;
  public maxCapacity!: number;
  public velocity!: number;
  public availability!: 'available' | 'partially-available' | 'unavailable';
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Associations
  public readonly skills?: any;
  public readonly teamMemberships?: any;
}

Employee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    employeeCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'employee_code',
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfJoining: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date_of_joining',
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reportingManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reporting_manager_id',
    },
    currentWorkload: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_workload',
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      defaultValue: 40,
      field: 'max_capacity',
    },
    velocity: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    availability: {
      type: DataTypes.ENUM('available', 'partially-available', 'unavailable'),
      defaultValue: 'available',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'employees',
    underscored: true,
  }
);

export default Employee;

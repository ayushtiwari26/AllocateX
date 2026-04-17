import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface EmployeeFinanceAttributes {
  id: string;
  employeeId: string;
  salaryMode: 'monthly' | 'hourly';
  baseSalary: number;
  currency: string;
  paymentMethod: 'bank-transfer' | 'cheque' | 'cash' | 'upi';
  ctcAmount: number | null;
  hra: number | null;
  da: number | null;
  allowances: number | null;
  pfNumber: string | null;
  uanNumber: string | null;
  pfStatus: 'active' | 'inactive' | 'not-applicable';
  employerPfContribution: number | null;
  employeePfContribution: number | null;
  esiNumber: string | null;
  ptState: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class EmployeeFinance extends Model<EmployeeFinanceAttributes> implements EmployeeFinanceAttributes {
  public id!: string;
  public employeeId!: string;
  public salaryMode!: 'monthly' | 'hourly';
  public baseSalary!: number;
  public currency!: string;
  public paymentMethod!: 'bank-transfer' | 'cheque' | 'cash' | 'upi';
  public ctcAmount!: number | null;
  public hra!: number | null;
  public da!: number | null;
  public allowances!: number | null;
  public pfNumber!: string | null;
  public uanNumber!: string | null;
  public pfStatus!: 'active' | 'inactive' | 'not-applicable';
  public employerPfContribution!: number | null;
  public employeePfContribution!: number | null;
  public esiNumber!: string | null;
  public ptState!: string | null;
  public panNumber!: string | null;
  public aadhaarNumber!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeFinance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'employee_id',
    },
    salaryMode: {
      type: DataTypes.ENUM('monthly', 'hourly'),
      defaultValue: 'monthly',
      field: 'salary_mode',
    },
    baseSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'base_salary',
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    paymentMethod: {
      type: DataTypes.ENUM('bank-transfer', 'cheque', 'cash', 'upi'),
      defaultValue: 'bank-transfer',
      field: 'payment_method',
    },
    ctcAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'ctc_amount',
    },
    hra: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    da: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    allowances: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    pfNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pf_number',
    },
    uanNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'uan_number',
    },
    pfStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'not-applicable'),
      defaultValue: 'not-applicable',
      field: 'pf_status',
    },
    employerPfContribution: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'employer_pf_contribution',
    },
    employeePfContribution: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'employee_pf_contribution',
    },
    esiNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'esi_number',
    },
    ptState: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pt_state',
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pan_number',
    },
    aadhaarNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'aadhaar_number',
    },
  },
  {
    sequelize,
    tableName: 'employee_finance',
    underscored: true,
  }
);

export default EmployeeFinance;

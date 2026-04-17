import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface BankDetailsAttributes {
  id: string;
  employeeId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  branch: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class BankDetails extends Model<BankDetailsAttributes> implements BankDetailsAttributes {
  public id!: string;
  public employeeId!: string;
  public bankName!: string;
  public accountNumber!: string;
  public ifscCode!: string;
  public accountHolderName!: string;
  public branch!: string | null;
  public isPrimary!: boolean;
  public isVerified!: boolean;
  public verifiedBy!: string | null;
  public verifiedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BankDetails.init(
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
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'bank_name',
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'account_number',
    },
    ifscCode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'ifsc_code',
    },
    accountHolderName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'account_holder_name',
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_primary',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'verified_by',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
  },
  {
    sequelize,
    tableName: 'bank_details',
    underscored: true,
  }
);

export default BankDetails;

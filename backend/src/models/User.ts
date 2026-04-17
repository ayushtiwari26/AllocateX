import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'manager' | 'team_lead' | 'employee';
  organizationId: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'isActive' | 'displayName' | 'photoURL' | 'organizationId' | 'createdAt' | 'updatedAt'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public firebaseUid!: string;
  public email!: string;
  public displayName!: string | null;
  public photoURL!: string | null;
  public role!: 'admin' | 'manager' | 'team_lead' | 'employee';
  public organizationId!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Association
  public readonly employee?: any;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firebaseUid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'firebase_uid',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'display_name',
    },
    photoURL: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'photo_url',
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'team_lead', 'employee'),
      allowNull: false,
      defaultValue: 'employee',
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organization_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
  }
);

export default User;

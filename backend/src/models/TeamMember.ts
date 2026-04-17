import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Team from './Team';
import Employee from './Employee';

export interface TeamMemberAttributes {
  id?: string;
  teamId: string;
  employeeId: string;
  role: string;
  allocationPercentage?: number;
  joinedAt?: Date;
  leftAt?: Date | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  team?: Team;
  employee?: Employee;
}

class TeamMember extends Model<TeamMemberAttributes> implements TeamMemberAttributes {
  public id!: string;
  public teamId!: string;
  public employeeId!: string;
  public role!: string;
  public allocationPercentage!: number;
  public joinedAt!: Date;
  public leftAt!: Date | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public team?: Team;
  public employee?: Employee;
}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'team_id',
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    allocationPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'allocation_percentage',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'team_members',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['team_id', 'employee_id'],
      },
    ],
  }
);

export default TeamMember;

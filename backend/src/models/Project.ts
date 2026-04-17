import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectAttributes {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date | null;
  managerId: string;
  requirements: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectCreationAttributes = Optional<ProjectAttributes, 'id' | 'description' | 'status' | 'endDate' | 'requirements' | 'priority' | 'createdAt' | 'updatedAt'>;

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public status!: 'active' | 'on-hold' | 'completed' | 'cancelled';
  public startDate!: Date;
  public endDate!: Date | null;
  public managerId!: string;
  public requirements!: string | null;
  public priority!: 'low' | 'medium' | 'high' | 'critical';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'on-hold', 'completed', 'cancelled'),
      defaultValue: 'active',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date',
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'manager_id',
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
  },
  {
    sequelize,
    tableName: 'projects',
    underscored: true,
  }
);

export default Project;

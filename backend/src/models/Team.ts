import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TeamAttributes {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  leadId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TeamCreationAttributes = Optional<TeamAttributes, 'id' | 'description' | 'leadId' | 'createdAt' | 'updatedAt'>;

class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  public id!: string;
  public projectId!: string;
  public name!: string;
  public description!: string | null;
  public leadId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Team.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'lead_id',
    },
  },
  {
    sequelize,
    tableName: 'teams',
    underscored: true,
  }
);

export default Team;

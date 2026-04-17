#!/bin/bash

# Create Team model
cat > src/models/Team.ts << 'EOF'
import { Model, DataTypes } from 'sequelize';
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

class Team extends Model<TeamAttributes> implements TeamAttributes {
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
EOF

# Create TeamMember model
cat > src/models/TeamMember.ts << 'EOF'
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface TeamMemberAttributes {
  id: string;
  teamId: string;
  employeeId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class TeamMember extends Model<TeamMemberAttributes> implements TeamMemberAttributes {
  public id!: string;
  public teamId!: string;
  public employeeId!: string;
  public role!: string;
  public joinedAt!: Date;
  public leftAt!: Date | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
  }
);

export default TeamMember;
EOF

echo "Models created successfully"

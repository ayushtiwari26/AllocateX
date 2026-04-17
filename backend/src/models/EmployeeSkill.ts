import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmployeeSkillAttributes {
  id: string;
  employeeId: string;
  skillName: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EmployeeSkillCreationAttributes = Optional<EmployeeSkillAttributes, 'id' | 'proficiency' | 'yearsOfExperience' | 'createdAt' | 'updatedAt'>;

class EmployeeSkill extends Model<EmployeeSkillAttributes, EmployeeSkillCreationAttributes> implements EmployeeSkillAttributes {
  public id!: string;
  public employeeId!: string;
  public skillName!: string;
  public proficiency!: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  public yearsOfExperience!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmployeeSkill.init(
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
    skillName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'skill_name',
    },
    proficiency: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      defaultValue: 'intermediate',
    },
    yearsOfExperience: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 0,
      field: 'years_of_experience',
    },
  },
  {
    sequelize,
    tableName: 'employee_skills',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'skill_name'],
      },
    ],
  }
);

export default EmployeeSkill;

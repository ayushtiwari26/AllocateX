import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface HolidayAttributes {
  id: string;
  name: string;
  date: Date;
  type: 'national' | 'optional' | 'restricted';
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Holiday extends Model<HolidayAttributes> implements HolidayAttributes {
  public id!: string;
  public name!: string;
  public date!: Date;
  public type!: 'national' | 'optional' | 'restricted';
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Holiday.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('national', 'optional', 'restricted'),
      defaultValue: 'national',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'holidays',
    underscored: true,
  }
);

export default Holiday;

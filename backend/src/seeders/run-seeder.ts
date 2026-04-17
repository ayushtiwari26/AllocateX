import { sequelize } from '../models';
import { seedDemoData } from './demo-data';

const runSeeder = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    console.log('🔄 Syncing models...');
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables!
    console.log('✓ Models synced');

    console.log('🔄 Seeding demo data...');
    await seedDemoData();
    
    console.log('✅ All done! Database is ready with demo data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

runSeeder();

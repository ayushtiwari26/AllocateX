import { sequelize } from '../models';
import { seedDemoData } from './demo-data';
import { seedFromKeka } from './keka-seed';

const useKeka = process.argv.includes('--keka') || process.env.SEED_SOURCE === 'keka' || true; // keka is now the default

const runSeeder = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    console.log('🔄 Syncing models...');
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables!
    console.log('✓ Models synced');

    if (useKeka) {
      console.log('🔄 Seeding from Keka snapshot + GitLab...');
      const result = await seedFromKeka({ wipeExisting: true });
      console.log('✓ Seed result:', result);
    } else {
      console.log('🔄 Seeding legacy demo data...');
      await seedDemoData();
    }

    console.log('✅ All done! Database is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

runSeeder();

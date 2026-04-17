import { User, Employee } from '../models';
import sequelize from '../config/database';

async function createKaUser() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Check if user exists
    let user = await User.findOne({ where: { email: 'ka@gmail.com' } });

    if (user) {
      console.log('✓ User ka@gmail.com already exists');
      const employee = await Employee.findOne({ where: { userId: user.id } });
      console.log('User ID:', user.id);
      console.log('Employee:', employee ? 'Yes' : 'No');
      return;
    }

    // Create user
    user = await User.create({
      firebaseUid: 'ka-firebase-uid',
      email: 'ka@gmail.com',
      displayName: 'KA User',
      role: 'admin',
      isActive: true,
    });

    console.log('✓ Created user ka@gmail.com');

    // Create employee profile
    const employee = await Employee.create({
      userId: user.id,
      employeeCode: 'EMP999',
      firstName: 'KA',
      lastName: 'User',
      email: 'ka@gmail.com',
      phone: '+1234567890',
      dateOfJoining: new Date(),
      designation: 'System Administrator',
      department: 'IT',
      currentWorkload: 0,
      maxCapacity: 40,
      velocity: 10,
      availability: 'available',
      isActive: true,
    });

    console.log('✓ Created employee profile for ka@gmail.com');
    console.log('User ID:', user.id);
    console.log('Employee ID:', employee.id);
    console.log('\n✅ ka@gmail.com setup complete!');
    console.log('Login with: ka@gmail.com / ayushtiwari');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createKaUser();

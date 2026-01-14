/**
 * Database Seed Script
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user (john@doe.com / johndoe123)
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'USER',
    },
  });

  console.log('✅ Test user created:', testUser.email);

  // Create admin user (admin@bao.ai / BaoAdmin2024!)
  const adminPassword = await bcrypt.hash('BaoAdmin2024!', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bao.ai' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@bao.ai',
      password: adminPassword,
      name: 'BAO Admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create super admin user (superadmin@bao.ai / BaoSuper2024!)
  const superAdminPassword = await bcrypt.hash('BaoSuper2024!', 12);
  
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@bao.ai' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'superadmin@bao.ai',
      password: superAdminPassword,
      name: 'BAO Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin user created:', superAdminUser.email);

  // Create a sample project
  const sampleProject = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: 'Sample Sci-Fi Short',
      description: 'A futuristic story about AI and humanity',
      userId: testUser.id,
    },
  });

  console.log('✅ Sample project created:', sampleProject.name);

  // Create sample scenes
  const scene1 = await prisma.scene.upsert({
    where: { id: 'sample-scene-1' },
    update: {},
    create: {
      id: 'sample-scene-1',
      name: 'Opening Scene',
      description: 'Establishing shot of the futuristic city',
      order: 0,
      projectId: sampleProject.id,
    },
  });

  const scene2 = await prisma.scene.upsert({
    where: { id: 'sample-scene-2' },
    update: {},
    create: {
      id: 'sample-scene-2',
      name: 'Character Introduction',
      description: 'Meet the protagonist in their workspace',
      order: 1,
      projectId: sampleProject.id,
    },
  });

  console.log('✅ Sample scenes created');

  // Create sample shots
  await prisma.shot.upsert({
    where: { id: 'sample-shot-1' },
    update: {},
    create: {
      id: 'sample-shot-1',
      sceneId: scene1.id,
      prompt: 'Wide aerial shot of a futuristic city with flying cars and neon lights at dusk',
      order: 0,
    },
  });

  await prisma.shot.upsert({
    where: { id: 'sample-shot-2' },
    update: {},
    create: {
      id: 'sample-shot-2',
      sceneId: scene1.id,
      prompt: 'Close-up of holographic advertisements floating in the air',
      order: 1,
    },
  });

  console.log('✅ Sample shots created');

  console.log('\n🎉 Database seed completed!');
  console.log('\n📝 Account Credentials:');
  console.log('\n   👤 Regular User:');
  console.log('      Email: john@doe.com');
  console.log('      Password: johndoe123');
  console.log('\n   🔑 Admin User:');
  console.log('      Email: admin@bao.ai');
  console.log('      Password: BaoAdmin2024!');
  console.log('\n   👑 Super Admin:');
  console.log('      Email: superadmin@bao.ai');
  console.log('      Password: BaoSuper2024!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

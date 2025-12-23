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
    },
  });

  console.log('✅ Test user created:', testUser.email);

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
  console.log('\n📝 Test account credentials:');
  console.log('   Email: john@doe.com');
  console.log('   Password: johndoe123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestCategory() {
  try {
    // Check if test category exists
    const existing = await prisma.forum_categories.findFirst({
      where: { slug: 'test' }
    });

    if (existing) {
      console.log('Test category already exists:', existing);
      return;
    }

    // Create test category
    const category = await prisma.forum_categories.create({
      data: {
        name: 'Test',
        slug: 'test',
        description: 'Test kategori for utvikling',
        color: '#4CAF50',
        icon: '🧪',
        sortOrder: 999,
        isActive: true
      }
    });

    console.log('Created test category:', category);
  } catch (error) {
    console.error('Error creating test category:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCategory();
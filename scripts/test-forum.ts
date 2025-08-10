import { prisma } from '@/services/prisma'

async function testForum() {
  console.log('Testing forum database setup...')
  
  try {
    // Test if forum_categories table exists
    const categories = await prisma.forum_categories.findMany()
    console.log('✅ forum_categories table exists, found', categories.length, 'categories')
    
    // Test if forum_posts table exists
    const posts = await prisma.forum_posts.count()
    console.log('✅ forum_posts table exists, found', posts, 'posts')
    
    // Test if forum_reactions table exists
    const reactions = await prisma.forum_reactions.count()
    console.log('✅ forum_reactions table exists, found', reactions, 'reactions')
    
    // Test if forum_tags table exists
    const tags = await prisma.forum_tags.count()
    console.log('✅ forum_tags table exists, found', tags, 'tags')
    
    // Create a test category if none exist
    if (categories.length === 0) {
      console.log('\nCreating test categories...')
      
      const testCategories = [
        {
          name: 'Generell diskusjon',
          slug: 'generell',
          description: 'Generelle samtaler om hest og stall',
          color: '#3B82F6',
          icon: 'comments',
          sortOrder: 1,
        },
        {
          name: 'Spørsmål og svar',
          slug: 'sporsmal',
          description: 'Stil spørsmål og få svar fra fellesskapet',
          color: '#10B981',
          icon: 'question-circle',
          sortOrder: 2,
        },
        {
          name: 'Tips og råd',
          slug: 'tips',
          description: 'Del dine beste tips og råd',
          color: '#F59E0B',
          icon: 'lightbulb',
          sortOrder: 3,
        },
        {
          name: 'Kjøp og salg',
          slug: 'kjop-salg',
          description: 'Markedsplass for hesteutstyr',
          color: '#EF4444',
          icon: 'shopping-cart',
          sortOrder: 4,
        },
      ]
      
      for (const cat of testCategories) {
        await prisma.forum_categories.create({ data: cat })
        console.log('Created category:', cat.name)
      }
    }
    
    console.log('\n✅ All forum tables are working correctly!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testForum()
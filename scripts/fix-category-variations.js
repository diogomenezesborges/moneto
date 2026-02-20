/**
 * Fix category name variations in existing transaction data
 * Corrects case sensitivity issues and typos
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Mapping of incorrect names to correct names
const MAJOR_FIXES = {
  'Custos fixos': 'Custos Fixos',
  Poupança: null, // This is not a major category
  '#N/A': null,
}

const CATEGORY_FIXES = {
  Poupança: 'Poupança', // Correct to standard Poupança
  '#N/A': null,
}

const SUB_FIXES = {
  'Enxoval maternidade': 'Enxoval Maternidade',
  'Lentes de contacto': 'Lentes de Contacto/oculos',
  Monetário: 'Monetário', // Already correct
  OLX: 'Olx',
  olx: 'Olx',
  'Transporte público': 'Transporte Público',
  'jogo brides': 'Jogo Brides',
  'seguro voluntariado': 'Seguro voluntariado',
  'Atividades lúdicas': 'Atividades Lúdicas',
}

async function fixCategoryVariations() {
  console.log('🔧 Fixing category name variations...\n')

  let fixedCount = 0

  // Fix Major Category variations
  console.log('Fixing Major Categories...')
  for (const [incorrect, correct] of Object.entries(MAJOR_FIXES)) {
    const count = await prisma.transaction.updateMany({
      where: { majorCategory: incorrect },
      data: { majorCategory: correct },
    })
    if (count.count > 0) {
      console.log(
        `  ✓ "${incorrect}" → ${correct ? `"${correct}"` : 'NULL'}: ${count.count} transactions`
      )
      fixedCount += count.count
    }
  }

  // Fix Category variations
  console.log('\nFixing Categories...')
  for (const [incorrect, correct] of Object.entries(CATEGORY_FIXES)) {
    const count = await prisma.transaction.updateMany({
      where: { category: incorrect },
      data: { category: correct },
    })
    if (count.count > 0) {
      console.log(
        `  ✓ "${incorrect}" → ${correct ? `"${correct}"` : 'NULL'}: ${count.count} transactions`
      )
      fixedCount += count.count
    }
  }

  // Fix SubCategory variations
  console.log('\nFixing SubCategories...')
  for (const [incorrect, correct] of Object.entries(SUB_FIXES)) {
    const count = await prisma.transaction.updateMany({
      where: { subCategory: incorrect },
      data: { subCategory: correct },
    })
    if (count.count > 0) {
      console.log(`  ✓ "${incorrect}" → "${correct}": ${count.count} transactions`)
      fixedCount += count.count
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} category name variations`)
  console.log('\n💡 Now run backfill script again to populate IDs for corrected categories')
}

fixCategoryVariations()
  .catch(e => {
    console.error('❌ Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

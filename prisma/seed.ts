import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const categories = [
    { name: 'Ichimliklar', slug: 'drinks', emoji: '🥤', sortOrder: 1 },
    { name: 'Yeguliklar', slug: 'foods', emoji: '🍔', sortOrder: 2 },
    { name: 'Shirinliklar', slug: 'sweets', emoji: '🍰', sortOrder: 3 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const drinks = await prisma.category.findUnique({ where: { slug: 'drinks' } });
  const foods = await prisma.category.findUnique({ where: { slug: 'foods' } });
  const sweets = await prisma.category.findUnique({ where: { slug: 'sweets' } });

  const products = [
    {
      slug: 'coca-cola-05',
      name: 'Coca Cola 0.5L',
      price: 12000,
      categoryId: drinks!.id,
      imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600',
      description: 'Sovuq Coca Cola, gazli ichimlik. Hajmi: 0.5 litr.',
    },
    {
      slug: 'fanta-05',
      name: 'Fanta 0.5L',
      price: 12000,
      categoryId: drinks!.id,
      imageUrl: 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=600',
      description: 'Apelsin lazzatli gazli ichimlik. Hajmi: 0.5 litr.',
    },
    {
      slug: 'apple-juice',
      name: 'Olma sharbati',
      price: 15000,
      categoryId: drinks!.id,
      imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600',
      description: 'Tabiiy olma sharbati, shakar qo\'shilmagan. 1 litr.',
    },
    {
      slug: 'hamburger',
      name: 'Hamburger',
      price: 35000,
      categoryId: foods!.id,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
      description: 'Mol go\'shti kotleti, pomidor, bodring, salat, pishloq, sous, bulochka.',
    },
    {
      slug: 'pizza-margarita',
      name: 'Pizza Margarita',
      price: 75000,
      categoryId: foods!.id,
      imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600',
      description: 'Tomat sousi, mozzarella, rayhon, zaytun moyi. Diametr: 30 sm.',
    },
    {
      slug: 'lavash',
      name: 'Lavash',
      price: 28000,
      categoryId: foods!.id,
      imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600',
      description: 'Tovuq filesi, pomidor, bodring, salat, pishloq, sarimsoq sousi.',
    },
    {
      slug: 'tiramisu',
      name: 'Tiramisu',
      price: 25000,
      categoryId: sweets!.id,
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
      description: 'Mascarpone, savoyardi, kofe, kakao kukuni.',
    },
    {
      slug: 'cheesecake',
      name: 'Cheesecake',
      price: 22000,
      categoryId: sweets!.id,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600',
      description: 'Krem-pishloq, pechene, sariyog\', vanil.',
    },
    {
      slug: 'ice-cream',
      name: 'Muzqaymoq',
      price: 15000,
      categoryId: sweets!.id,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600',
      description: 'Klassik plombir muzqaymog\'i, 100g.',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log('✅ Seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

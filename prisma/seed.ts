import { PrismaClient, CategoryType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
let prisma: PrismaClient;
if (connectionString) {
  const adapter = new PrismaPg({ connectionString });
  prisma = new PrismaClient({ adapter });
}

const globalCategories: Array<{
  name: string;
  icon: string;
  type: CategoryType;
  subCategories: string[];
}> = [
  {
    name: 'Vivienda',
    icon: '🏠',
    type: CategoryType.EXPENSE,
    subCategories: [
      'Alquiler/Hipoteca',
      'Servicios (Luz/Agua)',
      'Internet',
      'Gastos Comunes',
      'Mantenimiento',
    ],
  },
  {
    name: 'Alimentación',
    icon: '🍔',
    type: CategoryType.EXPENSE,
    subCategories: ['Supermercado', 'Restaurantes', 'Café y Snacks', 'Alcohol'],
  },
  {
    name: 'Transporte',
    icon: '🚗',
    type: CategoryType.EXPENSE,
    subCategories: [
      'Gasolina',
      'Uber/Apps',
      'Transporte Público',
      'Mantenimiento Auto',
      'Peajes',
    ],
  },
  {
    name: 'Salud',
    icon: '💊',
    type: CategoryType.EXPENSE,
    subCategories: ['Farmacia', 'Médico', 'Deportes/Gym', 'Cuidado Personal'],
  },
  {
    name: 'Ocio',
    icon: '🍿',
    type: CategoryType.EXPENSE,
    subCategories: ['Suscripciones', 'Salidas', 'Viajes', 'Juegos'],
  },
  {
    name: 'Ingresos',
    icon: '💰',
    type: CategoryType.INCOME,
    subCategories: ['Salario', 'Freelance', 'Inversiones', 'Regalos'],
  },
];

async function main() {
  console.log('🌱 Iniciando seed de Categorías Globales...');

  // 1. Limpiar categorías globales existentes para evitar duplicados al correr el seed varias veces.
  // IMPORTANTE: Esto borra todas las categorías que tengan userId = null.
  await prisma.category.deleteMany({
    where: { userId: null },
  });

  console.log('🧹 Categorías globales antiguas limpiadas.');

  // 2. Crear las nuevas categorías
  for (const cat of globalCategories) {
    // a. Crear Categoría Padre
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        type: cat.type,
        userId: null, // Explícitamente null para que sean globales
      },
    });

    console.log(`📂 Creada categoría global: ${cat.name}`);

    // b. Crear Subcategorías
    if (cat.subCategories.length > 0) {
      const childrenData = cat.subCategories.map((subName) => ({
        name: subName,
        icon: cat.icon,
        type: cat.type,
        userId: null, // También null
        parentId: parent.id,
      }));

      await prisma.category.createMany({
        data: childrenData,
      });
    }
  }

  console.log('✅ Seed de categorías globales finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

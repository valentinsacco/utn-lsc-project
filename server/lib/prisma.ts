// Podría usarse Drizzle ORM en lugar de Prisma

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

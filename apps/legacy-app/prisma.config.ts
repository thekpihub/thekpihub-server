import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://kpihub:kpihub123@localhost:5432/kpihub',
  },
})

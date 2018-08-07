import { Prisma } from 'prisma-binding';
import dotenv from 'dotenv';

/*
 * Use .env.test config file
 */
dotenv.config({ path: '.env.test' });


// eslint-disable-next-line arrow-body-style
const getPrismaTestInstance = () => {
  return new Prisma({
    typeDefs: 'src/database/prisma.graphql',
    endpoint: process.env.PRISMA_ENDPOINT,
    secret: process.env.PRISMA_MANAGEMENT_API_SECRET,
    debug: false,
  });
};

export { getPrismaTestInstance }; // eslint-disable-line

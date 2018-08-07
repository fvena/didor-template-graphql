import { GraphQLServer } from 'graphql-yoga';
import { Prisma } from 'prisma-binding';
import permissions from './application/permissions';
import resolvers from './utils/resolvers';


/*
 * Database config
 */
const db = new Prisma({
  typeDefs: 'src/database/prisma.graphql', // the auto-generated GraphQL schema of the Prisma API
  endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma API (value set in `.env`)
  secret: process.env.PRISMA_MANAGEMENT_API_SECRET, // Secret
  debug: process.env.PRISMA_DEBUG, // log all GraphQL queries & mutations sent to the Prisma API
});


/*
 * Server config
 */
const server = new GraphQLServer({
  typeDefs: 'src/application/schema.graphql',
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false,
  },
  middlewares: [permissions],
  context: req => ({ ...req, db }),
});


/*
 * Status route for ping
 */
server.express.get('/status', (req, res) => {
  res.status(200).send('I am alive!');
});


/*
 * Server options
 */
const serverOptions = {
  port: process.env.APP_PORT,
};


/*
 * Server start
 */
server.start(serverOptions, () => console.log(`The server is running on http://localhost:${process.env.APP_PORT}, enviroment: ${process.env.ENVIROMENT}`)); // eslint-disable-line no-console

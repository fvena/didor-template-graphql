// import { authQueries, authMutations, getUserId } from 'graphql-authentication';
import { getUserId } from '../utils/auth';

const resolvers = {
  Query: {
    posts: async (root, args, context, info) => await context.db.query.posts({}, info),
  },
  Mutation: {
    createPost: async (root, args, context, info) => {
      const userId = getUserId(context);
      return await context.db.mutation.createPost(
        {
          data: {
            ...args,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        },
        info,
      );
    },
  },
};

export default resolvers;

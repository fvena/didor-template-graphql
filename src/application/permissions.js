import { rule, shield, or } from 'graphql-shield';
import { isAuthResolver, getUserId } from '../utils/auth';

const isAuthenticated = rule()(isAuthResolver);

const isKratos = rule()(async (root, args, context) => context.user.role === 'admin');
const isAdvanced = rule()(async (root, args, context) => context.user.role === 'author');
const isBasic = rule()(async (root, args, context) => context.user.role === 'editor');
// const isUser = rule()(async (root, args, context) => context.user.role === 'user');

const isPostOwner = rule()(async (root, args, context) => {
  const postId = args.id;
  const userId = getUserId(context);
  const post = await context.db.exists.Post({
    id: postId,
    user: {
      id: userId,
    },
  });
  return post;
});

const permissions = shield({
  Query: {
    posts: isAuthenticated,
  },
  Mutation: {
    inviteUser: or(isKratos, isAdvanced),
    createPost: isAuthenticated,
    updatePost: or(isKratos, isAdvanced, isPostOwner),
  },
});

export default permissions;

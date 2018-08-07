import { getUserId } from '../../utils/auth';

const Query = {};

Query.currentUser = (parent, args, context, info) => {
  const id = getUserId(context);
  return context.db.query.user({ where: { id } }, info);
};


export { Query }; // eslint-disable-line

/*
 * Return user data
 */
// eslint-disable-next-line arrow-body-style
const user = async (root, args, context, info) => {
  return await context.db.query.user({ where: { id: root.user.id } }, info);
};

export default user;

/*
 * Add rol to user
 */
// eslint-disable-next-line arrow-body-style
const createUserRole = async (root, args, context, info) => {
  return await context.db.mutation.createUserRole({
    data: {
      user: {
        connect: {
          id: args.userId,
        },
      },
      role: {
        connect: {
          id: args.roleId,
        },
      },
    },
  }, info);
};


/*
 * Find role id by role name
 */
const findRoleIdByName = async (context, roleName) => {
  const roles = await context.db.query.roles({ where: { name: roleName } }, '{ id }');
  return roles[0].id;
};


// eslint-disable-next-line arrow-body-style
const userRoleExists = async (context, args) => {
  return await context.db.exists.UserRole({
    user: {
      id: args.userId,
    },
    role: {
      id: args.roleId,
    },
  });
};


// eslint-disable-next-line arrow-body-style
const getUserRoles = async (context, userId) => {
  return await context.db.query.userRoles({
    where: { user: { id: userId } },
  }, '{ role { name, id }}');
};


export {
  createUserRole,
  findRoleIdByName,
  userRoleExists,
  getUserRoles,
};

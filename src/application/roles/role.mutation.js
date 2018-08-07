import { createUserRole, findRoleIdByName, userRoleExists } from '../../utils/roles';
import { findUserByEmail } from '../../utils/auth';

const Mutation = {};


Mutation.createRole = async (root, args, context, info) => await context.db.mutation.createRole({
  data: args,
}, info);


Mutation.assignRole = async (root, args, context) => {
  const roleId = await findRoleIdByName(context, args.role);
  const user = await findUserByEmail(context, args.assigneeEmail);
  const userId = user.id;
  const userRoleExistsRes = await userRoleExists(context, {
    userId,
    roleId,
  });
  if (userRoleExistsRes) {
    throw new Error(`${args.assigneeEmail} already has ${args.role} rights`);
  }
  return await createUserRole(root, {
    userId,
    roleId,
  }, context);
};


export { Mutation }; // eslint-disable-line

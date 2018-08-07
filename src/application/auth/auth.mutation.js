import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import validator from 'validator';
import { v4 as uuid } from 'uuid';
import { createUserRole, findRoleIdByName, getUserRoles } from '../../utils/roles';
import { findUserByEmail, getUser } from '../../utils/auth';

const Mutation = {};


/*
 * Validate Password format:
 *  - At least six characters
 *  - At least one number
 *  - At least one uppercase
 *  - At least one lowercase
 */
function validatePassword(password) {
  const regNumer = /[0-9]/;
  const regLowerCase = /[a-z]/;
  const regUpperCase = /[A-Z]/;

  if (password.length < 6) { throw new Error('Password must contain at least six characters!'); }
  if (!regNumer.test(password)) { throw new Error('Password must contain at least one number (0-9)!'); }
  if (!regLowerCase.test(password)) { throw new Error('Password must contain at least one lowercase letter (a-z)!'); }
  if (!regUpperCase.test(password)) { throw new Error('Password must contain at least one uppercase letter (A-Z)!'); }
}


/*
 * Get hashed Password
 */
function getHashedPassword(password) {
  return bcrypt.hash(password, 10);
}


/*
 * Generate new Token
 */
function generateToken(user) {
  return jwt.sign({ userId: user.id }, process.env.APP_SECRET);
}


/*
 * Create new User
 */
Mutation.signup = async (root, args, context) => {
  // Validate email
  if (!validator.isEmail(args.email)) {
    throw new Error('Given email is invalid.');
  }


  // Check if email is used in Database
  const userExists = await context.db.exists.User({ email: args.email });

  if (userExists) {
    throw new Error('User already exists with this email.');
  }


  // Validate password
  validatePassword(args.password);


  // Create new User
  const newUser = await context.db.mutation.createUser({
    data: {
      name: args.name,
      email: args.email,
      password: await getHashedPassword(args.password),
      emailConfirmToken: await uuid(),
      emailConfirmed: false,
      inviteAccepted: true,
      joinedAt: new Date().toISOString(),
    },
  });


  // Assign default USER role
  const roleId = await findRoleIdByName(context, 'BASIC');

  await createUserRole(root, {
    userId: newUser.id,
    roleId,
  }, context);


  // Send Email
  // if (context.graphqlAuthentication.mailer) {
  //   context.graphqlAuthentication.mailer.send({
  //     template: 'signupUser',
  //     message: {
  //       to: newUser.email
  //     },
  //     locals: {
  //       mailAppUrl: context.graphqlAuthentication.mailAppUrl,
  //       emailConfirmToken,
  //       email: newUser.email
  //     }
  //   });
  // }


  return {
    user: newUser,
    roles: await getUserRoles(context, newUser.id),
  };
};


Mutation.signupByInvite = async (root, args, context) => {
  // Important first check, because i.e. the `inviteToken` could be an empty string
  // and in that case the find query beneath would find any user with any given email,
  // allowing you to change the password of everybody.
  if (!args.inviteToken || !args.email) {
    throw new Error('Not all required fields are filled in.');
  }

  // Get User
  const user = await findUserByEmail(context, args.email);

  // Check if user exists
  if (!user) {
    throw new Error('No user found.');
  }

  // Check if inviteToken is valid
  if (user.inviteToken !== args.inviteToken || user.inviteAccepted) {
    throw new Error('inviteToken is invalid.');
  }


  // Validate password
  validatePassword(args.password);


  // Create new User
  const updatedUser = await context.db.mutation.updateUser({
    where: { id: user.id },
    data: {
      name: args.name,
      password: await getHashedPassword(args.password),
      inviteToken: '',
      inviteAccepted: true,
    },
  });


  return {
    user: updatedUser,
    roles: await getUserRoles(context, updatedUser.id),
  };
};


/*
 * Confirm user email
 */
Mutation.confirmEmail = async (root, args, context) => {
  if (!args.emailConfirmToken || !args.email) {
    throw new Error('Not all required fields are filled in.');
  }

  // Get User
  const user = await findUserByEmail(context, args.email);


  // Check if user exists
  if (!user) {
    throw new Error('No user found.');
  }

  // Check if email token is valid
  if (user.emailConfirmToken !== args.emailConfirmToken || user.emailConfirmed) {
    throw new Error('Email confirm token is invalid.');
  }

  // Update state of User
  const updateUser = await context.db.mutation.updateUser({
    where: { email: args.email },
    data: {
      emailConfirmed: true,
      emailConfirmToken: '',
    },
  });

  return {
    user: updateUser,
    roles: await getUserRoles(context, updateUser.id),
  };
};


/*
 * Login User
 */
Mutation.login = async (root, args, context) => {
  // Get User
  const user = await findUserByEmail(context, args.email);


  // Check if user exists
  if (!user) {
    throw new Error('No user found.');
  }

  // Check if user has accepted invitation
  if (!user.inviteAccepted) {
    throw new Error('User has not accepted invite yet.');
  }

  // Check if user has been confirmed email
  if (!user.emailConfirmed) {
    throw new Error('Users email has not been confirmed yet.');
  }


  // Validate password
  const valid = await bcrypt.compare(args.password, user.password);

  if (!valid) {
    throw new Error('No user found.');
  }

  // Update User last login
  // Purposefully async, this update doesn't matter that much.
  context.db.mutation.updateUser({
    where: { id: user.id },
    data: { lastLogin: new Date().toISOString() },
  });

  return {
    token: generateToken(user),
    user,
    roles: await getUserRoles(context, user.id),
  };
};


/*
 * Invite user
 */
Mutation.inviteUser = async (root, args, context) => {
  // In permissions file, check only advanced user can invite other user

  // Check valid email
  if (!validator.isEmail(args.email)) {
    throw new Error('Given email is invalid.');
  }


  // Get User
  const userExists = await context.db.exists.User({ email: args.email });

  // Check if user exists
  if (userExists) {
    throw new Error('User already exists with this email.');
  }


  // Create new User
  const newUser = await context.db.mutation.createUser({
    data: {
      name: '',
      password: '',
      email: args.email,
      inviteToken: uuid(),
      inviteAccepted: false,
      joinedAt: new Date().toISOString(),
    },
  });


  // Assign default USER role
  const roleId = await findRoleIdByName(context, 'BASIC');

  await createUserRole(root, {
    userId: newUser.id,
    roleId,
  }, context);


  // Send Email
  // if (ctx.graphqlAuthentication.mailer) {
  //   ctx.graphqlAuthentication.mailer.send({
  //     template: 'inviteUser',
  //     message: {
  //       to: newUser.email
  //     },
  //     locals: {
  //       mailAppUrl: ctx.graphqlAuthentication.mailAppUrl,
  //       inviteToken,
  //       email: newUser.email
  //     }
  //   });
  // }

  return {
    id: newUser.id,
  };
};


Mutation.changePassword = async (root, args, context) => {
  // Get loged user
  const user = await getUser(context);

  // Check is old password is valid
  const valid = await bcrypt.compare(args.oldPassword, user.password);

  if (!valid) {
    throw new Error('Invalid old password.');
  }

  // Validate password
  validatePassword(args.newPassword);


  // Update state of User
  const updateUser = await context.db.mutation.updateUser({
    where: { id: user.id },
    data: {
      password: await getHashedPassword(args.newPassword),
    },
  });

  return {
    id: updateUser.id,
  };
};


/*
 * Update data of current user
 */
Mutation.updateCurrentUser = async (root, args, context) => {
  // Get loged user
  const user = await getUser(context);

  // Update User last login
  const updateUser = await context.db.mutation.updateUser({
    where: { id: user.id },
    data: {
      name: args.name,
      email: args.email,
    },
  });

  return updateUser;
};


/*
 * Send email to reset user password
 */
Mutation.triggerPasswordReset = async (root, args, context) => {
  // Check valid email
  if (!validator.isEmail(args.email)) {
    throw new Error('Given email is invalid.');
  }

  // Get User
  const user = await findUserByEmail(context, args.email);


  // Check if user exists
  // For security reasons we should not indicate if the email exists
  if (!user) {
    return { ok: true };
  }


  // Reset token expires in two hours
  const now = new Date();
  const resetExpires = new Date(now.getTime() + 7200000).toISOString();

  // Update User last login
  const updateUser = await context.db.mutation.updateUser({
    where: { id: user.id },
    data: {
      resetToken: uuid(),
      resetExpires,
    },
  });


  // if (ctx.graphqlAuthentication.mailer) {
  //   ctx.graphqlAuthentication.mailer.send({
  //     template: 'passwordReset',
  //     message: {
  //       to: user.email
  //     },
  //     locals: {
  //       mailAppUrl: ctx.graphqlAuthentication.mailAppUrl,
  //       resetToken,
  //       email
  //     }
  //   });
  // }

  return { ok: true };
};


/*
 * Reset user password
 */
Mutation.passwordReset = async (root, args, context) => {
  // Check if send all data
  if (!args.resetToken || !args.password) {
    throw new Error('Not all required fields are filled in.');
  }

  // Get User
  const user = await findUserByEmail(context, args.email);


  // Check if user exists and user has restexpire value and reset token is valid
  if (!user || !user.resetExpires || user.resetToken !== args.resetToken) {
    throw new Error('No user found.');
  }

  // Check if reset has expired
  if (new Date() > new Date(user.resetExpires)) {
    throw new Error('Reset Token has expired.');
  }

  // Validate password
  validatePassword(args.password);


  // Update state of User
  const updateUser = await context.db.mutation.updateUser({
    where: { id: user.id },
    data: {
      resetToken: '',
      resetExpires: undefined,
      password: await getHashedPassword(args.password),
    },
  });

  return {
    id: updateUser.id,
  };
};


export { Mutation }; // eslint-disable-line

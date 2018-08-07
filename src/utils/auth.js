import * as jwt from 'jsonwebtoken';

/*
 * Custom Class Error for not authorized request
 */
class AuthError extends Error {
  constructor() {
    super('Not authorized');
  }
}


/*
 * Get user id of the JSON Web token pass in request
 */
const getUserId = (context) => {
  const Authorization = context.request.get('Authorization');

  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    return userId;
  }

  throw new AuthError();
};


/*
 * Get user data loged
 */
const getUser = async (context) => {
  const userId = getUserId(context);

  const users = await context.db.query.users({
    where: {
      id: userId,
    },
  });

  return users[0];
};


/*
 * Get user data by Email
 */
// eslint-disable-next-line arrow-body-style
const findUserByEmail = async (context, userEmail) => {
  const users = await context.db.query.users({
    where: {
      email: userEmail,
    },
  });

  return users[0];
};


/*
 * Check if user is Authenticated
 */
const isAuthResolver = context => !!getUserId(context);


export {
  getUser,
  getUserId,
  findUserByEmail,
  isAuthResolver,
};

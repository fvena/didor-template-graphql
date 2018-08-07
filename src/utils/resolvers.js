import path from 'path';
import { fileLoader, mergeResolvers } from 'merge-graphql-schemas';
import AuthPayload from '../application/auth/AuthPayload';

/**
 * function getResolvers
 * Devuelve un Objeto con todos los resolvers desarrollados para la API
 */
function getResolvers() {
  const querysArray = fileLoader(path.join(__dirname, '../application/**/*.query.js'));
  const mutationsArray = fileLoader(path.join(__dirname, '../application/**/*.mutation.js'));
  const resolversArray = querysArray.concat(mutationsArray);
  const resolvers = mergeResolvers(resolversArray);

  resolvers.AuthPayload = AuthPayload;

  return resolvers;
}

export default getResolvers();

# Autenticación

Librería muy completa para autenticar [GraphQL](https://graphql.org/). Utiliza
el tradicional método de autenticación email/password y jsonwebtokens.


**Características:**

- Registro mediante email/contraseña y email de confirmación.
- Login
- Invitar a otros usuarios (mediante un email)
- Modificar contraseña (cuando olvidamos la contraseña)
- Modificar la contraseña del usuario logueado
- Actualizar la información del usuario logueado
- Soporta permisos con [graphql-shield](https://github.com/maticzav/graphql-shield)

## Motivación

Agregar autenticación de usuario parece simple; hay muchos ejemplos sobre cómo
escribir un resolver para "iniciar sesión" y "registrar un usuario". Lo implementas
en tu proyecto y continúas trabajando. Pasado de un tiempo, los usuarios olvidarán
su contraseña, por lo que tendrás que desarrollar esta funcionalidad. Luego querrás
invitar a usuarios, ... entiendes la idea. Al final, tienes muchos códigos repetitivos
en diferentes proyectos relacionados con la autenticación del usuario.

La intención de esta librería es **escribir el menor código posible relacionado
con la autenticación de un usuario**, a la vez que sea lo suficientemente flexible
como para admitir diferentes casos de uso: inscripción solo mediante invitación,
enviar invitaciones, campos adicionales en el modelo de usuario, etc.

## Instalación

Deberías de usar Node v8+ y puedes usar Yarn or npm:

```
yarn add graphql-authentication
npm i graphql-authentication
```

## Utilización

### Importando el schema

En tu schema GraphQL debes importar los tipos que proporciona el paquete:

```graphql
# import Query.*, Mutation.* from "node_modules/graphql-authentication/schema.graphql"
```

> Esto solo funciona si tu utilizas [graphql-import](https://github.com/prismagraphql/graphql-import).
¡Si tu estas usando graphql-yoga esto funcionará fuera de la caja!

Alternativamente tu puedes importar solamente las queries y resolvers que quieras
exponer, por ejemplo:

```graphql
# import Query.currentUser, Mutation.signupByInvite, Mutation.inviteUser, Mutation.login from "node_modules/graphql-authentication/schema.graphql"
```

## Configuración

Necesitas añadir algunos parámetros para que todo funcione como tu quieras. El
siguiente ejemplo usa [graphql-yoga](https://github.com/graphcool/graphql-yoga/),
pero también debería funcionar con Apollo Server.

```js
import { graphqlAuthenticationConfig } from 'graphql-authentication';
import * as Email from 'email-templates';

const server = new GraphQLServer({
  typeDefs: './schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    graphqlAuthentication: graphqlAuthenticationConfig({
      // Required, see for more info the "Writing an adapter" section on this page
      adapter: new GraphqlAuthenticationSequelizeAdapter(),
      // Required, used for signing JWT tokens
      secret: 'wheredidthesodago',
      // Optional, for sending emails with email-templates (https://www.npmjs.com/package/email-templates)
      mailer: new Email(),
      // Optional, the URL to your frontend which is used in emails
      mailAppUrl: 'http://example.com'
    })
  })
});
```

### Añadiendo los resolvers

Necesitas importar en tu servidor GraphQL los resolvers que incluye este paquete
como se muestra en el ejemplo:

```js
import { authQueries, authMutations } from 'graphql-authentication';

const resolvers = {
  Query: {
    ...authQueries
  },
  Mutation: {
    ...authMutations
  }
};
```

### Emails

Por último, este proyecto permite enviar emails (ej. El link para modificar la
contraseña) mediante la librería [`email-templates`](https://www.npmjs.com/package/email-templates).
Asegurate de configurar correctamente las opciones:

```js
import * as Email from 'email-templates';

graphqlAuthentication: graphqlAuthenticationConfig({
  mailer: new Email()
});
```

Sin embargo, no he incluido las plantillas de los diferentes modelos, porque su
diseño y contenido requieren mucha personalización. Puedes [**copiar las plantillas
de ejemplo**](https://github.com/Volst/graphql-authentication/tree/master/examples/with-prisma/emails)
como punto de partida.

## Documentation

### GraphQL endpoints

Mutations:

- `signUpByInvite`
- `signup`
- `confirmEmail`
- `inviteUser`
- `login`
- `changePassword`
- `updateCurrentUser`
- `trigerPasswordReset`
- `passwordReset`

Queries:

- `currentUser`

Para más detalles, echale un vistazo al archivo [schema.graphql](./packages/graphql-authentication/schema.graphql).

### Autenticación y Roles en tus endpoints

En algunos de tus endpoints, podrías requerir que el usuario esté logueado, o
permitir acceder a un recurso solo a los usuarios con un rol determinado. Para
eso utilizamos la librería [graphql-shield](https://github.com/maticzav/graphql-shield):

```js
import { shield, rule } from 'graphql-shield';
import { isAuthResolver } from 'graphql-authentication';

const isAuth = rule()(isAuthResolver);

const permissions = shield({
  Mutation: {
    publish: isAuth
  }
});

const server = new GraphQLServer({
  typeDefs: './schema.graphql',
  resolvers,
  middlewares: [permissions]
});
```

Echale un vistazo a [graphql-shield README](https://github.com/maticzav/graphql-shield/blob/master/README.md)
para encontrar más información.

### Helpers


Obtener los datos del usuario logueado en un resolver:

```js
import { getUser } from 'graphql-authentication';

const Mutation = {
  async publish(parent, data, ctx) {
    const user = await getUser(ctx);
    console.log('User', user.email);
  }
};
```

Obtener solo el ID del usuario logueado en un resolver::

```js
import { getUserId } from 'graphql-authentication';

const Mutation = {
  async publish(parent, data, ctx) {
    const userId = await getUserId(ctx);
    console.log('User', userId);
  }
};
```

## Login y gestión de la sesión

Utilizamos [JWT tokens](https://jwt.io/) para gestionar las sesiones. En el
frontend puedes realizar una petición como esta para hacer login:

```graphql
mutation login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      # optional
      name
    }
  }
}
```

Y luego salvar el token en el `localStorage`. Luego tendrás que enviar el token
en cada petición.

### Añadir campos personalizados al tipo User

Si deseas añadir nuevos campos al tipo User, puedes añadir el tipo User a tu
`schema.graphql`, con los campos extra que necesites.

```graphql
# import Mutation.* from "node_modules/graphql-authentication/schema.graphql"

type Query {
  currentUser: User
}

type User {
  id: ID!
  email: String!
  name: String!
  inviteAccepted: Boolean!
  emailConfirmed: Boolean!
  lastLogin: DateTime
  joinedAt: DateTime!
  # Campos personalizados:
  isWillingToDance: Boolean!
}
```

Por otro lado, si no quieres exponer el campo `joinedAt`, simplemente elimínalo
de tu esquema.


### Registrar usuarios solo por invitación

Por defecto, cualquiera puede registrarse en tu proyecto. Pero si quieres que solo
se puedan registrar usuarios por invitación, importa todas las mutaciones menos
`Mutation.signup`. Ejemplo:

```graphql
# import Mutation.signupByInvite, Mutation.inviteUser, Mutation.login, Mutation.changePassword, Mutation.updateCurrentUser, Mutation.triggerPasswordReset, Mutation.passwordReset, from "node_modules/graphql-authentication/schema.graphql"
```

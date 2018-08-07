import { Mutation as authMutation } from '../../src/application/auth/auth.mutation';
import { Query as authQuery } from '../../src/application/auth/auth.query';
import { getPrismaTestInstance } from './getPrismaTestInstance';


describe('Auth Api', async () => {
  const parent = {};
  const context = {
    db: getPrismaTestInstance(),
  };
  const info = '{ content, status, title }';

  let emailUserConfirmToken = '';
  let inviteUserToken = '';
  let userBasicToken = '';
  let resetUserToken = '';

  /*
   * Creo el Rol BASIC por defecto, para que no de errores al crear el usuario
   */
  beforeAll(async (done) => {
    await getPrismaTestInstance().mutation.createRole({ data: { name: 'BASIC' } });
    done();
  });

  /*
   * Elimino todos los usuarios y roles tras realizar los tests
   */
  afterAll(async () => {
    await getPrismaTestInstance().mutation.deleteManyUserRoles({});
    await getPrismaTestInstance().mutation.deleteManyUsers({});
    await getPrismaTestInstance().mutation.deleteManyRoles({});
  });


  /*
   * Test de la mutación "signup"
   */
  describe('signup', async () => {
    it('Debería registrar un nuevo usuario como básico', async () => {
      const args = {
        email: 'johnDoe@email.com',
        name: 'John Doe',
        password: 'Foobarfoo1',
      };

      const result = await authMutation.signup(parent, args, context, info);

      emailUserConfirmToken = result.user.emailConfirmToken;

      expect(result.user.id).toHaveLength(25);
      expect(result.user.name).toEqual('John Doe');
      expect(result.roles[0].role.name).toEqual('BASIC');
    });

    it('Debería devolver un error al registrarse con un email no válido', async () => {
      try {
        const args = {
          email: 'johnDoe@emai',
          name: 'John Doe',
          password: 'Foobarfoo1',
        };

        await authMutation.signup(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Given email is invalid.');
      }
    });

    it('Debería devolver un error al registrarse con un email ya registrado', async () => {
      try {
        const args = {
          email: 'johnDoe@email.com',
          name: 'John Doe',
          password: 'Foobarfoo1',
        };

        await authMutation.signup(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: User already exists with this email.');
      }
    });

    it('Debería devolver un error al registrarse con un contraseña no válida', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
          name: 'John Doe',
          password: 'novalidatepassword',
        };

        await authMutation.signup(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Password must contain at least one number (0-9)!');
      }
    });
  });

  /*
   * Test de la mutación "inviteUser"
   */
  describe('inviteUser', async () => {
    it('Debería registrar un usuario por invitación', async () => {
      const args = {
        email: 'janeDoe@email.com',
      };

      const spy = jest.spyOn(getPrismaTestInstance().mutation, 'createUser');
      const result = await authMutation.inviteUser(parent, args, context, info);
      const { inviteToken } = await spy.mock.results[0].value;

      inviteUserToken = inviteToken;

      expect(spy).toHaveBeenCalled();
      expect(inviteToken).toHaveLength(36);
      expect(result.id).toHaveLength(25);
      spy.mockRestore();
    });

    it('Debería devolver un error si el email no es válido', async () => {
      try {
        const args = {
          email: 'janeDoe@email',
        };

        await authMutation.inviteUser(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Given email is invalid.');
      }
    });

    it('Debería devolver un error si el email ya existe', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
        };

        await authMutation.inviteUser(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: User already exists with this email.');
      }
    });
  });


  /*
   * Test de la mutación "signupByInvite"
   */
  describe('signupByInvite', async () => {
    it('Debería devolver un error si no se envía el email', async () => {
      try {
        const args = {
          inviteToken: '',
          password: 'Foobarfoo1',
          name: 'Jane Doe',
        };

        await authMutation.signupByInvite(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Not all required fields are filled in.');
      }
    });

    it('Debería devolver un error si no se envía el inviteToken', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
          password: 'Foobarfoo1',
          name: 'Jane Doe',
        };

        await authMutation.signupByInvite(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Not all required fields are filled in.');
      }
    });

    it('Debería devolver un error si el usuario no existe', async () => {
      try {
        const args = {
          email: 'jimyDoe@email.com',
          inviteToken: 'TOKENNOVALIDO',
          password: 'Foobarfoo1',
          name: 'Jane Doe',
        };

        await authMutation.signupByInvite(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });

    it('Debería devolver un error si el token no es válido', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
          inviteToken: 'TOKENNOVALIDO',
          password: 'Foobarfoo1',
          name: 'Jane Doe',
        };

        await authMutation.signupByInvite(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: inviteToken is invalid.');
      }
    });

    it('Debería devolver un error si la contraseña no es válida', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
          inviteToken: inviteUserToken,
          password: 'novalidatepassword',
          name: 'Jane Doe',
        };

        await authMutation.signupByInvite(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Password must contain at least one number (0-9)!');
      }
    });

    it('Debería registrar un usuario por invitación', async () => {
      const args = {
        email: 'janeDoe@email.com',
        inviteToken: inviteUserToken,
        password: 'Foobarfoo1',
        name: 'Jane Doe',
      };

      const result = await authMutation.signupByInvite(parent, args, context, info);

      expect(result.user.id).toHaveLength(25);
      expect(result.user.name).toEqual('Jane Doe');
      expect(result.roles[0].role.name).toEqual('BASIC');
    });
  });


  /*
   * Test de la mutación "login"
   */
  describe('login', async () => {
    it('Debería devolver un error si el usuario no existe', async () => {
      try {
        const args = {
          email: 'jimyDoe@email.com',
          password: 'Foobarfoo1',
        };

        await authMutation.login(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });

    it('Debería devolver un error si el usuario no ha aceptado la invitación aún', async () => {
      try {
        await authMutation.inviteUser(parent, { email: 'jimyDoe@email.com' }, context, info);

        const args = {
          email: 'jimyDoe@email.com',
          password: 'Foobarfoo1',
        };

        await authMutation.login(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: User has not accepted invite yet.');
      }
    });

    it('Debería devolver un error si el usuario no ha confirmado su email', async () => {
      try {
        const args = {
          email: 'johnDoe@email.com',
          password: 'Foobarfoo1',
        };

        await authMutation.login(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Users email has not been confirmed yet.');
      }
    });

    it('Debería devolver un error si la contraseña no es válida', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
          password: 'novalidpass',
        };

        await authMutation.login(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });

    it('Debería loguear un usuario', async () => {
      const args = {
        email: 'janeDoe@email.com',
        password: 'Foobarfoo1',
      };

      const result = await authMutation.login(parent, args, context, info);

      userBasicToken = result.token;

      expect(result.token).toHaveLength(155);
      expect(result.user.id).toHaveLength(25);
      expect(result.user.name).toEqual('Jane Doe');
      expect(result.roles[0].role.name).toEqual('BASIC');
    });
  });


  /*
   * Test de la mutación "confirmEmail"
   */
  describe('confirmEmail', async () => {
    it('Debería devolver un error si no se envía el email', async () => {
      try {
        const args = {
          email: '',
          emailConfirmToken: 'EMAILCONFIRMTOKEN',
        };

        await authMutation.confirmEmail(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Not all required fields are filled in.');
      }
    });

    it('Debería devolver un error si no se envía el token de confirmación', async () => {
      try {
        const args = {
          email: 'johnDoe@email.com',
          emailConfirmToken: '',
        };

        await authMutation.confirmEmail(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Not all required fields are filled in.');
      }
    });

    it('Debería devolver un error si el usuario no existe', async () => {
      try {
        const args = {
          email: 'noUser@email.com',
          emailConfirmToken: 'notValidConfirmToken',
        };

        await authMutation.confirmEmail(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });

    it('Debería devolver un error si el token de confirmación no es válido', async () => {
      try {
        const args = {
          email: 'johnDoe@email.com',
          emailConfirmToken: 'notValidConfirmToken',
        };

        await authMutation.confirmEmail(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Email confirm token is invalid.');
      }
    });

    it('Debería confirmar el email del usuario', async () => {
      const args = {
        email: 'johnDoe@email.com',
        emailConfirmToken: emailUserConfirmToken,
      };

      const result = await authMutation.confirmEmail(parent, args, context, info);

      expect(result.user.id).toHaveLength(25);
      expect(result.user.name).toEqual('John Doe');
      expect(result.user.emailConfirmed).toBeTruthy();
      expect(result.roles[0].role.name).toEqual('BASIC');
    });
  });


  /*
   * Test de la mutación "changePassword"
   */
  describe('changePassword', async () => {
    it('Debería devolver un error si el password antiguo no es correcto', async () => {
      try {
        const args = {
          oldPassword: 'notValidPassword',
          newPassword: 'Foobarfoo2',
        };

        const authContext = {
          db: getPrismaTestInstance(),
          request: {
            get: (Authorization) => `Bearer ${userBasicToken}`, // eslint-disable-line
          },
        };

        await authMutation.changePassword(parent, args, authContext, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Invalid old password.');
      }
    });

    it('Debería devolver un error si el nuevo password no es válido', async () => {
      try {
        const args = {
          oldPassword: 'Foobarfoo1',
          newPassword: 'notValidPassword',
        };

        const authContext = {
          db: getPrismaTestInstance(),
          request: {
            get: (Authorization) => `Bearer ${userBasicToken}`, // eslint-disable-line
          },
        };

        await authMutation.changePassword(parent, args, authContext, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Password must contain at least one number (0-9)!');
      }
    });

    it('Debería modificar la contraseña', async () => {
      const args = {
        oldPassword: 'Foobarfoo1',
        newPassword: 'Foobarfoo2',
      };

      const authContext = {
        db: getPrismaTestInstance(),
        request: {
          get: (Authorization) => `Bearer ${userBasicToken}`, // eslint-disable-line
        },
      };

      const result = await authMutation.changePassword(parent, args, authContext, info);

      expect(result.id).toHaveLength(25);
    });
  });


  /*
   * Test de la mutación "updateCurrentUser"
   */
  describe('updateCurrentUser', async () => {
    it('Debería modificar los datos del usuario', async () => {
      const args = {
        email: 'frodoBolson@email.com',
        name: 'Frodo Bolsón',
      };

      const authContext = {
        db: getPrismaTestInstance(),
        request: {
          get: (Authorization) => `Bearer ${userBasicToken}`, // eslint-disable-line
        },
      };

      const result = await authMutation.updateCurrentUser(parent, args, authContext, info);

      expect(result.name).toEqual('Frodo Bolsón');
      expect(result.email).toEqual('frodoBolson@email.com');
    });
  });


  /*
   * Test de la mutación "triggerPasswordReset"
   */
  describe('triggerPasswordReset', async () => {
    it('Debería devolver un error si el email no es válido', async () => {
      try {
        const args = {
          email: 'johnDoe@email',
        };

        await authMutation.triggerPasswordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Given email is invalid.');
      }
    });

    it('Debería devolver "true" si no existe el usuario', async () => {
      const args = {
        email: 'notUser@email.com',
      };

      const result = await authMutation.triggerPasswordReset(parent, args, context, info);

      expect(result.ok).toBeTruthy();
    });

    it('Debería enviar un email al usuario con un token para modificar su contraseña', async () => {
      const args = {
        email: 'johnDoe@email.com',
      };

      const spy = jest.spyOn(getPrismaTestInstance().mutation, 'updateUser');
      const result = await authMutation.triggerPasswordReset(parent, args, context, info);
      const { resetToken } = await spy.mock.results[0].value;

      resetUserToken = resetToken;

      expect(spy).toHaveBeenCalled();
      expect(resetToken).toHaveLength(36);
      expect(result.ok).toBeTruthy();
      spy.mockRestore();
    });
  });


  /*
   * Test de la mutación "passwordReset"
   */
  describe('passwordReset', async () => {
    it('Debería devolver un error si no pasamos el resetToken', async () => {
      try {
        const args = {
          email: 'johnDoe@email',
          resetToken: '',
          password: 'NewPassword1',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Not all required fields are filled in.');
      }
    });

    it('Debería devolver un error si no pasamos el nuevo password', async () => {
      try {
        const args = {
          email: 'johnDoe@email',
          resetToken: 'notValidResetToken',
          password: '',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Not all required fields are filled in.');
      }
    });

    it('Debería devolver un error si el usuario no existe', async () => {
      try {
        const args = {
          email: 'notUser@email',
          resetToken: resetUserToken,
          password: 'NewPassword1',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });

    it('Debería devolver un error si el usuario no ha solicitado modificar su contraseña', async () => {
      try {
        const args = {
          email: 'janeDoe@email.com',
          resetToken: resetUserToken,
          password: 'NewPassword1',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });

    it('Debería devolver un error si el token no es válido', async () => {
      try {
        const args = {
          email: 'johnDoe@email.com',
          resetToken: 'notValidResetToken',
          password: 'NewPassword1',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: No user found.');
      }
    });


    it('Debería devolver un error si el token ha caducado', async () => {
      try {
        const now = new Date();
        const resetExpires = new Date(now.getTime() - 10000).toISOString();

        await getPrismaTestInstance().mutation.updateUser({
          where: { email: 'johnDoe@email.com' },
          data: {
            resetExpires,
          },
        });

        const args = {
          email: 'johnDoe@email.com',
          resetToken: resetUserToken,
          password: 'NewPassword1',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Reset Token has expired.');
      }
    });

    it('Debería devolver un error si la nueva contraseña no es válida', async () => {
      try {
        const now = new Date();
        const resetExpires = new Date(now.getTime() + 7200000).toISOString();

        await getPrismaTestInstance().mutation.updateUser({
          where: { email: 'johnDoe@email.com' },
          data: {
            resetExpires,
          },
        });

        const args = {
          email: 'johnDoe@email.com',
          resetToken: resetUserToken,
          password: 'notValidPassword',
        };

        await authMutation.passwordReset(parent, args, context, info);
        expect(0).toBe(1);
      } catch (error) {
        expect(error.toString()).toEqual('Error: Password must contain at least one number (0-9)!');
      }
    });

    it('Debería modificar la contraseña', async () => {
      const args = {
        email: 'johnDoe@email.com',
        resetToken: resetUserToken,
        password: 'Foobarfoo2',
      };

      const result = await authMutation.passwordReset(parent, args, context, info);

      expect(result.id).toHaveLength(25);
    });
  });


  /*
   * Test de la mutación "passwordReset"
   */
  describe('currentUser', async () => {
    it('Debería devolver los datos del usuario logueado', async () => {
      const authContext = {
        db: getPrismaTestInstance(),
        request: {
          get: (Authorization) => `Bearer ${userBasicToken}`, // eslint-disable-line
        },
      };

      const result = await authQuery.currentUser({}, {}, authContext, '');

      expect(result.id).toHaveLength(25);
      expect(result.name).toEqual('Frodo Bolsón');
      expect(result.email).toEqual('frodoBolson@email.com');
    });
  });
});

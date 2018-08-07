# Instalación

## Requerimientos Previos
Para poder utilizar esta plantilla necesitarás tener instaladas las siguientes
herramientas:

* [Node v7.6+](https://nodejs.org/en/download/current/)
* [Docker.io](https://www.docker.com/community-edition#/download)
* [Yarn](https://yarnpkg.com/lang/en/docs/install/)


## Empezando

##### 1. Clona el repositorio y hazlo tuyo

El primer paso será descargarte el proyecto.

Cuando se haya descargado, entra dentro del directorio donde se haya clonado,
elimina la carpeta `.git` e inicia un repo nuevo. Ahora tendrás un repositorio
limpio y listo para tu proyecto, sin los commits que he realizado durante el
desarrollo de esta plantilla.

```bash
# Clonar el repositorio
$ git clone --depth 1 https://github.com/fvena/didor-template-graphql myproject

# Reiniciar git
$ cd myproject
$ rm -rf .git
$ git init
```

##### 2. Define las variables de entorno
En el archivo `.env_example` tienes un ejemplo de las variables de entorno necesarias
para levantar el proyecto.

En principio esta configuración debería hacer funcionar tu proyecto, aunque te
recomiendo que modifiques el nombre de tu aplicación al menos.

```bash
# Copia en un nuevo archivo .env las variables de entorno
$ cp .env.example .env
```

##### 3. Configurando Dockers

> Este paso solo es necesario si es la primera vez que desarrollas de forma local
un proyecto con GraphQL y Prisma.

El siguiente paso será levantar los contenedores docker necesarios:

* __prisma-db__: Contenedor para la base de datos MySQL
* __prisma__: Contenedor con un servidor Prisma para comunicarse
con la base de datos.

> __Atención!__ Solo si quieres inicializar una instalación limpia puedes eliminar
los contenedores antiguos y las respectivas imágenes antes:

```bash
# Recuerda que esto eliminará los datos almacenados en las bases de datos

# Eliminar todos los contenedores e imágenes a la vez
$ docker stop $(docker ps -a -q)  // Para todos los contenedores
$ docker rm $(docker ps -a -q)    // Elimina todos los contenedores
$ docker rmi $(docker images -q)  // Elimina todas las imágenes

# Eliminar contenedores e imágenes de uno en uno
$ docker ps -a                        // Lista todos los contenedores
$ docker rm ID_or_Name1 ID_or_Name2   // Elimina los contenedores
$ docker images -a                    // Lista todas las imágenes
$ docker rmi Image1 Image2            // Elimina las imágenes

# Comprueba que se han eliminado correctamente
$ docker ps -a                        // Lista todos los contenedores
$ docker images -a                    // Lista todas las imágenes
```

Para levantar los contenedores primero necesitar haber definido la contraseña
de acceso de Prisma.

1. __Define la contraseña en docker compose__: Define tu contraseña en el
archivo `docker-compose.yml` en el campo `managementApiSecret`.

2. __Define la contraseña en tus variables de entorno__: Indica tu contraseña
elegida en el archivo `.env` en el campo `PRISMA_MANAGEMENT_API_SECRET`.


```bash
# Descarga las imágenes y levanta los contenedores
$ docker-compose up -d

# Comprueba que se han levantado los contendores prisma y prisma-db
$ docker ps -a
```

##### 4. Descarga las dependencias del proyecto
```bash
$ yarn install
```


##### 5. Crear la base de datos y arrancar el proyecto

El último paso es generar la base de datos y empezar a desarrollar.

Al generar la base de datos se creará una estructura basada en el esquema de datos
definido en el archivo `src/schemes/datamode.graphql`. Más adelante cuando lo modifiques
y crees tu propia estructura de datos, recuerda volver a ejecutar el comando
`prisma deploy` para actualizar los cambios en la base de datos.


```bash
# Genera/Modifica la base de datos
$ yarn deploy

# Inicia la plantilla en modo desarrollo
$ yarn dev
```

![Playground](/images/2018/05/playground.png)

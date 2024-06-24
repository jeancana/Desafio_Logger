import { Router } from 'express'

// - Importamos el uploader para poder trabajar con Multer y subir archivos 
//import { uploader } from '../uploader.js' // Esta desactivada - No lo necesitamos por ahora)

// - Funciona para: Persistencia de Archivos con FILE SYSTEM 
// import { userControllerfs } from '../controllers/user.controller.fs.js' // (Esta desactivada - No lo usamos)

// - Funciona para: Persistencia de Archivos con MongoDB
// Estamos importando la Clase que UsersController contiene los metodos
import { UsersController } from '../controllers/user.controller.mdb.js' // para trabajar con Mongo

// Autenticacion con JWT 
import { passportCall } from '../utils.js'// Manejo de JWT y Intercepción de errores para Modulo passport

// - LLAMANDO A LA FUNCIONES HELPERS QUE CREAMOS CON EL MODULO "bcrypt"
import { createHash, isValidPassword, sendConfirmation, registerUser } from '../utils.js'// Otra forma de importa todo junto

//Importando la Capa de Servicios para interactuar con el BBDD
import userService from '../services/user.service.js'

// Importando los modulos para poder hacer GESTION CENTRAL DE ERRORES - Middleware de captura general de errores
import CustomError from "../services/error.custom.class.js";
import errorsDictionary from "../services/error.dictionary.js";
import config from '../config.js';

// - Activando el Modulo Router de Express
const router = Router()

// - Generando una nueva Intanscia del UsersController
const userController = new UsersController()


// ************* Paquete de Rutas de /api/users ********************

// Nota: Fortalecimos el Codigo agregando try/catch en todas las rutas y respetamos los codigos de Estado


// *** 1.1) Read - Endpoint para leer/Consultar todos los Usuarios de la DB - Formato JSON
router.get('/', async (req, res) => {

    try {

    
        // Paso 3: Usando el Metodo .getUsers() disponible en archivo user.controller.mdb.js
        const users = await userController.getUsers()

        // Aca Mandamos la respuesta al cliente con el listado de usuarios encontrados 
        res.status(200).send({ status: 'Ok. Mostrando Lista de usuarios', data: users })

    } catch (err) {
        
        res.status(500).send({ status: 'ERR-USERS', data: err.message })

    }

    //----- Rutas para USAR del Lado del cliente -----------
    // Para mostrar: http://localhost:5000/api/users 

})


router.get('/test-getByEmail', passportCall('jwtAuth', { session: false }), async (req, res) => {

    const userMail = req.user.payload.username
    console.log(userMail)

    try {

        // Paso 3: Usando el Metodo .getUsers() disponible en archivo user.controller.mdb.js
        const user = await userController.getByEmail(userMail)

        // Aca Mandamos la respuesta al cliente con el listado de usuarios encontrados 
        res.status(200).send({ status: 'Ok. User Encontrado', data: user })

    } catch (err) {

        res.status(500).send({ status: 'ERR-USERS', data: err.message })

    }

})


// *** 2) Create - Endpoint para registrar users en la BD con Formulario de Registro http://localhost:5000/register
// *** 2.1) Agregamos el middle "registerUser"
// *** 2.2) Agregamos el middle "sendConfirmation() - envia mails usando un servidor saliente(SMTP) de Google
router.post('/register', registerUser, sendConfirmation(), async (req, res) => {

    //console.log('/register',req.body) // Para verificar todo lo que esta llegando la peticion POST

    try {

        req.logger.info('Sea Registrado un Nuevo Usuario ')

        res.redirect('/login') 


    } catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })

    }

})


// *** 3) Update - Endpoint para Actualizar un usuario en la DB - Con POSTMAN
router.put('/:id', async (req, res) => {

    try {

        // Asignamos a id el ID que nos llega req.params
        const { id } = req.params

        // IMPORTANTE: Aca verifico lo que viene por req.params - Esta llegando un Objeto y necesito pasar un ID 
        console.log(id)

        // Desestructuramos el req.body (el JSON con los Datos a Actualizar)
        const { firstName, lastName, email, gender } = req.body

        // Verificamos y Validamos los valores recibidos
       /*  if (!firstName || !lastName || !email || !gender) {
            return res.status(400).send({ status: 'ERR', data: 'Faltan campos obligatorios' })
        } */

        // IMPORTANTE: Aca tenemos un else{} intrinsico por la lectura en cascada 

        // Creamos un Nuevo Objeto con los Datos Desestructurados
        const newContent = {

            firstName, //Se puede poner asi el Objeto y JS enviente que la propiedad Y el valor tienen el MISMO NOMBRE
            lastName,
            email,
            gender

        }

        // Paso 3: Usando el Metodo .updateuser() disponible en archivo user.controller.mdb.js
        const result = await userService.updateUser(id, newContent)

        // Aca Mandamos la respuesta al cliente
        res.status(200).send({ status: 'OK. user Updated', data: result })

    } catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })

    }


})


// *** 4) Delete - Borrando un usuario de la DB - Con POSTMAN
router.delete("/:id", async (req, res) => {

    try {

        // Asignamos a id el ID que nos llega req.params)
        const { id } = req.params

        // IMPORTANTE: Aca verifico lo que viene por req.params - Esta llegando un Objeto y necesito pasar un ID 
        console.log(id)

        //IMPORTANTE: Aca verifico que solo le estoy pasando el valor(ID) y no el Objeto completo 
        console.log(id)

        // Paso 3: Usando el Metodo .deleteUserById() disponible en archivo user.controller.mdb.js
        const result = await userController.deleteUserById(id)

        // Aca Mandamos la respuesta al cliente
        res.status(200).send({ status: 'OK. user Deleted', data: result })

    }   catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })

    }
})


// *** 5) Paginado - Ejemplos Viejos 
router.get('/test-paginated', async (req, res) => {
    
    try {

        const users = await userController.getUsersPaginated()
        
        res.status(200).send({ status: 'OK', data: users })

    } catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })

    }

    //----- Rutas para USAR del Lado del cliente -----------
    // Para mostrar: http://localhost:5000/api/users/test-paginated
    // Nota el resultado de la esta ruta la puedo pasar a un plantilla (html/handlebars), lo puede consumir un Frontend y con eso ARMAMOS LA BARRA DE PAGINACION / LINEA DE PAGINACION 

})


// *** 6) Paginado - Ejemplos Viejos 2 
router.get('/test-paginated2', async (req, res) => {

    try {

        // Asignamos a id el ID que nos llega req.query
        const pagineted = req.query

        // IMPORTANTE: Aca verifico lo que viene por req.quey - Esta llegando un Objeto y necesito pasar un ID 
        console.log(pagineted)

        //IMPORTANTE: Aca verifico que solo le estoy pasando el valor(ID) y no el Objeto completo 
        //console.log(pagineted.page)
        //console.log(pagineted.limit)
        

        const users = await controller.getUsersPaginated2(pagineted.page, pagineted.limit)

        res.status(200).send({ status: 'OK', data: users })

    } catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })

    }

    //----- Rutas para USAR del Lado del cliente -----------
    // Para mostrar:
    // 1) http://localhost:5000/api/users/test-paginated2
    // 2) http://localhost:5000/api/users/test-paginated2?limit=5&page=1&sort=desc
    // 3) http://localhost:5000/api/users/test-paginated2?limit=50&page=1&sort=desc
    // 4) http://localhost:5000/api/users/test-paginated2?limit=100&page=2&sort=desc 
    // IMPORTAN: al usar el sort=desc MongoDB Ordena todo de Menor a Mayor por su _id(este es el asgigna mongoDB) AUTOMATICAMENTE SIN USAR NINGUN PARAMETRO 
    // Nota: el resultado de la esta ruta la puedo pasar a un plantilla (html/handlebars), lo puede consumir un Frontend y con eso ARMAMOS LA BARRA DE PAGINACION / LINEA DE PAGINACION 

})


// *** 7) Endpoint para Generar usuario con faker-js
// Estoy usando un Expresion Regular para controlar y solo pueden entrar Nros del 1 al 9 por el req.params
router.get('/mockUser/:qty([1-9]*)', async (req, res) => {

    try { 

        const qty = req.params.qty

        const users = await userController.generateMockUsers(qty)

        res.status(200).send({ status: 'OK', data: users })

    } catch (err){

        res.status(500).send({ status: 'ERR', data: err.message })

    }
    

 })


/**
*** 8) Endpoint de PRUEBA para manejo con GESTOR CENTRAL DE ERRORES - Middleware de errores personalizado
* Si todo va bien, procesamos la creación de usuario y retornamos la respuesta deseada.
* Si hay problemas, retornamos una llamada a next() con una nueva instancia de nuestra
* clase de error personalizada, esto será capturado por el middleware central de gestión
* de errores en app.js.
*/
router.post("/testing-errorsMiddleware", async (req, res, next) => {

    const {
        first_name,
        last_name,
        email,
        password,
    } = req.body

    if (first_name && last_name && email && password) {

        return res.status(200).send({ status: "OK", data: 'La Prueba de testing-errorsMiddleware NO SE ACTIVO ' });

    }

    // Dejamos de Usar el Try/Catch y ahora para todo directamente a traves de la Clase Error propia de Express
    // Paso 1: Directamente Instacionamos una nueva clase de CustomError()
    // Paso 2: la Pasamos como parametro el errorsDictionary
    // colocar toda la respuesta dentron del next() para que lo pueda ejecutar el GESTOR CENTRAL DE ERRORES
    // Importante: De esta manera vamos dejando cada vez mas limpios los Endpoints
    return next(new CustomError(errorsDictionary.FEW_PARAMETERS));
    
});


// *** 9) Endpoint para Testing de logs
router.get('/customdAddLogger', async (req, res) => {

    try {

        // Uso del standardAddLogger
        //req.logger.verbose('Modo=devel - Solo Reporta Logs a partir Nivel verbose en Adelante')
        //req.logger.warn('Modo=prod - Guarda Logs a partir Nivel warn en adelante')

        // Uso del customdAddLogger
        // Testear Modo=devel
        req.logger.debug('Modo=devel - Solo Reporta Logs a partir Nivel debug en Adelante')

        // Testear Modo=prod
        req.logger.info('Modo=prod - Solo Reporta Logs a partir Nivel en adelante')
        req.logger.warning('Modo=prod - Guarda Logs a partir Nivel warning en adelante')

       

        // Aca Mandamos la respuesta al cliente con el listado de usuarios encontrados 
        res.status(200).send({ status: 'Ok - Testing customdAddLogger ', data: `Esta en Modo = ${config.MODE}` })

    } catch (err) {

        res.status(500).send({ status: 'ERR-USERS', data: err.message })

    }

})


export default router
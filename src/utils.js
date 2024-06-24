// Al estar habilitado el type: Module (sistema de Modulos) en el ECMAS No es posible usar la constante __dirname (esta definida para common.js)
// POR TANTO debemos crear a MANO las constantes necesarias para que funcione LAS RUTA ABSOLUTAS y luego exportarlas

// Creando los const ABSOLUTOS que me permiten tener PATH ABSOLUTAS = rutas absolutas

// importa todas las url de 'url' (trabajamos con todos las funciones prefabricadas en el modulo 'url')
import * as url from 'url'

export const __filename = url.fileURLToPath(import.meta.url)
export const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Se debe importar del otro lado con los NOMBRES ESPECIFICOS DE LAS CONSTANTES (No se pues cambiar el nomnbre de la constante al importarlo)

// NOTA IMPORTANTE: el archivo utils.js NOS MUESTRA COMO SE DEBE EXPORTA UNA CONSTANTE cuando NO usamos export default


// --------------------------------------------// 

import bcrypt from 'bcrypt'// Importamos en utils el MODO bcrypt y sus  Funcionalidades

// Aca creamos 2 funciones Helpers para exportar usando los metodo que contiene el modulo bcrypt

// 1) LA PRIMERA para Hashaer el password que nos pasa usuario y NO pasarlo a la BD como texto plano
// Usamos el metodo hashSync de bcrypt para hashear la clave
export const createHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10))

// 2 LA SEGUNDA: Usamos el metodo compareSync de bcrypt para comparar el password ya hashead guardado en la BD
// y lo compara con el el password sin hashear del usurio  
// Devolvera true o false dependiendo si el password coincide o no 
// le pasamos el usuario de db y el password que llego del client
export const isValidPassword = (passwordInBody, passwordInBD) => bcrypt.compareSync(passwordInBody, passwordInBD)


// --------------------------------------------// 

// Trabajando con JWT (jsonWebToken) - Standard para la Autenticacion de Sessiones mediante CREDENCIALES 

// Importanto el Modulo
import jwt from 'jsonwebtoken'
import passport from 'passport' // Rutina de intercepción de errores para passport con JWT

import config from './config.js'// Archivo de Estan todo los Datos sensibles

// Este private key es para cifrar/firmar el token
const PRIVATE_KEY = config.JWT_ENV.jwtSecretOrKey


// Aca creamos 3 funciones:

// 1) Funciona para Crear el JWT 
// Esta funcion se usa al momento del login del usuario como un middleware 
// En lugar de generar una sesion, Generamos un token en el endpoint: /api/sessions/login
// payload = user (carga util datos del USUARIO INJERTADOS EN EL JWT que usaremos despues para validar)
export const generateToken = (payload, duration) => jwt.sign({ payload }, PRIVATE_KEY, { expiresIn: duration })


// 2) Funcion para Verificar y Validar el token Creado - Hecho a Mano para Validar sin Passport
export const authToken = (req, res, next) => {

    // verificando lo que llega en la query
    //console.log('authToken - ' ,req)

    // Esta constante tiene dentro una validacion ternanria (ESTUDIAR BIEN ESTO)
    // OJO: Explicando el Ternario que Uso el profe
    // req.headers.authorization !== undefined, indica que SI el JWT NO me llega por el hearder de la request
    // Entonces usa el JWT que me viene por la req.query

    // __________ IMPORTATE Mejorando la Recepcion del Token _____________

    // Caso 1 si viene por el req.headers
    const headerToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined;

    // Caso 2 si viene por el req.cookie
    const cookieToken = req.cookies && req.cookies['cookie-JWT'] ? req.cookies['cookie-JWT'] : undefined;

    // Caso 3 si viene por el req.query
    const queryToken = req.query.access_token ? req.query.access_token : undefined;

    // Usamos el OR para que siempre entre alguno de los casos 
    // Tiene 3 Opciones para Extraer el Token 
    const receivedToken = headerToken || cookieToken || queryToken

    // if (!receivedToken) return res.status(401).send({ status: 'ERR', data: 'No autenticado' })

    // SiNO estoy recibiendo ningun TOKEN redirecciono a /login 
    if (!receivedToken) return res.redirect('/login')

    // Como si RECIBI EL TOKEN entonces lo valido 
    jwt.verify(receivedToken, PRIVATE_KEY, (err, credentials) => {

        console.log('jwt.verify', credentials)
        //console.log('jwt.verify', err)

        // Si el token no es validdo o expiro su tiempo envio .send({ status: 'ERR', data: 'No autorizado' })
        if (err) return res.status(403).send({ status: 'ERR', data: 'No autorizado' })

        // Si todo esta bien guardo la credenciales 
        req.user = credentials

        // salgo del middleware y sigo con el endpoint que corresponde
        next()
    })
}


// 3) Rutina de Intercepción de errores Mejorada para passport
// Esta funcion la estaremos usando como un middleware en la rutas (endpoints)
export const passportCall = (strategy, options) => {

    // console.log(strategy, options)
    // Retorna un Callback Asincrono 
    return async (req, res, next) => {

        //console.log(req)

        //Dentro de la Callback uso la estrategia de passport
        passport.authenticate(strategy, options, (err, user, info) => {

            // Aca se hace una Captura de errores mas optima 
            // Para Mejorar los Mensajes de Error 
            if (err) return next(err);
            if (!user) return res.status(401).send({ status: 'ERR-', data: info.messages ? info.messages : info.toString() });

            // Sino Existen errores Asigno el user al req.user y sigo next();
            // Seteamos el usuario y sigue el next();
            req.user = user;
            next();

        })(req, res, next);
    }
}

// --------------------------------------------//  

// *** Creamos un Middleware de Autorización por ROLES - para JWT ***

// Este mid de autorización nos permite comenzar a manejar el tema de roles, es decir,
// niveles de permisos de usuario
// Observar que aparece next, además de req y res.
// next nos permite continuar la secuencia de la "cadena".
// En este caso, si el usuario es admin, llamanos a next, caso contrario
// devolvemos un error 403 (Forbidden), no se puede acceder al recurso.
// Si ni siquiera se dispone de req.session.user, directamente devolvemos error
// de no autorizado.
export const authorizationMid = (role) => {

    // Devuelve un Callback Asincrono que hace el chequeo de los Roles Asignados
    return async (req, res, next) => {

        console.log(' LLEGO authorization ', req.user.payload.role)

        // Sino Existe un req.user - reporta el siguiente error 
        if (!req.user)
            return res.status(401).send({ status: 'ERR', data: 'No autenticado' });

        // Si Existe un req.user pero es distinto al role que llega por el parametro (role) reporta el siguiente error 
        // "req.user.payload.role" fue creado cuando generamos el Token al hacer login
        // "role" fue parametro asignado en la ruta cuando usamos el Middleware authorization('admin') endpoint Nro 15
        if (req.user.payload.role !== role)
            return res.status(403).send({ status: 'ERR', data: 'Sin permisos suficientess' });

        // Sino tengo errores al siguiente proceso dentro de la ruta 
        next();

    }
}

// --------------------------------------------// 

// *** Servicio de NodeMailer nos permitirá enviar mails usando un servidor ***

// Importamos estos módulos para las pruebas
//import twilio from 'twilio';
import nodemailer from 'nodemailer'; // Modulo para poder contactarnos con algun servicio SMTP
//import { Vonage } from '@vonage/server-sdk';


/**
 * Este servicio de NodeMailer nos permitirá enviar mails usando un servidor
 * saliente (SMTP) de Google, en el cual nos identificaremos con nuestra cuenta
 * de Gmail, pero ATENCION, NO usaremos la clave habitual, sino una clave de
 * aplicación (config.GOOGLE_APP_PASS) que deberemos activar en:
 * https://myaccount.google.com/apppasswords
 */

// 1) Creando el Servicio que me permite Enviar Mails Usando Servidor Saliente (SMTP)
const mailerService = nodemailer.createTransport({

    service: config.SERVICE, // Aca le indico el servicio con el cual voy a trabajar 
    port: 587, // Aca le indico el puerto en el que trabaja el servicio 
    auth: {

        // Aca van los datos de Autenticaion 
        user: config.GOOGLE_APP_EMAIL_ENV,
        pass: config.GOOGLE_APP_PASS_ENV

    }
});


// 2) Creamos un middleware que inyectaremos en cualquier endpoint que necesite notificar

// IMPORTANTE en el Caso Particular del middleware "sendConfirmation() ": 
// - Como se necesita hacer una llamada Asincrona a un Serivicio Externo (SMTP) 
// - NO se define la funcion sendConfirmation() como Asincrona
// - Definimos como Asincrono el Resultado (return async (req, res, next) => {})
// - Lo que retorna la funcion es un Resultado ASINCRONO

export const sendConfirmation = () => {

    // Agregando es una Capa Asincrona para el Servicio de Envio de Mail con SMTP
    // NO se debe hacer la Funcion Asyncrona SINO que se retorna un Resultado ASINCRONO
    return async (req, res, next) => {

        try {

            //console.log('sendConfirmation', req.user)

            const subject = 'KUIKI-STORE Confirmacion de Registro'; 
            const html = `<h1>CODERStore confirmación registro</h1><p>Muchas gracias por registrarte ${req.user.first_name} ${req.user.last_name}!, te hemos dado de alta en nuestro sistema con el email ${req.user.email}`;
            
            // Enviamos utilizando NodeMailer
            await mailerService.sendMail({

                from: config.GOOGLE_APP_EMAIL_ENV,
                to: req.user.email,
                subject: subject,
                html: html

            });

            next(); 

        } catch (err) {

            res.status(500).send({ status: 'ERR - mailerService', data: err.message })

        }
    }
}


// 3) Creamos un middleware para Registrar un Usuarios 

import { UsersController } from './controllers/user.controller.mdb.js'
const userController = new UsersController()

export const registerUser = async (req, res, next) => {

    try {

        // Desestructuramos el req.body (el JSON con los Datos a Actualizar)
        const {
            first_name,
            last_name,
            email,
            password,
        } = req.body

        // Registrando un Usuario en la BD con su clave hasheada
        const [errors, user] = await userController.addUser({
            first_name,
            last_name,
            email,
            password: createHash(password)//usando el createHash() para hashear la clave usario antes de enviar a la DB
        })


        if (errors) {

            console.log('errors', errors)
            // Aca codifico la respuesta que voy a enviar la URL - como Erro - para que no se vea en la URL
            const b64error = btoa(JSON.stringify(errors))
            return res.redirect(`/register?errors=${b64error}`)
        }

        /// Si todo esta bien guardo el user 
        req.user = user

        // salgo del middleware y sigo con el endpoint que corresponde
        next()
        
    } catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })
        
    }
 

}


// --------------------------------------------// 


// *** Servicio de Twilio  nos permitirá enviar mensajes SMS, Whatsapp y Telegram ***

// quedo en proceso de fabricacion tuve problemas con verificar mi telefono con twilio


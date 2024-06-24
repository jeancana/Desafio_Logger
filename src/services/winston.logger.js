/**
 * Habilitación de logger winston para salida por consola y archivo
 * 
 * Los niveles de error standard son los siguientes:
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 * (del más severo [error] al menos importante [silly])
 * 
 * Ver también debajo el ejemplo de niveles de error personalizados
 */

import winston from 'winston';

import config from '../config.js';


// 1 ) CREANDO UN LOGGER STANDAR

// Podemos crear tantos loggers como necesitemos, nos manejaremos con:
// - Logger para Desarrollo 
// - Logger para Producción


// 1.1) Creando un Logger para Instancia de Desarrollo
// winston.createLogger({}) es el objeto de configuracion que vamos a Armar
// En este caso el de desarrollo cuenta con 1 transporte habilitado, para sacar logs
// únicamente por consola, desde nivel verbose hacia arriba.
const devLogger = winston.createLogger({

    // El transporte de logs va consola y se va a tomar en cuenta desde el nivel 'verbose'
    // transports va a ser un array xq podemos logger (reportar/dejarRegistroDelEvento) a distintos lugares
    transports: [

        // Opcion 1: Mostrando todos los logs por consola a partir del nivel verbose en adelante
        // Creamos una nueva instancia aca dentro y le indicamos la salida Consola y los detalles 
        new winston.transports.Console({ level: 'verbose' }),

        // Opcion 2: Para registrar también en archivo los Logs , desde nivel http hacia arriba
        // y Se van a Guardar en la ruta ../src/logs/errors.log
        //new winston.transports.File({ level: 'http', filename: `./src/logs/errors.log` })// Era solo de prueba

    ]
});


// 1.2) Creando un Logger para Instancia de Producción
const prodLogger = winston.createLogger({

    //tiene 2 transportes habilitados
    transports: [

        // Opcion 1: Mostrando todos los logs por consola a partir del nivel verbose en adelante
        // Creamos una nueva instancia aca dentro y le indicamos la salida Consola y los detalles
        new winston.transports.Console({ level: 'http' }),

        // Opcion 2: Para registrar también en archivo los Logs , desde nivel warn hacia arriba
        // y Se van a Guardar en la ruta ../src/logs/errors.log
        new winston.transports.File({ level: 'warn', filename: `./src/logs/errors.log` })

    ]
});


// Version Standard Nro 1.3: Creamos un middleware que inyecta el logger en el objeto req,
// es el que hemos habilitado a nivel global en app.js.
const standardAddLogger = (req, res, next) => {

    // 1) Inyecto el en req.logger el "devLogger"
    // Opcion 1.3.1: 
    //req.logger = devLogger
        
    // Opcion 1.3.2: forma dinamica  
    // Usamos un ternario para hacerlo mas dinamico Según el modo-- > desarrollo o producción
    // cargamos un logger u otro
    req.logger = config.MODE === 'devel' ? devLogger : prodLogger;

    // Aca habilitamos log que registrara si se hicieron solicitudes http(si se hizo un GET,POST,PUT o DELETE)
    // Usamos 3 Parametros req.logger.http({} {} {})
    // Parametro 1: Registra la fecha del evento http
    // Parametro 2: Resgistra el tipo de metodo o verbo http usado en la request
    // Parametro 3: Registra desde que url vino la request
    req.logger.http(`${new Date().toDateString()} ${req.method} ${req.url}`);

    next();
}


//__________________________________________________//

// 2) CREANDO UN LOGGER PERSONALIZADO 
// definidos arriba. Los niveles standard ya NO estarán disponibles, es decir,


// Creando niveles de error/registro personalizados,
// para REEMPLAZAR a los nivels standard
const customErrLevels = {

    levels: { fatal:0 ,error: 1, warning: 2, info: 3, http: 4, debug: 5 },
    colors: { fatal: 'red', error: 'red', warning: 'red', info: 'blue', http: 'blue', debug: 'blue' }
    
}

// 2.1) Custom Logger para Instancia de Producción
// Este logger también utiliza 2 transportes, pero aplicando los niveles personalizados
// al inyectarlo desde el middleware, ya no podremos hacer por ej un req.logger.warn,
// tendremos req.logger.fatal, error: 1, warning: 2, info: 3, http: 4, debug: 5 que son los niveles que hemos definido.
const customDevLogger = new winston.createLogger({

    levels: customErrLevels.levels,

    // Aqui Asigno los Colores a los levels
    format: winston.format.combine(
        winston.format.colorize({ colors: customErrLevels.colors }),
        winston.format.simple()
    ),
    transports: [

        // Mostrando todos los logs por consola a partir del nivel debug en adelante
        new winston.transports.Console({ level: 'debug' }),

    ]
})


// 2.1) Custom Logger para Instancia de Desarrollo
const customProdLogger = new winston.createLogger({

    levels: customErrLevels.levels,

    // Aqui Asigno los Colores a los levels
    format: winston.format.combine(
        winston.format.colorize({ colors: customErrLevels.colors }),
        winston.format.simple()
    ),
    transports: [

        // Mostrando todos los logs por consola a partir del nivel info en adelante
        new winston.transports.Console({ level: 'info' }),

        // Para registrar también en archivo los Logs , desde nivel warning hacia arriba
        new winston.transports.File({ level: 'warning', filename: `./src/logs/errors.log` })
    ]
})


// Version Standard Nro 1.3: Creamos un middleware que inyecta el logger en el objeto req,
// es el que hemos habilitado a nivel global en app.js.
const customdAddLogger = (req, res, next) => {

    // 1) Inyecto el en req.logger el "devLogger"
    // Opcion 1.3.1: 
    //req.logger = devLogger

    // Opcion 1.3.2: forma dinamica  
    // Usamos un ternario para hacerlo mas dinamico Según el modo-- > desarrollo o producción
    // cargamos un logger u otro
    req.logger = config.MODE === 'devel' ? customDevLogger : customProdLogger;

    // Aca habilitamos log que registrara si se hicieron solicitudes http(si se hizo un GET,POST,PUT o DELETE)
    // Usamos 3 Parametros req.logger.http({} {} {})
    // Parametro 1: Registra la fecha del evento http
    // Parametro 2: Resgistra el tipo de metodo o verbo http usado en la request
    // Parametro 3: Registra desde que url vino la request
    req.logger.http(`${new Date().toDateString()} ${req.method} ${req.url}`);

    next();
}



export default { standardAddLogger, customdAddLogger };
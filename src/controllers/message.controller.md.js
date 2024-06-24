
// ******** CONTROLLERS de Mensajes con PERSISTENCIA DE ARCHIVOS EN MongoDB ********* 

// Importando el messagesModel
// Al importar el messagesModel nos traemos todo los metodos de la libreria mongoose 


import messageService from '../services/message.service.js'

export class MessageController {
   
    constructor() {
        // Creo el constructor y lo dejo vacio
    }

    // CREATE = Agregando un Mensaje a la BD
    async addMessage(message) {

        // Para verificar
        //console.log('mensaje llego al controller:', message)

        try {

            // Cargando el mensaje en BD
            const loaded = await messageService.createMessage(message)

            // Retornando el Mensaje Cargado en la BD
            return loaded

        } catch (err) {

            return err.message

        }
    }

    // READ =  Leyendo todos los Mensaje creados en la BD
    //  Nota: Esto en caso de que se necesite hacer un reporte de los todos chats guardados
    async getMessage() {
        try {

            // COMO hace un solo Proceso pongo todo en el return
            return await messageService.getMessages() 

        } catch (err) {

            return err.message

        }

    }

   
}
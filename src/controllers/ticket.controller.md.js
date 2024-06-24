
// ******** CONTROLLERS de Mensajes con PERSISTENCIA DE ARCHIVOS EN MongoDB ********* 

// Importando el ticketService
// Al importar el ticketService nos traemos todo los metodos de la libreria mongoose 


import ticketService from '../services/ticket.service.js'

export class TicketController {
   
    constructor() {
        // Creo el constructor y lo dejo vacio
    }

    // CREATE = Agregando un Mensaje a la BD
    async addTicket(amount, purchaser) {

        // Para verificar
        //console.log('mensaje llego al controller:', message)

        try {

            // Cargando el mensaje en BD
            const result = await ticketService.createTicket({
                amount,
                purchaser,
            })

            
            return result

        } catch (err) {

            return err.message

        }
    }

    // READ =  Leyendo todos los Mensaje creados en la BD
    //  Nota: Esto en caso de que se necesite hacer un reporte de los todos chats guardados
    
    async getTicketByCode(id, purchaser) {
        try {

            // COMO hace un solo Proceso pongo todo en el return
            return await ticketService.getTicketByCode(id, purchaser) 

        } catch (err) {

            return err.message

        }

    }

    async getTicketsByPurchaser(email) {
        try {
            return await ticketService.getTicketsByEmail(email)
        } catch (err) {
            return err.message
        }
    }

   
}
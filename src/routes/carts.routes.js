
import { Router } from 'express'
import { CartController } from '../controllers/cart.controller.mdb.js'
import { passportCall } from '../utils.js'// Manejo de JWT y Intercepción de errores para Modulo passport
import { authorizationMid } from '../utils.js'// Manejo de Autorización por ROLES 
import { UsersController } from '../controllers/user.controller.mdb.js'
import { ProductsController } from '../controllers/product.controller.mdb.js'
import { TicketController } from '../controllers/ticket.controller.md.js'

// Importando el Diccionario de Errores 
import errorsDictionary from '../services/error.dictionary.js';

const router = Router()

// Paso 2: Generando una nueva Intanscia -  Servicios Enlazados con MongoDB
const controller = new CartController()
const userController = new UsersController()
const prdController = new ProductsController()
const ticketController = new TicketController()

// ************* Paquete de Rutas de /api/products ********************

// Nota: Fortalecimos el Codigo agregando try/catch en todas las rutas y respetamos los codigos de Estado


// *** 1) Read - Endpoint para leer/Consultar todos los Carritos Existentes en la DB 
router.get('/', passportCall('jwtAuth', { session: false }), async (req, res) => {
    const user = await userController.getByEmail(req.user.payload.username)
    const cart = await controller.getCartById(user.cart.toString())

    res.status(200).send(cart)
})


// *** 2) Agregar producto a carrito
router.post('/products/:pid', passportCall('jwtAuth', { session: false }), authorizationMid('user'), async (req, res) => {

    try {
        const { pid } = req.params

        const user = await userController.getByEmail(req.user.payload.username)
        const cart = await controller.getCartById(user.cart, false)
        const producto = await prdController.getProductById(pid)

        //IMPORTANTE: Aca verifico que solo le estoy pasando el valor(ID) 
        // console.log('/api/carts/${pid} - req.params ',cid)
        // console.log('del fetch - req.body ', req.body)

        // Desestructuramos el req.body 
        const { cantidad } = req.body


        // Verificamos y Validamos los valores recibidos
        if (!cantidad || parseInt(cantidad) < 0) {
            return res.status(400).send({ status: 'ERR', data: errorsDictionary.FEW_PARAMETERS.message })
        }

        const products = cart.products.filter((prd) => prd.producto && prd.producto.toString() !== pid)
        const updatedProducts = [...products, {
            producto: producto._id,
            cantidad: parseInt(cantidad),
        }]

        const result = await controller.updateCart(user.cart.toString(), {
            products: updatedProducts
        })

        // Aca Mandamos la respuesta al cliente
        res.status(200).send({ status: 'OK. Product Updated', data: result })

    } catch (err) {
        console.log(err)

        res.status(500).send({ status: 'ERR', data: err.message })

    }

})



// *** 3) Delete - Endpoint para Borra un Producto agregado al Carrito - Con POSTMAN
router.delete('/products/:pid', passportCall('jwtAuth', { session: false }), authorizationMid('user'), async (req, res) => {

    try {
        const { pid } = req.params

        const user = await userController.getByEmail(req.user.payload.username)
        const cart = await controller.getCartById(user.cart)

        //IMPORTANTE: Aca verifico que solo le estoy pasando el valor(ID)
        //console.log(cid)
        //console.log(pid)

        // Verificamos y Validamos los valores recibidos
        if (!pid) {
            return res.status(400).send({ status: 'ERR', data: errorsDictionary.FEW_PARAMETERS.message })
        }

        console.log('cart***', cart)

        // Desestructuramos el Carrito encontrado
        const { products } = cart

        // Verificando el contenido de "products"
        console.log('products es un:', typeof products)
        console.log('products es un Array?', Array.isArray(products))// Verificando si es un Array 

        //console.log(products)
        //console.log(id)

        // Eliminando un producto del carrito
        const deleteProductoOncart = products.filter(item => item.producto.toString() !== pid)

        // Creamos un Nuevo Array con los productos que NO fueron eliminados del carrito
        const newContent = {
            products: deleteProductoOncart,
        }

        // Verificando el nuevo contenido del Array
        console.log('newContent***', newContent)

        // Pisando el Carrito Viejo por uno nuevo con los productos que no fueron eliminados 
        const result = await controller.updateCart(cid, newContent)

        // Aca Mandamos la respuesta al cliente
        res.status(200).send({ status: `OK. Product Deleted On Cart ID: ${cid}`, data: result })

    } catch (err) {

        res.status(500).send({ status: 'ERR', data: err.message })

    }

})


// *** 4) Ruta de Prueba para Crear un Ticket 
router.get('/purchase', passportCall('jwtAuth', { session: false }), async (req, res) => {

    try {

        const user = await userController.getByEmail(req.user.payload.username)
        const cart = await controller.getCartById(user.cart)
        console.log(cart)

        // Chequear stock
        const [, toRemove] = await controller.checkCartStock(cart.id)
        console.log('Ya chequeo el stock', toRemove)

        if (toRemove.length > 0) {
            const query = btoa(toRemove.join(','))
            return res.redirect(`/cart/?ids=${query}`)
        }

        console.log('Total', cart.total)
        const amount = cart.total;
        
        // Confirmar pago
        
        // Actualizar stock
        await controller.confirmPurchase(cart.id)

        // Generar ticket
        console.log('Creando el ticket');
        const ticket = await ticketController.addTicket(amount, user.email)
        console.log(ticket);

        return res.redirect(`/tickets/${ticket._id}`)


    } catch (err) {

        console.log(err)

        res.status(500).send({ status: 'ERR', data: err.message })

    }

})



// *** 4) Ruta de Prueba para Crear un Ticket 
router.post('/ticket', passportCall('jwtAuth', { session: false }), async (req, res) => {

    try {
        
        const data = req.body

        const result = await ticketController.addTicket(data)

        res.status(200).send({ status: 'OK. Ticket Creado', data: result })

    } catch (err) {

        console.log(err)

        res.status(500).send({ status: 'ERR', data: err.message })

    }

})



export default router



import { Router } from 'express'
import { ProductsController } from '../controllers/product.controller.mdb.js'
import { CartController } from '../controllers/cart.controller.mdb.js'
import { UsersController } from '../controllers/user.controller.mdb.js'
import { TicketController } from '../controllers/ticket.controller.md.js'
import dayjs from 'dayjs'


// Para Trabajar la Autenticacion con Modulo Passport
import initPassport from '../auth/passport.auth.js' // Importo el Metodo initPassport creado en la carpete config

// Llamando a las funciones creadas en la carpeta Utils para trabajar con JWT
import { generateToken, authToken } from '../utils.js'
import { passportCall } from '../utils.js'// Manejo de JWT y Intercepción de errores para Modulo passport

initPassport() // inicializando instancia de la estrategia local


const router = Router()
const usrController = new UsersController()
const prdController = new ProductsController()
const cartController = new CartController()
const ticketController = new TicketController()


// 1) Endpoint que renderiza Presentacion Proyecto Backend 
router.get('/', (req, res) => {

    // Renderizando la plantilla
    res.render('index', {
        title: 'Presentacion Proyecto Backend Coder'
    })

    // http://localhost:5000/

})


// 2) Ruta Renderiza el formulario de Registro de un Nuevo Usuario  
router.get('/register', async (req, res) => {

    // Acomodar esto y pasarlo a JWT
    if (req.session.user) {
        return res.redirect('/products')
    }

    const context = {}
    const errors = req.query.errors

    if (errors) {
        context.errors = JSON.parse(atob(errors))
    }

    res.render('register', context)// El objeto de parámetros pasamos el context.

    //----- Rutas para USAR del Lado del cliente -----------
    // Para mostrar: http://localhost:5000/register 
})

 
// 3) Endpoint para Renderiza TODOS los Productos Paginados 
// Trabaja con la Funcion passportCall 
router.get('/products', passportCall('jwtAuth', { session: false }), async (req, res) => {

    //console.log('views-PRODUCTS', req.user) // Esta Credencial proviene del middleware "authToken"
    //console.log('views-PRODUCTS-2', req.query) // Verificando que viene por el req.query
   
    const { page, access_token } = req.query;
    //console.log('access_token',access_token)
    
    const user = await usrController.getByEmail(req.user.payload.username);
    const cart = await cartController.getCartById(user.cart)
    
    // Si existen las Credenciales/Payload del usuario Mostramos la Vista de los productos
    if (req.user.payload) {
        
        const products = await prdController.getProducts(10, page)
        //console.log(products.page )
        
        // Renderizando la plantilla de Productos
        res.render('productList', {
            
            title: 'List Products',
            user: {
                email: user.email,
                thumbnail: user?.thumbnail,
            },
            cartId: user.cart,
            products: products.docs.map((prd) => {
                const inCart = cart.products.some((p) => p.product.id === prd._id.toString())
                //console.log(inCart)
                return { ...prd, inCart }
            }), //Aca asigno toda la lista de productos paginados
            accessToken: access_token,// YA NO Estoy pasando el token al cliente por el body - uso passport JWT   
            pagination: {
                prevPage: products.prevPage,
                nextPage: products.nextPage,
                // Aqui se convierte un numero N a un arreglo [1,...,N]
                pages: Array.from({ length: products.totalPages }, (_, i) => i + 1),
                page: products.page,
            }

        })

    } else {

        // sino volvemos al login 
        // Usamo el .redirect() para enviarlo a la plantilla de login
        res.redirect('/login')
   
    }
    

})



router.get('/products/:pid', passportCall('jwtAuth', { session: false }), async (req, res) => {
   
    const { pid } = req.params;

    console.log('pase por la ruta /products/:pid')

    const user = await usrController.getByEmail(req.user.payload.username);
    const cart = await cartController.getCartById(user.cart)
    const product = await prdController.getProductById(pid)

    console.log(product._id.toString())

    res.render('productDetail', {
        product: {

            thumbnail: product.thumbnail,
            title: product.title,
            category: product.category,
            price: product.price,
            pid: product._id.toString()

        },
        user: {
            email: user.email,
            thumbnail: user?.thumbnail,
        },
        route: 'products'

    })
})



router.post('/products/add/:pid', passportCall('jwtAuth', { session: false }), async (req, res) => {
    
    
    const { pid } = req.params

    console.log('Del body que llega: ',req.body)

    const { cantidad } = req.body


    const user = await usrController.getByEmail(req.user.payload.username);
    await cartController.addProductToCart(user.cart, { pid, cantidad });

    res.redirect('/products')
})



router.get('/products/remove/:pid', passportCall('jwtAuth', { session: false }), async (req, res) => {
    const { pid } = req.params

    const user = await usrController.getByEmail(req.user.payload.username);
    await cartController.removeProductFromCart(user.cart, pid);

    res.redirect('/products')
})



router.get('/cart/', passportCall('jwtAuth', { session: false }), async (req, res) => {

    const user = await usrController.getByEmail(req.user.payload.username);
    const cart = await cartController.getCartById(user.cart)
    const { ids } = req.query
    const invalid = atob(ids || '').split(',')

    console.log(cart)

    const products = cart.products.map((product) => {
        return {
            ...product,
            invalid: invalid.includes(product.product.id),
        }
    });

    //console.log(products)

    res.render('cartDetail', {
        user: {
            email: user.email,
            thumbnail: user?.thumbnail,
        },
        products,
        total: cart.total,
    })
})



router.get('/cart/products/:pid', passportCall('jwtAuth', { session: false }), async (req, res) => {
    const { pid } = req.params;

    const user = await usrController.getByEmail(req.user.payload.username);
    const product = await prdController.getProductById(pid)

    res.render('productDetail', {
        product: {
            thumbnail: product.thumbnail,
            title: product.title,
            category: product.category,
            price: product.price,
        },
        user: {
            email: user.email,
            thumbnail: user?.thumbnail,
        },
        route: 'cart',
        pid: product._id.toString(),
    })
})



router.post('/cart/add/:pid', passportCall('jwtAuth', { session: false }), async (req, res) => {
    const { pid } = req.params
    const { cantidad } = req.body

    const user = await usrController.getByEmail(req.user.payload.username);
    await cartController.addProductToCart(user.cart, { pid, cantidad });

    res.redirect('/cart')
})



router.get('/cart/remove/:pid', passportCall('jwtAuth', { session: false }), async (req, res) => {
    const { pid } = req.params

    const user = await usrController.getByEmail(req.user.payload.username);
    await cartController.removeProductFromCart(user.cart, pid);

    res.redirect('/cart')
})


// 4) Endpoint para Renderizar un Carrito Especifico y Mostrar los productos incluidos dentro del Carrito
router.get('/carts/:cid', passportCall('jwtAuth', { session: false }), async (req, res) => {

    console.log(req.params)

    // Desestructuramos lo que nos llega req.params
    const { cid } = req.params
    //console.log("aca", { cid })

    const cart = await cartController.getCartById(cid)

    console.log("aca cart", cart.products)


    // Renderizando la plantilla 
    res.render('carts', {

        title: 'Unique Cart',
        cartId: cart.id,
        products: cart.products,
        total: cart.total

    })

})


router.get('/tickets', passportCall('jwtAuth', { session: false }), async (req, res) => {
    const user = await usrController.getByEmail(req.user.payload.username);
    const tickets = await ticketController.getTicketsByPurchaser(user.email)

    return res.render('ticketList', {
        tickets: tickets.map((ticket) => ({
            code: ticket.code,
            amount: ticket.amount,
            purchase_datetime: dayjs(ticket.purchase_datetime).format('YYYY-MM-DD HH:mm'),
        })),
        user: {
            email: user.email,
            thumbnail: user?.thumbnail
        },
    })
})


router.get('/tickets/:code', passportCall('jwtAuth', { session: false }), async (req, res) => {
    
    const { code } = req.params
    const user = await usrController.getByEmail(req.user.payload.username);
    const ticket = await ticketController.getTicketByCode(code, user.email)

    console.log('verifico el ticket', ticket)

    return res.render('ticketDetail', {

        ticket: {

            code: ticket.code,
            amount: ticket.amount,
            purchase_datetime: dayjs(ticket.purchase_datetime).format('YYYY-MM-DD HH:mm'),
            purchaser: ticket.purchaser,

        },
        user: {

            email: user.email,
            thumbnail: user?.thumbnail,

        },
    })
})


// 5) Endpoint Renderiza el formulario de login de un Usuario
router.get('/login' , async (req, res) => {

    
    // Verificando que viene por req.session.user
    //console.log('views-LOGIN -----> ', req.credentials)

    // Si el usuario tiene Credenciales sigue
    if (req.credentials) {

        console.log('views-LOGIN 2 -----> ', req.credentials)
        
        // como la sesion esta ACTIVA redirecciono la ruta http://localhost:5000/products para que muestre el listo de productos

        res.redirect('/products')

    } else {

        // Como NO esta Activa la Sesion Renderizo la ruta http://localhost:5000/login 
        // Importante: El objeto de parámetros está vacío no necesita datos para enviar, estamos RENDERIZANDO ".render()" la ruta PROPIA Y NO REDIGIENDO a otra, 
        res.render('login', {})

    }

    //----- Rutas para USAR del Lado del cliente -----------
    // Para mostrar: http://localhost:5000/login 
})


// 6) Endpoint Destruir la sesion del usuario y rediccionar al formulario de login
router.get('/logout', async (req, res) => {

    // *** El /logout funciona para Destruir Ambos Casos JWT o Sessiones de Express ***

    // Opcion 1: Destruyendo La cookie Creada para Usar el JWT
    // Al cerrar la sesion del Usuario destruyo la cookie 
    res.clearCookie('cookie-JWT') 
    

    // Opcion 2: Destruir Sesiones de Usuario hechas con Express 
    req.session.destroy((err) => {

        // Si existe un error en proceso de logout lo reporto 
        if (err) {

            res.status(500).send({ status: 'ERR', data: err.message })

            // Sino devuelvo el mensaje exitoso
        } else {

            // Respuesta vieja 
            //res.status(200).send({ status: 'OK', data: 'Sesión finalizada' })

            // Al cerrar la session redirecciono a la "/login"
            res.redirect("/login")

        }
    })
})


// 7) Endpoint que renderiza la plantilla /chat para probar el chat websockets
router.get('/chat', (req, res) => {

    // Renderizando la plantilla /chat
    res.render('chat', {
        title: 'Chat BackendCoder'
    })

    // http://localhost:5000/chat

})


// 8) Ruta  Mostrar restaurar el password de un Usuario 
router.get('/restore', async (req, res) => {

    if (req.session.user) {

        res.redirect('/profile')

    } else {

        // IMPORTANTE
        // Aca estoy capturando el res.redirect(`/restore?error=1`) que viene por el req.query el ? === . en obj
        const passUpdate = req.query.passUpdate // dato que viene como error se lo asigno a la constante creada

        // Verificando el error que viene de "/api/sessions/login"
        console.log('/api/sessions/restore-passUpdate:', req.query)

        // Como NO esta Activa la Sesion Renderizo la ruta http://localhost:5000/login - hace un Get asi mismo 
        // Importante: El objeto de parámetros envio el objeto { errorMessage } 
        // que sera capturado por handlebars en la vista '/login'
        res.render('restore', {

            // IMPORTANTE: esta la variable que toma HANDLEBARS para mostrar el error =  {{#if errorMessage}}
            updateMessage: passUpdate

        })


    }
})


export default router
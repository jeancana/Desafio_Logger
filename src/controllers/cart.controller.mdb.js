
// *** CAPA CONTROLLERS DEL MVC - Para el Manejo Carritos  ***

// Importando el cartServices
// Al importar el cartServices nos traemos todo los metodos de la libreria mongoose 

import cartServices from '../services/cart.service.js'
import { ProductsController } from './product.controller.mdb.js'

const prdController = new ProductsController()

export class CartController {
    
    constructor() {
        // Creo el constructor y lo dejo vacio
    }
    

    //  METODO CREATE = Agregando un carrito a la BD
    async addCart(newCart) {
        
        //console.log(`es addCart --->: `, newCart)
        
        try {
            
            return await cartServices.createCart(newCart)
            
        } catch (err) {
            
            return err.message
            
        }
    }
    
    
    // METODO READ =  Leyendo todos los Carritos creados en la BD
    async getCarts() {
        try {
            
            // uso el metodo .find() que me proporciona mongoose 
            return await cartServices.getCart()
        
            
        } catch (err) {
            
            return err.message
            
        }
        
    }
    
    
    // METODO READ BY ID = Leyendo un(1) Carrito de la BD por su ID
    async getCartById(id, format = true) {
        
        try {
            // uso el metodo .findById(id) que me proporciona mongoose 
            const cart = await cartServices.getCartById(id)

            //console.log(cart)
            if (cart === null) return undefined
            if (!format) return cart
            //console.log(await cart.format())
            return await cart.format()

        } catch (err) {

            return err.message
        }
    }


    // UPDATE = actualizar un Carrito por su ID en la BD
    // Recibe 2 parametros: 
    // El 1er "id" del carrito a actualizar
    // El 2do "newContent" el objeto con la informacion a actualizar
    async updateCart(id, newContent) {

        try {

            // uso el metodo .findByIdAndUpdate() que me proporciona mongoose
            const cart = await cartServices.updateCart(id, newContent)
            return cart

        } catch (err) {

            return err.message
        }
    }


    // Dejando el Carrito Vacio
    async emptyCart(id, newContent) {
        try {

            // uso el metodo .findByIdAndDelete() que me proporciona mongoose
            const cart = await cartServices.updateCart(id, newContent)
            return cart

        } catch (err) {

            return err.message

        }
    }


    // METODO READ BY ID = Leyendo un(1) Carrito de la BD por su ID
    async getCartByIdnotFormat(id, newContent) {

        try {

            // uso el metodo .findById(id) que me proporciona mongoose 
            const cart = await cartServices.updateCart(id, newContent)

            //console.log(cart)

            // Aca hacemos una validacion ternaria a modo de control dentro del return
            return cart === null
                ? 'No se encuentra el Carrito'
                // Usamos el metodo format() creado por nosotros para poder poblar el carrito de forma correcta 
                : cart

        } catch (err) {

            return err.message
        }
    }


    async addProductToCart(id, { pid, cantidad }) {

        //console.log(cantidad, pid)
        try {

            const cart = await cartServices.getCartById(id);

            const products = cart.products.filter(item => item.producto.toString() !== pid);

            const updated = [
                ...products,
                {
                    producto: pid,
                    cantidad,
                }
            ]

            //console.log(updated)

            // Pisando el Carrito Viejo por uno nuevo con los productos que no fueron eliminados 
            const result = await cartServices.updateCart(id, { products: updated });

            return result;

        } catch (err) {

            console.error(err);

            return err.message;
        }
    }

    
    async removeProductFromCart(id, pid) {
        try {
            const cart = await cartServices.getCartById(id);
            console.log('ID', id, cart)
            const products = cart.products.filter(item => item.producto.toString() !== pid);
            console.log('PID', pid, cart.products)

            // Pisando el Carrito Viejo por uno nuevo con los productos que no fueron eliminados 
            const result = await cartServices.updateCart(id, { products });
            return result;
        } catch (err) {
            console.error(err);
            return err.message;
        }
    }

    async checkCartStock(id) {
        try {
            console.log('entro a checkCartStock', id)
            const cart = await cartServices.getCartById(id);
            const valid = []
            const invalid = []

            console.log(cart)

            for (let i = 0; i < cart.products.length; i++) {
                const product = cart.products[i]
                const pid = product.producto
                const hasStock = await prdController.checkProductStock(pid, product.cantidad)
                console.log(pid, hasStock)
                if (hasStock) {
                    valid.push(pid)
                } else {
                    invalid.push(pid)
                }
            }

            return [valid, invalid]
        } catch (err) {
            console.error(err)
            return null
        }
    }

    async confirmPurchase(id) {
        try {
            const cart = await cartServices.getCartById(id);
            for (let i = 0; i < cart.products.length; i++) {
                const pid = cart.products[i].producto
                const cantidad = cart.products[i].cantidad
                await prdController.updateProductStock(pid, cantidad)
            }
            const result = await cartServices.updateCart(id, { products: [] })
            return result
        } catch (err) {
            console.error(err)
            return null
        }
    }



}



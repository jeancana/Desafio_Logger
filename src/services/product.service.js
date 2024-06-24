
// *** CAPA INTERMEDIA DE SERVICIO DEL MVC  ***

// Separa La Capa Controllers y La Capa Model

//MANEJA PERSISTENCIA DE ARCHIVOS EN MongoDB 
import Product from '../models/Product.model.js'

// 1) Servicios para: 
const createProduct = async (product) => {

    //req.logger.info('pase por el Servicio - createProduct')
    console.log("pase por el Servicio - createProduct")
    return await Product.create(product)

}


// 2) Servicios para:
const getProducts = async (criteria, pagination) => {

    //req.logger.info('pase por el Servicio - getProducts')
    console.log("pase por el Servicio - getProducts")
    return await Product.paginate(criteria, pagination)

}


// 3) Servicios para:
const getProductById = async (id) => {

    //req.logger.info('pase por el Servicio - getProductById')
    console.log("pase por el Servicio - getProductById")
    return await Product.findById(id)

}


// 4) Servicios para:
const updateProduct = async (id, newContent) => {

    //req.logger.info('pase por el Servicio - updateProduct')
    console.log("pase por el Servicio - updateProduct")
    return await Product.findByIdAndUpdate(id, newContent)

}


// 5) Servicios para:
const deleteProduct = async (id) => {

    //req.logger.info('pase por el Servicio - deleteProduct')
    console.log("pase por el Servicio - deleteProduct")
    return await Product.findByIdAndDelete(id)

}


// Exportando todos Los Servicios por Defecto
export default {

    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct

};
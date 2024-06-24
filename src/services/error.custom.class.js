/**
 * Clase básica para manejo de errores personalizados
 * Podemos generar las propiedades extra que deseemos agregar
 */


// La clase CustomError Hereda todas las propiedas de la clase Padre Error NATIVA DE EXPRESS
class CustomError extends Error {

    constructor(obj) {

        super(obj.message);
        this.code = obj.code;
        this.origin = obj.origin;
        this.isCustom = obj.isCustom;
        
    }
}

export default CustomError;
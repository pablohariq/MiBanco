const { Console } = require('console')
const {consultarTransacciones, transferirDinero, consultarCuenta} = require('./consultas')

const acciones = {
    transacciones: consultarTransacciones,
    transferir: transferirDinero,
    saldo: consultarCuenta
}

const [accion, ...args] = process.argv.slice(2)

if (acciones[accion]){
    if(args.length == 0 || args.length == 1 || args.length == 4){
        acciones[accion](args)
    }
    else{
        console.log("Los parámetros ingresados no son válidos, intente nuevamente...")
    }
}
else{
    console.log("Los parámetros ingresados no son válidos, intente nuevamente...")
}

//uso de la linea de comandos:
//1. Para consultar por las transacciones
//$ node index.js transacciones 

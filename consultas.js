const {Pool} = require('pg')
const Cursor = require('pg-cursor')
const moment = require('moment')

const config = {
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: "banco",
}

const pool = new Pool(config)

const consultarTransacciones = async (args) => {
    pool.connect( async (err_conexion, client, release) => {
        if (err_conexion) return console.log(err_conexion)
        let cursor
        if (args.length == 0){
            const textoConsulta = `SELECT * FROM transacciones`
            const consulta = new Cursor(textoConsulta)
            cursor = client.query(consulta)
        }
        else{
            const textoConsulta = `SELECT * FROM transacciones WHERE cuenta_origen=$1 OR cuenta_destino=$1`
            const consulta = new Cursor(textoConsulta, [args[0]])
            cursor = client.query(consulta)        
        }
        
        cursor.read(10, (err, rows) => {
            if (err) return console.log(err)
            console.log(rows)
            cursor.close()
            release()
        })
        pool.end()
    })
}

const insertarTransaccion = async (valores) => { // debe ser ejecutada una vez que se valide la transaccion
    pool.connect(async (err_conexion, client, release) => {
        if (err_conexion) return (err_conexion)
        console.log(valores)
        const objQuery = {
            text: `INSERT INTO transacciones (descripcion, monto, cuenta_origen, cuenta_destino, fecha) VALUES($1, $2, $3, $4, $5) RETURNING *;`,
            values: valores,
            rowMode: 'array'
        }
        try{
            const res = await client.query(objQuery)
            console.log(res.rows)
        }
        catch(err_consulta){
            console.log(err_consulta)
        }
        release()
    })
}

const transferirDinero = async (args) => { // debe ser ejecutada una vez que se valide la transaccion
    pool.connect(async (err_conexion, client, release) => {
        if (err_conexion) return console.log(err_conexion)
        //convertir los argumentos monto, cuentaorigen y cuentadestino a sus respectivos tipos
        args[1] = parseFloat(args[1])
        args[2] = parseInt(args[2])
        args[3] = parseInt(args[3])
        try{
            await client.query("BEGIN")
            const descuento = await client.query("UPDATE cuentas SET saldo = saldo-$1 WHERE id=$2 RETURNING *", [args[1], args[2]])
            console.log(descuento.rows)
            const abono = await client.query("UPDATE cuentas SET saldo = saldo+$1 WHERE id=$2 RETURNING *", [args[1], args[3]])
            console.log(abono.rows)
            await client.query("COMMIT")
            //solo si la transaccion es exitosa, registrarla en la tabla de transacciones
            const fecha = `${moment().format("DD-MM-YYYY")}`
            // const [descripcion, monto, cuentaOrigen, cuentaDestino] = args
            const valoresTransaccion = [...args, fecha] 
            await insertarTransaccion(valoresTransaccion)
        }
        catch(err_consulta){
            console.log(err_consulta)
            await client.query("ROLLBACK")
        }
        release()
        pool.end()
    })
}

const consultarCuenta = async (args) => {
    pool.connect(async (err_conexion, client, release) => {
        if (err_conexion) return console.log(err_conexion)
        args[0] = parseInt(args[0])
        const textoConsulta = `SELECT * FROM cuentas WHERE id = $1;`
        const consulta = new Cursor(textoConsulta, args)
        try{
            const cursor = await client.query(consulta)
            cursor.read(10, (err, rows) => {
                if (err) throw err
                console.log(`Saldo de la cuenta con ID ${rows[0].id}: $${rows[0].saldo} `)
                cursor.close()
                release()
            })
        }
        catch(error_consulta){
            console.log(error_consulta)
        }
        pool.end()
    })
}

module.exports = {consultarTransacciones, transferirDinero, consultarCuenta}
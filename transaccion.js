// Importar los módulos necesarios
const { Pool, Cursor } = require('pg');
const pool = new Pool({
  // Configurar los datos de conexión a la base de datos
  user: 'postgres',
  host: 'localhost',
  database: 'banco',
  password: '1234',
  port: 5432,
});

// Crear una función asíncrona que registre una nueva transacción
async function registrarTransaccion(cuentaOrigen, cuentaDestino, monto) {
  try {
    // Iniciar una transacción
    const client = await pool.connect();
    await client.query('BEGIN');

    // Obtener el saldo de la cuenta origen
    const saldoOrigen = await client.query(
      'SELECT saldo FROM cuentas WHERE numero = $1',
      [cuentaOrigen]
    );

    // Verificar que el saldo sea suficiente
    if (saldoOrigen.rows[0].saldo < monto) {
      throw new Error('Saldo insuficiente');
    }

    // Restar el monto al saldo de la cuenta origen
    await client.query(
      'UPDATE cuentas SET saldo = saldo - $1 WHERE numero = $2',
      [monto, cuentaOrigen]
    );

    // Sumar el monto al saldo de la cuenta destino
    await client.query(
      'UPDATE cuentas SET saldo = saldo + $1 WHERE numero = $2',
      [monto, cuentaDestino]
    );

    // Insertar el registro de la transacción
    await client.query(
      'INSERT INTO transacciones (cuenta_origen, cuenta_destino, monto, fecha) VALUES ($1, $2, $3, NOW())',
      [cuentaOrigen, cuentaDestino, monto]
    );

    // Obtener el último registro de la transacción
    const ultimaTransaccion = await client.query(
      'SELECT * FROM transacciones ORDER BY id DESC LIMIT 1'
    );

    // Mostrar por consola la última transacción realizada
    console.log('Última transacción realizada:');
    console.log(ultimaTransaccion.rows[0]);

    // Finalizar la transacción
    await client.query('COMMIT');
    client.release();
  } catch (error) {
    // En caso de error, retornar el error por consola y hacer un rollback
    console.error(error);
    await client.query('ROLLBACK');
    client.release();
  }
}

// Crear una función asíncrona que consulte la tabla de transacciones y 
// retorne máximo 10 registros de una cuenta en específico
async function consultarTransacciones(cuenta) {
  try {
    // Conectar al cliente y crear un cursor con la consulta
    const client = await pool.connect();
    const consulta = new Cursor(
      'SELECT * FROM transacciones WHERE cuenta_origen = $1 OR cuenta_destino = $1 ORDER BY fecha DESC',
      [cuenta]
    );
    const cursor = client.query(consulta);

    // Leer los primeros 10 registros del cursor y mostrarlos por consola
    cursor.read(10, (err, rows) => {
      if (err) {
        throw err;
      }
      console.log(`Transacciones de la cuenta ${cuenta}:`);
      console.log(rows);
      cursor.close();
      client.release();
      pool.end();
    });
  } catch (error) {
    // En caso de error, retornar el error por consola y cerrar el cursor y el cliente
    console.error(error);
    cursor.close();
    client.release();
  }
}

// Crear una función asíncrona que consulte el saldo de una cuenta
async function consultarSaldo(cuenta) {
  try {
    // Conectar al cliente y crear un cursor con la consulta
    const client = await pool.connect();
    const consulta = new Cursor(
      'SELECT saldo FROM cuentas WHERE numero = $1',
      [cuenta]
    );
    const cursor = client.query(consulta);

    // Leer el primer registro del cursor y mostrarlo por consola
    cursor.read(1, (err, row) => {
      if (err) {
        throw err;
      }
      console.log(`Saldo de la cuenta ${cuenta}:`);
      console.log(row[0].saldo);
      cursor.close();
      client.release();
      pool.end();
    });
  } catch (error) {
     // En caso de error, retornar el error por consola y cerrar el cursor y el cliente
     console.error(error);
     cursor.close();
     client.release();
  }
}

// Crear la tabla cuentas y registrar por lo menos 1 cuenta en la tabla con un saldo inicial
async function crearTablaCuentas() {
  try {
    // Conectar al cliente y ejecutar la sentencia para crear la tabla
    const client = await pool.connect();
    await client.query(
      'CREATE TABLE cuentas (numero SERIAL PRIMARY KEY, saldo NUMERIC NOT NULL)'
    );

    // Insertar un registro con un saldo inicial
    await client.query('INSERT INTO cuentas (saldo) VALUES (1000)');

    // Mostrar por consola el mensaje de éxito
    console.log('Tabla cuentas creada y poblada con éxito');
    client.release();
  } catch (error) {
     // En caso de error, retornar el error por consola y cerrar el cliente
     console.error(error);
     client.release();
  }
}

// Ejecutar las funciones según los argumentos ingresados en la línea de comando
const args = process.argv.slice(2);
switch (args[0]) {
  case 'registrar':
    registrarTransaccion(args[1], args[2], args[3]);
    break;
  case 'consultar':
    consultarTransacciones(args[1]);
    break;
  case 'saldo':
    consultarSaldo(args[1]);
    break;
  case 'crear':
    crearTablaCuentas();
    break;
  default:
    console.log('Comando no válido');
}
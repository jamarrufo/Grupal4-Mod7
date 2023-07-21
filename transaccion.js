const pool = require('./conexion');

// Función asíncrona que registra una nueva transacción utilizando valores ingresados como argumentos en la línea de comando.
async function nuevaTransaccion(cuentaOrigen, cuentaDestino, monto) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res1 = await client.query(
      'UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2 RETURNING saldo',
      [monto, cuentaOrigen]
    );
    if (res1.rows.length === 0) {
      throw new Error(`No existe la cuenta ${cuentaOrigen}`);
    }
    const saldoOrigen = res1.rows[0].saldo;
    const res2 = await client.query(
      'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2 RETURNING saldo',
      [monto, cuentaDestino]
    );
    if (res2.rows.length === 0) {
      throw new Error(`No existe la cuenta ${cuentaDestino}`);
    }
    const saldoDestino = res2.rows[0].saldo;
    await client.query('INSERT INTO transacciones (cuenta_origen, cuenta_destino, monto) VALUES ($1, $2, $3)', [
      cuentaOrigen,
      cuentaDestino,
      monto,
    ]);
    await client.query('COMMIT');
    console.log(`Transacción exitosa. Saldo de la cuenta ${cuentaOrigen}: ${saldoOrigen}. Saldo de la cuenta ${cuentaDestino}: ${saldoDestino}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
  }
}

// Función asíncrona que consulta la tabla de transacciones y retorna máximo 10 registros de una cuenta en específico, usando cursores.
async function ultimaTransaccion(cuenta) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT * FROM transacciones WHERE cuenta_origen = $1 OR cuenta_destino = $1 ORDER BY fecha DESC LIMIT 10',
      [cuenta]
    );
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
  }
}

// Función asíncrona que consulta el saldo de una cuenta y que es ejecutada con valores ingresados como argumentos en la línea de comando. Usa cursores para esto.
async function saldoCuenta(cuenta) {
  const client = await pool.connect();
  try {
    const cursorName = 'saldo_cursor';
    await client.query(`DECLARE ${cursorName} CURSOR FOR SELECT saldo FROM cuentas WHERE id = $1`, [cuenta]);
    const cursorRes = await client.query(`FETCH ALL IN ${cursorName}`);
    if (cursorRes.rows.length === 0) {
      throw new Error(`No existe la cuenta ${cuenta}`);
    }
    console.log(`Saldo de la cuenta ${cuenta}: ${cursorRes.rows[0].saldo}`);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
  }
}

module.exports = { nuevaTransaccion, ultimaTransaccion, saldoCuenta };

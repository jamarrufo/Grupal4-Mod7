-- Crear la base de datos banco
CREATE DATABASE banco;


-- Crear la tabla cuentas
CREATE TABLE cuentas (
  numero SERIAL PRIMARY KEY,
  saldo NUMERIC NOT NULL CHECK (saldo >=0)
);

-- Crear la tabla transacciones
CREATE TABLE transacciones (
  id SERIAL PRIMARY KEY,
  cuenta_origen INTEGER REFERENCES cuentas(numero),
  cuenta_destino INTEGER REFERENCES cuentas(numero),
  monto NUMERIC NOT NULL,
  fecha TIMESTAMP NOT NULL
);
 -- Insertar una cuenta con el número 1 y un saldo inicial de 1000
INSERT INTO cuentas (numero, saldo) VALUES (1, 1000);


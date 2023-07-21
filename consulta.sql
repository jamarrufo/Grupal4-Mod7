-- Crear la base de datos
CREATE DATABASE banco;

-- Crear la tabla transacciones
CREATE TABLE transacciones (
  id SERIAL PRIMARY KEY,
  cuenta_origen INTEGER NOT NULL,
  cuenta_destino INTEGER NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  fecha TIMESTAMP DEFAULT NOW()
);

-- Crear la tabla cuentas
CREATE TABLE cuentas (
  id SERIAL PRIMARY KEY,
  saldo NUMERIC(10, 2) NOT NULL
);

-- Registrar por lo menos 1 cuenta en la tabla cuentas con un saldo inicial.
INSERT INTO cuentas (saldo) VALUES (1000);
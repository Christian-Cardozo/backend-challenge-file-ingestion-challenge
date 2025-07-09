import fs from 'fs';
import readline from 'readline';
import { ConnectionPool, Table, config as SqlConfig, NVarChar, Bit, Date as SqlDate, BigInt, VarChar, DateTime } from 'mssql';
import path from 'path';

const BATCH_SIZE = 100;
const MAX_CONCURRENT_INSERTS = 5;

interface Cliente {
  nombreCompleto: string;
  dni: string;
  estado: string;
  fechaIngreso: string;
  esPep: string;
  esSujetoObligado: string;
}

export async function processFile(): Promise<void> {
  const sqlConfig: SqlConfig = {
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    server: process.env.DB_HOST!,
    database: process.env.DB_NAME!,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  const pool = await new ConnectionPool(sqlConfig).connect();

  const filePath = path.resolve(__dirname, '../data/CLIENTES_IN_0425.dat');
  //const filePath = path.resolve(__dirname, '../data/test.dat');
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });

  const inserts: Promise<void>[] = [];
  let batch: Cliente[] = [];

  for await (const line of rl) {

    if (validateRecord(line)) {
      const [nombre, apellido, dni, estado, fechaIngreso, esPep, esSujetoObligado] = line.split('|');

      batch.push({ nombreCompleto: `${nombre} ${apellido}`, dni, estado, fechaIngreso, esPep, esSujetoObligado });

      if (batch.length >= BATCH_SIZE) {
        //inserts.push(insertBatch(pool, batch));
        batch = [];

        if (inserts.length >= MAX_CONCURRENT_INSERTS) {
          await Promise.all(inserts);
          inserts.length = 0;
        }
      }
    }
  }

  if (batch.length > 0) {
    inserts.push(insertBatch(pool, batch));
  }

  await Promise.all(inserts);
  await pool.close();
}

async function insertBatch(pool: ConnectionPool, batch: Cliente[]): Promise<void> {
  const table = new Table('Clientes');
  table.columns.add('NombreCompleto', NVarChar(100), { nullable: false });
  table.columns.add('DNI', BigInt, { nullable: false });
  table.columns.add('Estado', VarChar(10), { nullable: false });
  table.columns.add('FechaIngreso', SqlDate, { nullable: false });
  table.columns.add('EsPEP', Bit, { nullable: false });
  table.columns.add('EsSujetoObligado', Bit, { nullable: true });
  table.columns.add('FechaCreacion', DateTime, { nullable: false });

  for (const row of batch) {
    table.rows.add(
      row.nombreCompleto,
      row.dni,
      row.estado,
      parseDate(row.fechaIngreso),
      row.esPep === 'true',
      row.esSujetoObligado === 'true',
      new Date()
    );
  }

  await pool.request().bulk(table);
}

function parseDate(input: string): Date | null {
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

function validateRecord(input: string): Boolean {

  const line = input.split('|')
  if (line.length !== 7) {
    logInvalidRecord(input, 'Wrong number of fields');
    return false;
  }

  const [nombre, apellido, dni, estado, fechaIngreso, esPep, esSujetoObligado] = line;

  if (nombre.length > 20 || apellido.length > 20) {

    logInvalidRecord(input, 'Nombre or Apellido exceeds 20 characters');
    return false;
  }

  if (!/^\d+$/.test(dni.trim())) {

    logInvalidRecord(input, 'Wrong format for DNI field');
    return false;
  }

  const fecha = new Date(fechaIngreso);
  if (isNaN(fecha.getTime())) {

    logInvalidRecord(input, 'Invalid Date');
    return false;
  }

  if (!["Activo", "Inactivo"].includes(estado)) {

    logInvalidRecord(input, 'Wrong format for Estado field');
    return false
  };

  if (!["true", "false"].includes(esPep)) {

    logInvalidRecord(input, 'Wrong format for esPep field');
    return false
  };

  if (esSujetoObligado && !["true", "false"].includes(esSujetoObligado)) {

    logInvalidRecord(input, 'Wrong format for esSujetoObligado field');
    return false
  };

  return true;
}

function logInvalidRecord(input: string, reason: string) {
  const log = `[${new Date().toISOString()}] ${reason}: ${input}\n`;
  fs.appendFileSync('errors.log', log); // o 'errores.dat' si querés mantener extensión
}

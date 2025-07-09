import fs from 'fs';
import readline from 'readline';
import { ConnectionPool, Table, NVarChar, Bit, Date as SqlDate, BigInt, VarChar, DateTime } from 'mssql';
import path from 'path';
import { getConnection } from '../db/connection';
import { Cliente } from '../models/Cliente';
import { parseDate, validateRecord } from '../utils/validation';

const BATCH_SIZE = 100;
const MAX_CONCURRENT_INSERTS = 5;

export async function processFile(): Promise<void> {
  
  const pool = await getConnection()

  const filePath = path.resolve(__dirname, '../../data/CLIENTES_IN_0425.dat');
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
        inserts.push(insertBatch(pool, batch));
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

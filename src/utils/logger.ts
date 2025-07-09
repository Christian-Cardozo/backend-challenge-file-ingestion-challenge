import fs from 'fs';

export function logInvalidRecord(input: string, reason: string) {
  const log = `[${new Date().toISOString()}] ${reason}: ${input}\n`;
  fs.appendFileSync('errors.log', log); // o 'errores.dat' si querés mantener extensión
}

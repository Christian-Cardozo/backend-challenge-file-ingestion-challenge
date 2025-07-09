import { logInvalidRecord } from "./logger";

export function parseDate(input: string): Date | null {
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

export function validateRecord(input: string): Boolean {

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


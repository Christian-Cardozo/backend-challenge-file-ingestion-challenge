import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { processFile } from './services/processFile';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.post('/process-file', async (_req: Request, res: Response) => {
  try {
    await processFile();
    res.send('Archivo procesado');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al procesar archivo');
  }
});

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});


app.listen(port, async () => {
  console.log(`Microservicio en puerto ${port}`);  
});

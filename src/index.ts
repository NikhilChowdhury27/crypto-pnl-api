import express from 'express';
import router from './routes';
import { fetchLatestPrices } from './prices';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(router);

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

async function startServer(): Promise<void> {
  // Fetch latest prices on startup
  console.log('Fetching latest crypto prices...');
  await fetchLatestPrices();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

startServer();




import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Side, Trade } from './models';
import { applyTrade, getPnlSummary } from './pnlService';
import { getPortfolio } from './portfolioService';

const router = express.Router();

interface AddTradeBody {
  symbol?: string;
  side?: Side;
  price?: number;
  quantity?: number;
  timestamp?: string;
}

router.post('/trades', (req: Request, res: Response) => {
  const body = req.body as AddTradeBody;

  // Ensure symbol is a string before processing
  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : undefined;
  const side = body.side;
  const price = body.price;
  const quantity = body.quantity;

  if (!symbol || symbol.length === 0 || (side !== 'buy' && side !== 'sell') || price == null || quantity == null) {
    return res.status(400).json({ error: 'symbol, side, price and quantity are required' });
  }

  // Validate symbol contains only alphanumeric characters
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    return res.status(400).json({ error: 'symbol must contain only alphanumeric characters' });
  }

  if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
    return res.status(400).json({ error: 'price and quantity must be valid numbers' });
  }

  if (price <= 0 || quantity <= 0) {
    return res.status(400).json({ error: 'price and quantity must be positive' });
  }

  let timestamp: string;
  if (body.timestamp) {
    const date = new Date(body.timestamp);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ error: 'invalid timestamp' });
    }
    timestamp = date.toISOString();
  } else {
    timestamp = new Date().toISOString();
  }

  const trade: Trade = {
    id: randomUUID(),
    symbol,
    side,
    price,
    quantity,
    timestamp
  };

  try {
    applyTrade(trade);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  return res.status(201).json(trade);
});

router.get('/portfolio', (_req: Request, res: Response) => {
  const portfolio = getPortfolio();
  res.json(portfolio);
});

router.get('/pnl', (_req: Request, res: Response) => {
  const pnl = getPnlSummary();
  res.json(pnl);
});

export default router;




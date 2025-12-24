import { describe, it, expect, beforeEach } from 'vitest';
import { Trade } from '../src/models';
import { applyTrade, getPnlSummary } from '../src/pnlService';
import { getPortfolio } from '../src/portfolioService';
import { resetState } from '../src/state';
import { setPrice } from '../src/prices';

// Note: state is module-level and persists across tests in this simple setup.
// To keep things small, we rely on test order and run in a single scenario.

describe('PnL and portfolio logic', () => {
  beforeEach(() => {
    resetState();
    // Set test prices
    setPrice('BTC', 40000);
    setPrice('ETH', 2000);
  });

  it('matches the example from the prompt (average cost method)', () => {
    const trades: Trade[] = [
      {
        id: '1',
        symbol: 'BTC',
        side: 'buy',
        price: 40000,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        symbol: 'BTC',
        side: 'buy',
        price: 42000,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        symbol: 'BTC',
        side: 'sell',
        price: 43000,
        quantity: 1,
        timestamp: new Date().toISOString()
      }
    ];

    for (const t of trades) {
      applyTrade(t);
    }

    const portfolio = getPortfolio();
    const btc = portfolio.find((p) => p.symbol === 'BTC');
    expect(btc).toBeDefined();
    expect(btc?.quantity).toBe(1);
    // Average cost: (40,000 + 42,000) / 2 = 41,000
    expect(btc?.avgEntryPrice).toBe(41000);

    const pnl = getPnlSummary();
    // Realized PnL = (43,000 - 41,000) * 1 = 2,000 with average cost
    expect(pnl.realized.bySymbol.BTC).toBe(2000);
  });

  it('handles multiple symbols with average cost method', () => {
    // BTC: two full round-trips
    const btcTrades: Trade[] = [
      {
        id: 'b1',
        symbol: 'BTC',
        side: 'buy',
        price: 40000,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: 'b2',
        symbol: 'BTC',
        side: 'sell',
        price: 42000,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: 'b3',
        symbol: 'BTC',
        side: 'buy',
        price: 40000,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: 'b4',
        symbol: 'BTC',
        side: 'sell',
        price: 42000,
        quantity: 1,
        timestamp: new Date().toISOString()
      }
    ];

    // ETH: leave one open position to test unrealized PnL
    const ethTrades: Trade[] = [
      {
        id: 'e1',
        symbol: 'ETH',
        side: 'buy',
        price: 2000,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: 'e2',
        symbol: 'ETH',
        side: 'buy',
        price: 2100,
        quantity: 1,
        timestamp: new Date().toISOString()
      },
      {
        id: 'e3',
        symbol: 'ETH',
        side: 'sell',
        price: 2200,
        quantity: 1,
        timestamp: new Date().toISOString()
      }
    ];

    for (const t of [...btcTrades, ...ethTrades]) {
      applyTrade(t);
    }

    const portfolio = getPortfolio();
    const btc = portfolio.find((p) => p.symbol === 'BTC');
    const eth = portfolio.find((p) => p.symbol === 'ETH');

    // BTC: no open position, two round-trips of +2,000 each
    expect(btc).toBeUndefined();

    // ETH: Average cost = (2000 + 2100) / 2 = 2050
    // After selling 1 at 2200, remaining 1 still has avg cost of 2050
    expect(eth).toBeDefined();
    expect(eth?.quantity).toBe(1);
    expect(eth?.avgEntryPrice).toBe(2050);
    // marketPrice = 2000, so unrealized = (2000 - 2050) * 1 = -50
    expect(eth?.unrealizedPnl).toBe(-50);

    const pnl = getPnlSummary();

    // BTC realized: 2 * (42000 - 40000) = 4000
    expect(pnl.realized.bySymbol.BTC).toBe(4000);
    // ETH realized: avg cost is 2050, sold at 2200 => (2200 - 2050) * 1 = +150
    expect(pnl.realized.bySymbol.ETH).toBe(150);
    // Unrealized by symbol should include ETH -50, BTC 0 (no open position)
    expect(pnl.unrealized.bySymbol.ETH).toBe(-50);
    expect(pnl.unrealized.bySymbol.BTC).toBe(0);
  });
});



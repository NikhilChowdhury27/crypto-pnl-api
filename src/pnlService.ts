import { Trade, PnlSummary } from './models';
import { addTradeToStore, getOrCreateSymbolState, getSymbolStates } from './state';
import { getLatestPrice } from './prices';

export function applyTrade(trade: Trade): void {
  const state = getOrCreateSymbolState(trade.symbol);

  if (trade.side === 'buy') {
    // Average cost method: update running average
    const newTotalQuantity = state.openQuantity + trade.quantity;
    const newTotalCost = state.openCost + (trade.price * trade.quantity);

    state.openQuantity = newTotalQuantity;
    state.openCost = newTotalCost;
  } else {
    // Sell: enforce we have enough quantity
    if (trade.quantity > state.openQuantity) {
      throw new Error('Insufficient quantity to sell for symbol ' + trade.symbol);
    }

    // Calculate average entry price
    const avgEntryPrice = state.openQuantity > 0 ? state.openCost / state.openQuantity : 0;

    // Realized PnL = (sell price - avg entry price) * quantity
    const realizedIncrement = (trade.price - avgEntryPrice) * trade.quantity;
    state.realizedPnl += realizedIncrement;

    // Update position: reduce quantity and cost proportionally
    state.openQuantity -= trade.quantity;
    state.openCost -= avgEntryPrice * trade.quantity;
  }

  addTradeToStore(trade);
}

export function getPnlSummary(): PnlSummary {
  const realizedBySymbol: Record<string, number> = {};
  const unrealizedBySymbol: Record<string, number> = {};

  let realizedTotal = 0;
  let unrealizedTotal = 0;

  for (const [symbol, state] of getSymbolStates()) {
    realizedBySymbol[symbol] = state.realizedPnl;
    realizedTotal += state.realizedPnl;

    const latestPrice = getLatestPrice(symbol);
    if (state.openQuantity > 0 && latestPrice !== null) {
      const avgEntry = state.openCost / state.openQuantity;
      const unrealized = (latestPrice - avgEntry) * state.openQuantity;
      unrealizedBySymbol[symbol] = unrealized;
      unrealizedTotal += unrealized;
    } else {
      unrealizedBySymbol[symbol] = 0;
    }
  }

  return {
    realized: {
      bySymbol: realizedBySymbol,
      total: realizedTotal
    },
    unrealized: {
      bySymbol: unrealizedBySymbol,
      total: unrealizedTotal
    }
  };
}




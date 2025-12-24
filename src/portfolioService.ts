import { Position } from './models';
import { getLatestPrice } from './prices';
import { getSymbolStates } from './state';

export function getPortfolio(): Position[] {
  const positions: Position[] = [];

  for (const [symbol, state] of getSymbolStates()) {
    const quantity = state.openQuantity;
    if (quantity === 0) {
      continue;
    }

    const avgEntryPrice = quantity > 0 ? state.openCost / quantity : null;
    const marketPrice = getLatestPrice(symbol);

    let marketValue: number | null = null;
    let unrealizedPnl: number | null = null;

    if (marketPrice !== null && avgEntryPrice !== null) {
      marketValue = marketPrice * quantity;
      unrealizedPnl = (marketPrice - avgEntryPrice) * quantity;
    }

    positions.push({
      symbol,
      quantity,
      avgEntryPrice,
      marketPrice,
      marketValue,
      unrealizedPnl
    });
  }

  return positions;
}




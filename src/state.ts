import { Trade } from './models';

interface SymbolState {
  openQuantity: number;
  openCost: number; // total cost of all open positions (for average cost calculation)
  realizedPnl: number;
}

const trades: Trade[] = [];
const bySymbol: Map<string, SymbolState> = new Map();

export function getAllTrades(): Trade[] {
  return trades;
}

export function getOrCreateSymbolState(symbol: string): SymbolState {
  let state = bySymbol.get(symbol);
  if (!state) {
    state = {
      openQuantity: 0,
      openCost: 0,
      realizedPnl: 0
    };
    bySymbol.set(symbol, state);
  }
  return state;
}

export function getSymbolStates(): Map<string, SymbolState> {
  return bySymbol;
}

export function addTradeToStore(trade: Trade): void {
  trades.push(trade);
}

// Test-only helper to clear in-memory state between runs
export function resetState(): void {
  trades.length = 0;
  bySymbol.clear();
}




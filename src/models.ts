export type Side = 'buy' | 'sell';

export interface Trade {
  id: string;
  symbol: string;
  side: Side;
  price: number;
  quantity: number;
  timestamp: string; // ISO 8601
}

export interface Position {
  symbol: string;
  quantity: number;
  avgEntryPrice: number | null;
  marketPrice: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
}

export interface PnlSummary {
  realized: {
    bySymbol: Record<string, number>;
    total: number;
  };
  unrealized: {
    bySymbol: Record<string, number>;
    total: number;
  };
}




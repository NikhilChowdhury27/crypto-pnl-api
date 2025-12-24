# Portfolio & PnL Tracker

A simple backend service built with Node.js, TypeScript, and Express to track cryptocurrency trades, portfolio holdings, and profit/loss (PnL) calculations.

## Features

1. **Add Trades** - Record buy/sell trades with automatic ID generation
2. **View Portfolio** - Get current holdings with average entry price and unrealized PnL
3. **Calculate PnL** - Track both realized and unrealized profit/loss

## Technical Stack

- **Node.js** + **TypeScript** + **Express**
- In-memory storage (no database)
- Single user assumption
- **Average Cost** method for PnL calculations
- Real-time price fetching from **CoinGecko API**

## Approach & Assumptions

### PnL Calculation Method: Average Cost

I chose the **average cost method** over FIFO because:
- **Simpler logic** - O(1) time complexity per trade vs O(n) for FIFO
- **Less memory** - Only tracks total quantity and cost, no individual lots needed
- **Faster execution** - No need to iterate through purchase history on each sell
- **Matches assignment example** - The PDF example expects average cost calculations

### How It Works

**Average Cost Calculation:**
```
On Buy:
  newTotalCost = existingCost + (buyPrice × buyQuantity)
  newTotalQty = existingQty + buyQuantity
  avgCost = newTotalCost / newTotalQty

On Sell:
  realizedPnL = (sellPrice - avgCost) × sellQuantity
  remainingCost = avgCost × remainingQuantity
```

**Example:**
```
1. Buy 1 BTC @ $40,000 → avg cost = $40,000
2. Buy 1 BTC @ $42,000 → avg cost = $41,000 (total: $82,000 ÷ 2)
3. Sell 1 BTC @ $43,000 → realized PnL = +$2,000 ($43,000 - $41,000)
   Portfolio: 1 BTC remaining @ $41,000 avg cost
```

**Realized vs Unrealized PnL:**
- **Realized PnL**: Actual profit/loss from completed (closed) trades
- **Unrealized PnL**: Potential profit/loss on current holdings based on latest market price

### Price Fetching

- Prices are fetched from **CoinGecko API** (free, no API key required) on server startup
- Cached in memory for the session
- Supports: BTC, ETH, SOL, USDT, BNB, XRP, ADA, DOGE, AVAX, DOT
- Falls back to hardcoded prices if API fails

### Architectural Decisions

**File Structure:**
```
src/
├── index.ts           # Express server setup
├── routes.ts          # API endpoints with validation
├── models.ts          # TypeScript interfaces
├── state.ts           # In-memory data store
├── pnlService.ts      # PnL calculation logic
├── portfolioService.ts # Portfolio aggregation
└── prices.ts          # Price fetching & caching
```

**Why this structure?**
- **Separation of concerns** - Each file has a single responsibility
- **Easy testing** - Pure functions for business logic
- **Type safety** - TypeScript interfaces enforce data contracts
- **Scalable** - Easy to swap in-memory storage with a database later

## API Endpoints

### POST /trades
Add a new trade.

**Request:**
```json
{
  "symbol": "BTC",
  "side": "buy",
  "price": 40000,
  "quantity": 1,
  "timestamp": "2025-01-01T00:00:00Z"  // optional
}
```

**Response (201):**
```json
{
  "id": "uuid-generated",
  "symbol": "BTC",
  "side": "buy",
  "price": 40000,
  "quantity": 1,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Validation:**
- All fields required except `timestamp` (defaults to server time)
- `symbol`: alphanumeric only, auto-uppercased
- `side`: must be "buy" or "sell"
- `price` and `quantity`: must be positive, finite numbers
- Prevents short selling (selling more than you own)

### GET /portfolio
Get current holdings.

**Response (200):**
```json
[
  {
    "symbol": "BTC",
    "quantity": 1.5,
    "avgEntryPrice": 41000,
    "marketPrice": 44000,
    "marketValue": 66000,
    "unrealizedPnl": 4500
  }
]
```

**Fields:**
- `quantity`: Total holdings
- `avgEntryPrice`: Weighted average purchase price
- `marketPrice`: Current market price (from CoinGecko)
- `marketValue`: Current total value (marketPrice × quantity)
- `unrealizedPnl`: Potential profit/loss if sold at current price

### GET /pnl
Get realized and unrealized PnL summary.

**Response (200):**
```json
{
  "realized": {
    "bySymbol": {
      "BTC": 2000,
      "ETH": 150
    },
    "total": 2150
  },
  "unrealized": {
    "bySymbol": {
      "BTC": 3000,
      "ETH": -50
    },
    "total": 2950
  }
}
```

## Running Locally

### Option 1: Using Docker (Recommended)

**Prerequisites:** Docker installed

**Using Docker Compose (easiest):**
```bash
# Start the service
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop the service
docker-compose down

# View logs
docker-compose logs -f
```

**Using Docker directly:**
```bash
# Build the Docker image
docker build -t portfolio-pnl-tracker .

# Run the container
docker run -p 3000:3000 portfolio-pnl-tracker

# Run in detached mode
docker run -d -p 3000:3000 --name pnl-tracker portfolio-pnl-tracker

# Stop the container
docker stop pnl-tracker

# View logs
docker logs pnl-tracker
```

### Option 2: Using Node.js Directly

**Prerequisites:** Node.js (v16+) and npm

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run tests
npm test
```

Server starts on `http://localhost:3000` by default.

### Testing the API

```bash
# Health check
curl http://localhost:3000/

# Add a trade
curl -X POST http://localhost:3000/trades \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "side": "buy",
    "price": 40000,
    "quantity": 1
  }'

# View portfolio
curl http://localhost:3000/portfolio

# View PnL
curl http://localhost:3000/pnl
```

## Tests

Unit tests verify the average cost PnL calculations:

```bash
npm test
```

Tests cover:
- ✅ Average cost calculation across multiple buys
- ✅ Realized PnL on sells
- ✅ Unrealized PnL on remaining positions
- ✅ Multi-symbol independent tracking

## Limitations & Future Improvements

**Current Limitations:**
- In-memory storage (data lost on restart)
- Single user only
- No authentication/authorization
- Prices fetched once at startup (not real-time updates)

**Potential Improvements:**
- Add database persistence (PostgreSQL, MongoDB)
- WebSocket for real-time price updates
- User authentication & multi-user support
- Trade history pagination
- Fee/commission tracking
- Tax reporting (FIFO option for compliance)
- Rate limiting & input sanitization
- Docker containerization

## Notes

- Data is cleared on server restart
- This is a take-home assignment, not production-ready code
- Focus is on correctness, simplicity, and clean architecture

## License

MIT

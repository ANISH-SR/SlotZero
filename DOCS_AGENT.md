# SendAI Integration: Orderbook Control

As the SendAI agent, you have the capability to modify the SlotZero orderbook in real-time. This allows you to simulate market liquidity, test trading strategies, or provide immediate feedback to the user on the dashboard.

## API Endpoint
`POST /api/agent/update-orderbook`

## Authentication
Use the `CRON_SECRET` in the `Authorization` header as a Bearer token.

## Command Payload
```json
{
  "token": "ORCA",
  "currentPrice": 417.82,
  "priceHistory": [417.21, 417.50, 417.40, ...],
  "bids": [
    { "price": 417.80, "amount": 500, "total": 500 },
    { "price": 417.79, "amount": 750, "total": 1250 }
  ],
  "asks": [
    { "price": 417.83, "amount": 200, "total": 200 },
    { "price": 417.84, "amount": 1950, "total": 2150 }
  ]
}
```

## Immediate Visual Feedback
When you call this endpoint, the dashboard will:
1.  **Motion:** Animate the new order rows into view using Framer Motion.
2.  **Chart Synchronization:** Immediately redraw the sparkline chart at the top of the orderbook card.
3.  **MEV Shield Status:** Reflect any private rollup state changes in the status bar.

## Example Usage
To simulate a sudden spike in buy pressure:
1.  Lower the current price slightly in `priceHistory`.
2.  Inject high-volume `bids` near the current price.
3.  Call the endpoint.

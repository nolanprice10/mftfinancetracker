import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { ticker, type = 'stock', range = '1mo', interval = '1d' } = await req.json()
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker symbol is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // For this deployment we prefer to use Yahoo Finance for both stocks and
    // crypto charts/prices. For common crypto identifiers we map to Yahoo
    // tickers (e.g. BTC -> BTC-USD). If the caller passes an explicit Yahoo
    // ticker (contains a dash) we'll use it as-is.
    let queryTicker = ticker;
    if (type === 'crypto') {
      const lower = ticker.toLowerCase();
      const mapping: Record<string, string> = {
        bitcoin: 'BTC-USD',
        btc: 'BTC-USD',
        ethereum: 'ETH-USD',
        eth: 'ETH-USD',
        cardano: 'ADA-USD',
        ada: 'ADA-USD',
        dogecoin: 'DOGE-USD',
        doge: 'DOGE-USD',
        litecoin: 'LTC-USD',
        ltc: 'LTC-USD',
        tether: 'USDT-USD',
        usdt: 'USDT-USD'
      };

      if (mapping[lower]) {
        queryTicker = mapping[lower];
      } else if (!ticker.includes('-')) {
        // If user passed symbol-like input (e.g. 'btc' or 'BTC'), attempt SYMBOL-USD
        if (/^[a-zA-Z0-9]{1,5}$/.test(ticker)) {
          queryTicker = `${ticker.toUpperCase()}-USD`;
        } else {
          // keep the original and hope Yahoo recognizes it; will handle 404 below
          queryTicker = ticker.toUpperCase();
        }
      }
    } else {
      queryTicker = ticker.toUpperCase();
    }

    // Handle stock requests (Yahoo Finance)
    // Use provided range/interval if passed (e.g., range=1d,5d,1mo,3mo,1y and interval=5m,15m,1d)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${queryTicker}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyFinanceTracker/1.0; +https://nolanprice10.github.io/mftfinancetracker/)',
        'Accept': 'application/json,text/plain,*/*'
      }
    })
    if (!response.ok) {
      const text = await response.text()
      return new Response(
        JSON.stringify({ error: `Yahoo response ${response.status}`, success: false, details: text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }
    const data = await response.json()
    
    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const result = data.chart.result[0]
      const price = result.meta.regularMarketPrice
      const currency = result.meta.currency || 'USD'
      const previousClose = result.meta.chartPreviousClose
      const change = previousClose ? ((price - previousClose) / previousClose) * 100 : 0
      
      // Extract historical data
      const timestamps = result.timestamp || []
      const prices = result.indicators?.quote?.[0]?.close || []
      let history = timestamps.map((ts: number, idx: number) => ({
        date: new Date(ts * 1000).toISOString(),
        price: prices[idx] ? Number(prices[idx].toFixed(2)) : null
      })).filter((p: any) => p.price !== null)

      // Ensure history is sorted ascending by date to match Yahoo's chart ordering
      history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // If Yahoo returned insufficient history, synthesize a reasonable history
      if (history.length < 2) {
        // Synthesize history if we still don't have data
        try {
          const points = 20
          const now = Date.now()
          // determine interval seconds from requested interval
          const intervalSeconds = interval === '5m' ? 300 : interval === '15m' ? 900 : 86400
          const generated: { date: string; price: number }[] = []
          const startPrice = previousClose || price
          for (let i = points - 1; i >= 0; i--) {
            const ts = new Date(now - i * intervalSeconds * 1000).toISOString()
            // linear interpolation between startPrice and price
            const t = i / (points - 1)
            const synthesized = Number((startPrice + (price - startPrice) * t).toFixed(2))
            generated.push({ date: ts, price: synthesized })
          }
          history = generated
        } catch (genErr) {
          console.error('Synthesizing history failed:', genErr)
          history = [{ date: new Date().toISOString(), price: Number(price.toFixed(2)) }]
        }
      }

      return new Response(
        JSON.stringify({ 
          ticker: ticker.toUpperCase(), 
          price: Number(price.toFixed(2)),
          change24h: Number(change.toFixed(2)),
          currency,
          history,
          success: true,
          source: 'yahoo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Price not found', success: false, details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
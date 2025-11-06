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
    const { ticker, type = 'stock' } = await req.json()
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker symbol is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Handle crypto requests
    if (type === 'crypto') {
      try {
        // Use CoinGecko API for crypto prices
        const cryptoId = ticker.toLowerCase()
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data[cryptoId]?.usd) {
          const price = data[cryptoId].usd
          const change24h = data[cryptoId].usd_24h_change || 0
          
          // Fetch historical data for chart
          const historyUrl = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=30&interval=daily`
          const historyResponse = await fetch(historyUrl)
          const historyData = await historyResponse.json()
          
          return new Response(
            JSON.stringify({ 
              ticker: ticker.toUpperCase(),
              price: Number(price.toFixed(2)),
              change24h: Number(change24h.toFixed(2)),
              currency: 'USD',
              history: historyData.prices?.slice(-30).map((p: any) => ({
                date: new Date(p[0]).toISOString(),
                price: Number(p[1].toFixed(2))
              })),
              success: true 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          return new Response(
            JSON.stringify({ error: 'Crypto not found', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Crypto API error', success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // Handle stock requests (Yahoo Finance)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=1mo`
    
    const response = await fetch(url)
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
      const history = timestamps.map((ts: number, idx: number) => ({
        date: new Date(ts * 1000).toISOString(),
        price: prices[idx] ? Number(prices[idx].toFixed(2)) : null
      })).filter((p: any) => p.price !== null).slice(-30)
      
      return new Response(
        JSON.stringify({ 
          ticker: ticker.toUpperCase(), 
          price: Number(price.toFixed(2)),
          change24h: Number(change.toFixed(2)),
          currency,
          history,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Stock price not found', success: false }),
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
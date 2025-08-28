// Advanced Technical Indicators Module
// RSI, VWAP, Moving Averages (50 & 200), and comprehensive analysis

export interface TechnicalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp?: number
}

export interface AdvancedTechnicalIndicators {
  rsi: number
  vwap: number
  ma50: number
  ma100: number
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  confidence: number
  analysis: {
    rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL'
    vwapSignal: 'ABOVE' | 'BELOW' | 'AT_LEVEL'
    maSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    trendDirection: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS'
  }
  priceTargets: {
    buyPrice: number
    sellPrice: number
    stopLoss: number
    takeProfit: number
  }
  timeframe: string
  lastUpdated: string
}

export interface MovingAverageData {
  ma50: number
  ma100: number
  goldenCross: boolean // MA50 crosses above MA100
  deathCross: boolean  // MA50 crosses below MA100
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0
  
  const slice = data.slice(-period)
  const sum = slice.reduce((acc, price) => acc + price, 0)
  return sum / period
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0
  if (data.length === 1) return data[0]
  
  const multiplier = 2 / (period + 1)
  let ema = data[0]
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i] * multiplier) + (ema * (1 - multiplier))
  }
  
  return ema
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateAdvancedRSI(data: TechnicalData[], period: number = 14): number {
  if (data.length < period + 1) return 50 // Default neutral RSI
  
  const prices = data.map(d => d.close)
  const gains: number[] = []
  const losses: number[] = []
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  // Calculate average gains and losses
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period
  
  if (avgLoss === 0) return 100 // All gains, maximum RSI
  
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateAdvancedVWAP(data: TechnicalData[]): number {
  if (data.length === 0) return 0

  let totalVolumePrice = 0
  let totalVolume = 0

  data.forEach(point => {
    const typicalPrice = (point.high + point.low + point.close) / 3
    const volumePrice = typicalPrice * point.volume
    
    totalVolumePrice += volumePrice
    totalVolume += point.volume
  })

  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0
}

/**
 * Calculate Moving Averages (50 & 200) with cross analysis
 */
export function calculateMovingAverages(data: TechnicalData[]): MovingAverageData {
  const closePrices = data.map(d => d.close)
  
  const ma50 = calculateSMA(closePrices, 50)
  const ma100 = calculateSMA(closePrices, 100)
  
  // Check for golden cross and death cross
  let goldenCross = false
  let deathCross = false
  
  if (data.length >= 201) { // Need at least 201 data points for reliable cross detection
    const prevMA50 = calculateSMA(closePrices.slice(0, -1), 50)
    const prevMA100 = calculateSMA(closePrices.slice(0, -1), 100)
    
    // Golden Cross: MA50 crosses above MA100
    goldenCross = prevMA50 <= prevMA100 && ma50 > ma100
    
    // Death Cross: MA50 crosses below MA100
    deathCross = prevMA50 >= prevMA100 && ma50 < ma100
  }
  
  // Determine trend
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
  if (ma50 > ma100) {
    trend = 'BULLISH'
  } else if (ma50 < ma100) {
    trend = 'BEARISH'
  }
  
  return {
    ma50: Number(ma50.toFixed(2)),
    ma100: Number(ma100.toFixed(2)),
    goldenCross,
    deathCross,
    trend
  }
}

/**
 * Generate comprehensive technical analysis signals
 */
export function generateAdvancedTechnicalSignals(
  data: TechnicalData[], 
  timeframe: string = '5m'
): AdvancedTechnicalIndicators {
  if (data.length === 0) {
    throw new Error('No data provided for technical analysis')
  }
  
  const currentPrice = data[data.length - 1].close
  const rsi = calculateAdvancedRSI(data)
  const vwap = calculateAdvancedVWAP(data)
  const maData = calculateMovingAverages(data)
  
  // RSI Analysis
  let rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL'
  if (rsi < 30) rsiSignal = 'OVERSOLD'
  else if (rsi > 70) rsiSignal = 'OVERBOUGHT'
  
  // VWAP Analysis
  let vwapSignal: 'ABOVE' | 'BELOW' | 'AT_LEVEL' = 'AT_LEVEL'
  const vwapDeviation = Math.abs(currentPrice - vwap) / vwap
  if (vwapDeviation > 0.005) { // 0.5% threshold
    vwapSignal = currentPrice > vwap ? 'ABOVE' : 'BELOW'
  }
  
  // Moving Average Analysis
  const maSignal = maData.trend === 'BULLISH' ? 'BULLISH' : 
                   maData.trend === 'BEARISH' ? 'BEARISH' : 'NEUTRAL'
  
  // Trend Direction Analysis
  let trendDirection: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' = 'SIDEWAYS'
  const priceAboveMA50 = currentPrice > maData.ma50
  const priceAboveMA100 = currentPrice > maData.ma100
  
  if (priceAboveMA50 && priceAboveMA100 && maData.trend === 'BULLISH') {
    trendDirection = 'UPTREND'
  } else if (!priceAboveMA50 && !priceAboveMA100 && maData.trend === 'BEARISH') {
    trendDirection = 'DOWNTREND'
  }
  
  // Generate overall signal
  let signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD'
  let confidence = 50
  
  // Strong Buy Conditions
  if (rsiSignal === 'OVERSOLD' && vwapSignal === 'BELOW' && maData.goldenCross) {
    signal = 'STRONG_BUY'
    confidence = 85 + Math.min(10, (30 - rsi) * 0.5)
  }
  // Strong Sell Conditions
  else if (rsiSignal === 'OVERBOUGHT' && vwapSignal === 'ABOVE' && maData.deathCross) {
    signal = 'STRONG_SELL'
    confidence = 85 + Math.min(10, (rsi - 70) * 0.5)
  }
  // Buy Conditions
  else if ((rsiSignal === 'OVERSOLD' && vwapSignal === 'BELOW') || 
           (trendDirection === 'UPTREND' && rsi < 50)) {
    signal = 'BUY'
    confidence = 65 + Math.min(15, vwapDeviation * 300)
  }
  // Sell Conditions
  else if ((rsiSignal === 'OVERBOUGHT' && vwapSignal === 'ABOVE') || 
           (trendDirection === 'DOWNTREND' && rsi > 50)) {
    signal = 'SELL'
    confidence = 65 + Math.min(15, vwapDeviation * 300)
  }
  
  // Calculate price targets
  const volatility = calculateVolatility(data)
  const priceTargets = calculatePriceTargets(
    currentPrice, vwap, rsi, maData, volatility, signal
  )
  
  return {
    rsi: Number(rsi.toFixed(2)),
    vwap: Number(vwap.toFixed(2)),
    ma50: maData.ma50,
    ma100: maData.ma100,
    signal,
    confidence: Math.min(95, Math.max(40, Math.round(confidence))),
    analysis: {
      rsiSignal,
      vwapSignal,
      maSignal,
      trendDirection
    },
    priceTargets,
    timeframe,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Calculate price volatility
 */
function calculateVolatility(data: TechnicalData[]): number {
  if (data.length < 20) return 0.02 // Default 2% volatility
  
  const prices = data.slice(-20).map(d => d.close)
  const returns = []
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  
  return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
}

/**
 * Calculate dynamic price targets
 */
function calculatePriceTargets(
  currentPrice: number,
  vwap: number,
  rsi: number,
  maData: MovingAverageData,
  volatility: number,
  signal: string
): {
  buyPrice: number
  sellPrice: number
  stopLoss: number
  takeProfit: number
} {
  const volAdjustment = Math.max(0.01, Math.min(0.05, volatility))
  
  let buyPrice = currentPrice
  let sellPrice = currentPrice
  let stopLoss = currentPrice
  let takeProfit = currentPrice
  
  switch (signal) {
    case 'STRONG_BUY':
      buyPrice = Math.min(currentPrice * 0.995, vwap * 0.99)
      sellPrice = currentPrice * 1.08
      stopLoss = Math.max(currentPrice * 0.92, maData.ma50 * 0.98)
      takeProfit = currentPrice * (1 + volAdjustment * 4)
      break
      
    case 'BUY':
      buyPrice = Math.min(currentPrice * 0.998, vwap * 0.995)
      sellPrice = currentPrice * 1.05
      stopLoss = Math.max(currentPrice * 0.95, maData.ma50 * 0.99)
      takeProfit = currentPrice * (1 + volAdjustment * 2.5)
      break
      
    case 'SELL':
      buyPrice = currentPrice * 0.95
      sellPrice = Math.max(currentPrice * 1.002, vwap * 1.005)
      stopLoss = Math.min(currentPrice * 1.05, maData.ma50 * 1.01)
      takeProfit = currentPrice * (1 - volAdjustment * 2.5)
      break
      
    case 'STRONG_SELL':
      buyPrice = currentPrice * 0.92
      sellPrice = Math.max(currentPrice * 1.005, vwap * 1.01)
      stopLoss = Math.min(currentPrice * 1.08, maData.ma50 * 1.02)
      takeProfit = currentPrice * (1 - volAdjustment * 4)
      break
      
    default: // HOLD
      buyPrice = vwap * 0.99
      sellPrice = vwap * 1.01
      stopLoss = currentPrice * 0.97
      takeProfit = currentPrice * 1.03
  }
  
  return {
    buyPrice: Number(buyPrice.toFixed(2)),
    sellPrice: Number(sellPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    takeProfit: Number(takeProfit.toFixed(2))
  }
}

/**
 * Format advanced technical analysis for display
 */
export function formatAdvancedTechnicalAnalysis(indicators: AdvancedTechnicalIndicators): string {
  const { rsi, vwap, ma50, ma100, signal, confidence, analysis, priceTargets } = indicators
  
  return `
📈 Advanced Technical Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Key Indicators:
• RSI (14): ${rsi} ${analysis.rsiSignal === 'OVERSOLD' ? '🔴 Oversold' : 
              analysis.rsiSignal === 'OVERBOUGHT' ? '🟠 Overbought' : '🟡 Neutral'}
• VWAP: ₹${vwap} ${analysis.vwapSignal === 'ABOVE' ? '⬆️ Above' : 
                   analysis.vwapSignal === 'BELOW' ? '⬇️ Below' : '➡️ At Level'}
• MA50: ₹${ma50}
• MA100: ₹${ma100}

🎯 Trading Signal: ${signal} (${confidence}% confidence)
📊 Trend: ${analysis.trendDirection} | MA: ${analysis.maSignal}

💰 Price Targets:
• Entry (Buy): ₹${priceTargets.buyPrice}
• Exit (Sell): ₹${priceTargets.sellPrice}
• Stop Loss: ₹${priceTargets.stopLoss}
• Take Profit: ₹${priceTargets.takeProfit}
  `.trim()
}

"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, Clock, Target, X, Zap, Timer, BarChart, Plus, Minus, RefreshCw } from "lucide-react"
import { AdvancedTechnicalIndicators, formatAdvancedTechnicalAnalysis } from '@/lib/advanced-technical-indicators'

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  timestamp: Date
  signal: string
  confidence: number
  pnl?: number
  exitPrice?: number
  holdTime?: number // in minutes
}

interface Position {
  symbol: string
  quantity: number
  avgBuyPrice: number
  currentValue: number
  unrealizedPnL: number
  entryTime: Date
  targetPrice?: number
  stopLossPrice?: number
}

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  technicalAnalysis?: AdvancedTechnicalIndicators
  isLoading?: boolean
  error?: string
}

interface IntradayScalpingTraderProps {
  technicalData: { [symbol: string]: any }
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

// Comprehensive scalping watchlist (high-volume, liquid stocks)
const SCALPING_WATCHLIST = [
  // Banking & Financial Services
  'HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK',
  'INDUSINDBK', 'FEDERALBNK', 'BANDHANBNK', 'IDFCFIRSTB', 'PNB',
  'BANKBARODA', 'CANBK', 'UNIONBANK', 'INDIANB', 'CENTRALBK',
  'HDFCLIFE', 'SBILIFE', 'ICICIGI', 'BAJFINANCE', 'BAJAJFINSV',
  'CHOLAFIN', 'M&MFIN', 'LICHSGFIN', 'MANAPPURAM', 'MUTHOOTFIN',
  
  // Information Technology
  'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM',
  'LTI', 'MINDTREE', 'MPHASIS', 'LTTS', 'COFORGE',
  'PERSISTENT', 'OFSS', 'HEXAWARE', 'NIITTECH', 'CYIENT',
  
  // Oil & Gas
  'RELIANCE', 'ONGC', 'IOC', 'BPCL', 'HINDPETRO',
  'GAIL', 'OIL', 'MGL', 'IGL', 'PETRONET',
  
  // Automobiles
  'MARUTI', 'HYUNDAI', 'M&M', 'TATAMOTORS', 'BAJAJ-AUTO',
  'HEROMOTOCO', 'TVSMOTORS', 'EICHERMOT', 'ASHOKLEY', 'BHARATFORG',
  'MOTHERSUMI', 'BOSCHLTD', 'MRF', 'APOLLOTYRE', 'BALKRISIND',
  
  // Pharmaceuticals
  'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'LUPIN',
  'AUROPHARMA', 'BIOCON', 'CADILAHC', 'GLENMARK', 'TORNTPHARM',
  'ABBOTINDIA', 'PFIZER', 'GLAXO', 'SANOFI', 'NATCOPHARM',
  
  // FMCG
  'HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR',
  'MARICO', 'COLPAL', 'GODREJCP', 'EMAMILTD', 'TATACONSUM',
  'UBL', 'RADICO', 'MCDOWELL-N', 'HAVELLS', 'VGUARD',
  
  // Metals & Mining
  'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'COALINDIA',
  'SAIL', 'NMDC', 'JINDALSTEL', 'NATIONALUM', 'MOIL',
  'ADANIENT', 'WELCORP', 'RATNAMANI', 'APLAPOLLO',
  
  // Cement
  'ULTRACEMCO', 'SHREECEM', 'GRASIM', 'ACC', 'AMBUJACEMENT',
  'JKCEMENT', 'RAMCOCEM', 'HEIDELBERG', 'PRISMCEMENT', 'STARCEMENT',
  
  // Telecom
  'BHARTIARTL', 'IDEA', 'INDUS', 'TATACOMM', 'GTPL',
  
  // Power & Utilities
  'NTPC', 'POWERGRID', 'ADANIPOWER', 'TATAPOWER', 'NHPC',
  'BHEL', 'CROMPTON', 'KEI', 'POLYCAB',
  
  // Real Estate & Construction
  'LT', 'DLF', 'GODREJPROP', 'OBEROIRLTY', 'BRIGADE',
  'PRESTIGE', 'SOBHA', 'PHOENIXLTD', 'MAHLIFE', 'SUNTECK',
  
  // Consumer Durables
  'BAJAJELECTRIC', 'WHIRLPOOL', 'BLUESTARCO', 'VOLTAS', 'AMBER',
  'DIXON', 'SYMPHONY', 'ORIENTELEC', 'TTK', 'RAJESHEXPO',
  
  // Capital Goods
  'ABB', 'SIEMENS', 'SCHNEIDER', 'CUMMINSIND', 'THERMAX',
  'KECL', 'NCLIND', 'GRAPHITE', 'TIINDIA', 'GRINDWELL',
  
  // Paints & Chemicals
  'ASIANPAINT', 'BERGER', 'AKZONOBEL', 'KANSAINER', 'INDIACEM',
  'PIDILITIND', 'AAVAS', 'DEEPAKNTR', 'TATACHEM', 'BALRAMCHIN',
  'GNFC', 'CHAMBLFERT', 'COROMANDEL', 'RALLIS', 'UPL',
  
  // Textiles
  'VARDHMAN', 'WELSPUNIND', 'TRIDENT', 'RAYMOND', 'ARVIND',
  'ALOKTEXT', 'KPR', 'SIYARAM', 'RSWM', 'SUTLEJTEX',
  
  // Media & Entertainment
  'ZEEL', 'SUNTV', 'NETWORK18', 'TV18BRDCST', 'JAGRAN',
  'DBCORP', 'TIPS', 'EROS', 'PVR', 'INOXLEISUR',
  
  // Airlines & Tourism
  'INDIGO', 'SPICEJET', 'IRCTC', 'EIHLTD',
  'LEMONTREE', 'CHALET', 'COX&KINGS', 'THOMASCOOK', 'MAHLOG',
  
  // Agriculture & Food Processing
  'VARUN', 'KRBL', 'LAXMIMILLS', 'VSTTILLERS',
  'ESCORTS', 'MAHINDRA', 'SONALIKA', 'GULFOILLUB'
]

export default function IntradayScalpingTrader({ technicalData, isEnabled, onToggle }: IntradayScalpingTraderProps) {
  // Trading state
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [totalPnL, setTotalPnL] = useState(0)
  const [dayPnL, setDayPnL] = useState(0)
  const [tradingBalance, setTradingBalance] = useState(50000) // ₹50,000 for intraday
  const [availableBalance, setAvailableBalance] = useState(50000)

  // Intraday/Scalping specific settings (more aggressive)
  const [minConfidence, setMinConfidence] = useState(50) // Lower confidence for more trades
  const [maxPositionSize, setMaxPositionSize] = useState(10000) // ₹10,000 per trade
  const [riskPerTrade, setRiskPerTrade] = useState(2.0) // 2% risk per trade
  const [maxDailyLoss, setMaxDailyLoss] = useState(2500) // ₹2,500 max daily loss
  const [maxPositions, setMaxPositions] = useState(5) // Up to 5 simultaneous positions
  const [stopLossPercent, setStopLossPercent] = useState(1.5) // Tighter 1.5% stop loss
  const [takeProfitPercent, setTakeProfitPercent] = useState(2.2) // Realistic 2.2% take profit
  const [maxHoldTime, setMaxHoldTime] = useState(15) // Faster 15 minutes hold time
  const [scalingFactor, setScalingFactor] = useState(2) // 2x faster decision making

  // Refs for intervals and timeouts
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTradeRef = useRef<{ [symbol: string]: number }>({})
  const positionTimeoutRef = useRef<{ [symbol: string]: NodeJS.Timeout }>({})

  // Watchlist state
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([])
  const [customSymbol, setCustomSymbol] = useState('')
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false)
  const [lastWatchlistUpdate, setLastWatchlistUpdate] = useState<Date | null>(null)

  // Close position based on time limit
  const closePositionOnTime = (symbolToClose: string) => {
    console.log(`⏰ Time-based exit for ${symbolToClose}`)
    closePosition(symbolToClose, 'Time Exit')
  }

  // Enhanced close position function for scalping
  const closePosition = (symbolToClose: string, reason: string = 'Manual Close') => {
    console.log(`🚪 Closing ${symbolToClose} - Reason: ${reason}`)
    
    const position = positions.find(p => p.symbol === symbolToClose)
    if (!position) return

    const currentPrice = technicalData[symbolToClose]?.quote?.regularMarketPrice || position.avgBuyPrice
    const holdTimeMinutes = Math.floor((Date.now() - position.entryTime.getTime()) / (1000 * 60))
    
    // Calculate actual P&L based on position type
    let actualPnL = 0
    if (position.quantity > 0) {
      // Long position: profit when price goes up
      actualPnL = (currentPrice - position.avgBuyPrice) * position.quantity
    } else {
      // Short position: profit when price goes down
      actualPnL = (position.avgBuyPrice - currentPrice) * Math.abs(position.quantity)
    }
    
    const sellTrade: Trade = {
      id: `scalp-exit-${Date.now()}`,
      symbol: symbolToClose,
      type: position.quantity > 0 ? 'SELL' : 'BUY', // Close long with SELL, close short with BUY
      price: currentPrice,
      quantity: Math.abs(position.quantity),
      timestamp: new Date(),
      signal: reason,
      confidence: 100,
      pnl: actualPnL,
      exitPrice: currentPrice,
      holdTime: holdTimeMinutes
    }
    
    const updatedPositions = positions.filter(p => p.symbol !== symbolToClose)
    const updatedTrades = [...trades, sellTrade]
    
    // Calculate the original amount that was deducted when opening the position
    let originalDeduction = 0
    if (position.quantity > 0) {
      // Long position: we deducted the full cost when buying
      originalDeduction = Math.abs(position.quantity) * position.avgBuyPrice
    } else {
      // Short position: we only deducted 20% margin when shorting
      const totalValue = Math.abs(position.quantity) * position.avgBuyPrice
      originalDeduction = totalValue * 0.2
    }
    
    // For closing positions: return the original amount deducted + actual P&L
    const newAvailableBalance = availableBalance + originalDeduction + actualPnL
    const newTotalPnL = totalPnL + actualPnL
    const newDayPnL = dayPnL + actualPnL
    
    console.log(`🔍 Balance Calculation for ${symbolToClose} (${position.quantity > 0 ? 'LONG' : 'SHORT'}):`)
    console.log(`  - Original Deduction: ₹${originalDeduction.toFixed(2)}`)
    console.log(`  - Actual P&L: ₹${actualPnL.toFixed(2)}`)
    console.log(`  - Previous Balance: ₹${availableBalance.toFixed(2)}`)
    console.log(`  - Balance Change: +₹${originalDeduction.toFixed(2)} + ₹${actualPnL.toFixed(2)} = +₹${(originalDeduction + actualPnL).toFixed(2)}`)
    console.log(`  - New Balance: ₹${newAvailableBalance.toFixed(2)}`)
    
    setPositions(updatedPositions)
    setTrades(updatedTrades)
    setAvailableBalance(newAvailableBalance)
    setTotalPnL(newTotalPnL)
    setDayPnL(newDayPnL)
    
    // Clear timeout for this position
    if (positionTimeoutRef.current[symbolToClose]) {
      clearTimeout(positionTimeoutRef.current[symbolToClose])
      delete positionTimeoutRef.current[symbolToClose]
    }
    
    console.log(`✅ ${symbolToClose} closed: ${holdTimeMinutes}min hold, P&L: ₹${actualPnL.toFixed(2)}`)
    saveScalpingData(updatedTrades, updatedPositions, newTotalPnL, newDayPnL, undefined, newAvailableBalance)
  }

  // Save scalping data to localStorage
  const saveScalpingData = (newTrades?: Trade[], newPositions?: Position[], newTotalPnL?: number, newDayPnL?: number, newBalance?: number, newAvailableBalance?: number) => {
    try {
      const scalpingData = {
        trades: newTrades || trades,
        positions: newPositions || positions,
        totalPnL: newTotalPnL !== undefined ? newTotalPnL : totalPnL,
        dayPnL: newDayPnL !== undefined ? newDayPnL : dayPnL,
        tradingBalance: newBalance !== undefined ? newBalance : tradingBalance,
        availableBalance: newAvailableBalance !== undefined ? newAvailableBalance : availableBalance,
        lastUpdated: new Date().toISOString(),
        settings: {
          minConfidence, maxPositionSize, riskPerTrade, maxDailyLoss,
          maxPositions, stopLossPercent, takeProfitPercent, maxHoldTime, scalingFactor
        }
      }
      
      localStorage.setItem('intradayScalpingData', JSON.stringify(scalpingData))
      localStorage.setItem('intradayScalpingHistory', JSON.stringify(newTrades || trades))
      console.log('💾 Scalping data saved')
    } catch (error) {
      console.error('❌ Error saving scalping data:', error)
    }
  }

  // Debug function for balance issues
  const debugBalance = () => {
    console.log('🔍 BALANCE DEBUG:')
    console.log('Trading Balance:', tradingBalance)
    console.log('Current Available Balance:', availableBalance)
    console.log('Used Amount:', tradingBalance - availableBalance)
    console.log('Total Trades:', trades.length)
    
    let totalSpent = 0
    let totalReceived = 0
    
    trades.forEach((trade, i) => {
      const amount = trade.price * trade.quantity
      if (trade.type === 'BUY') {
        totalSpent += amount
        console.log(`${i+1}. SPENT ₹${amount.toFixed(2)} on ${trade.type} ${trade.symbol}`)
      } else if (trade.type === 'SELL') {
        totalReceived += amount
        console.log(`${i+1}. RECEIVED ₹${amount.toFixed(2)} from ${trade.type} ${trade.symbol}`)
      }
    })
    
    console.log('Total Spent:', totalSpent.toFixed(2))
    console.log('Total Received:', totalReceived.toFixed(2))
    console.log('Calculated Balance:', (tradingBalance - totalSpent + totalReceived).toFixed(2))
    
    // Reset to calculated balance
    const calculatedBalance = tradingBalance - totalSpent + totalReceived
    setAvailableBalance(calculatedBalance)
  }

  // Load data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('intradayScalpingData')
      if (savedData) {
        const data = JSON.parse(savedData)
        setTrades((data.trades || []).map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp)
        })))
        setPositions((data.positions || []).map((pos: any) => ({
          ...pos,
          entryTime: new Date(pos.entryTime)
        })))
        setTotalPnL(data.totalPnL || 0)
        setDayPnL(data.dayPnL || 0)
        setTradingBalance(data.tradingBalance || 50000)
        
        // Fix negative balance issue - ensure minimum balance
        const savedBalance = data.availableBalance || 50000
        const fixedBalance = savedBalance < 0 ? 50000 : savedBalance
        setAvailableBalance(fixedBalance)
        
        if (data.settings) {
          setMinConfidence(data.settings.minConfidence || 75)
          setMaxPositionSize(data.settings.maxPositionSize || 10000)
          setRiskPerTrade(data.settings.riskPerTrade || 1.5)
          setMaxDailyLoss(data.settings.maxDailyLoss || 2500)
          setMaxPositions(data.settings.maxPositions || 5)
          setStopLossPercent(data.settings.stopLossPercent || 0.8)
          setTakeProfitPercent(data.settings.takeProfitPercent || 1.2)
          setMaxHoldTime(data.settings.maxHoldTime || 30)
          setScalingFactor(data.settings.scalingFactor || 2)
        }
      }
    } catch (error) {
      console.error('❌ Error loading scalping data:', error)
    }
  }, [])

  // Fetch advanced technical analysis for scalping
  const fetchScalpingTechnicalAnalysis = useCallback(async (symbol: string) => {
    try {
      console.log(`🔍 Fetching scalping analysis for ${symbol}`)
      
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: [symbol],
          interval: '1m', // 1-minute intervals for scalping
          period: '1d',   // 1-day period for intraday
          timeframe: '1m'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Scalping API response for ${symbol}:`, data)
      console.log(`📊 Quote data for ${symbol}:`, data.results?.[symbol]?.quote)
      console.log(`📈 Technical analysis for ${symbol}:`, data.results?.[symbol]?.technicalAnalysis)
      
      return data.results?.[symbol] || null
    } catch (error) {
      console.error(`❌ Error fetching scalping analysis for ${symbol}:`, error)
      return null
    }
  }, [])

  // Initialize watchlist with scalping stocks
  useEffect(() => {
    const initializeWatchlist = async () => {
      setIsWatchlistLoading(true)
      
      const stockPromises = SCALPING_WATCHLIST.map(async (symbol) => {
        const data = await fetchScalpingTechnicalAnalysis(symbol)
        return {
          symbol,
          name: symbol,
          price: data?.quote?.regularMarketPrice || 0,
          change: data?.quote?.regularMarketChange || 0,
          changePercent: data?.quote?.regularMarketChangePercent || 0,
          technicalAnalysis: data?.technicalAnalysis,
          isLoading: false,
          error: data ? undefined : 'Failed to load'
        }
      })

      const stocksData = await Promise.all(stockPromises)
      setWatchlistStocks(stocksData)
      setLastWatchlistUpdate(new Date())
      setIsWatchlistLoading(false)
    }

    initializeWatchlist()
  }, [fetchScalpingTechnicalAnalysis])

  // Add custom stock to watchlist
  const addCustomStock = async () => {
    if (!customSymbol.trim()) return
    
    const symbol = customSymbol.toUpperCase().includes('.NS') ? customSymbol.toUpperCase() : `${customSymbol.toUpperCase()}.NS`
    
    if (watchlistStocks.some(stock => stock.symbol === symbol)) {
      setCustomSymbol('')
      return
    }

    setWatchlistStocks(prev => [...prev, {
      symbol,
      name: symbol.replace('.NS', ''),
      price: 0,
      change: 0,
      changePercent: 0,
      isLoading: true
    }])

    const data = await fetchScalpingTechnicalAnalysis(symbol)
    setWatchlistStocks(prev => prev.map(stock => 
      stock.symbol === symbol 
        ? {
            ...stock,
            price: data?.quote?.regularMarketPrice || 0,
            change: data?.quote?.regularMarketChange || 0,
            changePercent: data?.quote?.regularMarketChangePercent || 0,
            technicalAnalysis: data?.technicalAnalysis,
            isLoading: false,
            error: data ? undefined : 'Failed to load'
          }
        : stock
    ))
    setCustomSymbol('')
  }

  // Remove stock from watchlist
  const removeStock = (symbol: string) => {
    setWatchlistStocks(prev => prev.filter(stock => stock.symbol !== symbol))
  }

  // Refresh all watchlist stocks
  const refreshWatchlist = async () => {
    setIsWatchlistLoading(true)
    
    const updatedStocks = await Promise.all(
      watchlistStocks.map(async (stock) => {
        const data = await fetchScalpingTechnicalAnalysis(stock.symbol)
        return {
          ...stock,
          price: data?.quote?.regularMarketPrice || stock.price,
          change: data?.quote?.regularMarketChange || stock.change,
          changePercent: data?.quote?.regularMarketChangePercent || stock.changePercent,
          technicalAnalysis: data?.technicalAnalysis || stock.technicalAnalysis,
          error: data ? undefined : 'Failed to refresh'
        }
      })
    )
    
    setWatchlistStocks(updatedStocks)
    setLastWatchlistUpdate(new Date())
    setIsWatchlistLoading(false)
  }

  // Auto-refresh watchlist every 10 seconds for scalping
  useEffect(() => {
    const interval = setInterval(() => {
      if (watchlistStocks.length > 0) {
        refreshWatchlist()
      }
    }, 10000) // 10 seconds for scalping

    return () => clearInterval(interval)
  }, [watchlistStocks.length])

  // Enhanced scalping analysis with faster signals
  const analyzeScalpingSignal = (symbol: string, data: any) => {
    if (!data?.technicalAnalysis) return null

    const { rsi, vwap, ma50, ma100 } = data.technicalAnalysis
    const currentPrice = data.quote?.regularMarketPrice || 0
    
    if (!rsi || !vwap || !ma50 || !ma100 || !currentPrice) return null

    let signal = 'HOLD'
    let confidence = 0

    // Adjust RSI sensitivity based on confidence threshold
    // Lower confidence threshold = more aggressive trading
    const isAggressiveMode = minConfidence <= 60
    const rsiOversoldLevel = isAggressiveMode ? 45 : 35  // More aggressive oversold
    const rsiOverboughtLevel = isAggressiveMode ? 55 : 65  // More aggressive overbought
    
    const rsiOversold = rsi <= rsiOversoldLevel
    const rsiOverbought = rsi >= rsiOverboughtLevel

    // Price position relative to moving averages
    const aboveVWAP = currentPrice > vwap
    const aboveMA50 = currentPrice > ma50
    const aboveMA100 = currentPrice > ma100
    
    // MA trend (faster MA above slower MA)
    const bullishMATrend = ma50 > ma100
    const bearishMATrend = ma50 < ma100

    // Calculate base confidence based on multiple confirmations
    let baseConfidence = 50

    // Enhanced scalping BUY signals (more aggressive)
    if (rsi <= 30 && aboveVWAP && bullishMATrend) {
      signal = 'STRONG_BUY'
      confidence = 95
    } else if (rsi <= 35 && aboveVWAP && aboveMA50) {
      signal = 'BUY'
      confidence = 85
    } else if (rsiOversold && aboveVWAP) {
      signal = 'BUY'
      confidence = 80
    } else if (rsi <= 50 && aboveVWAP && bullishMATrend) {
      signal = 'BUY'
      confidence = 75
    } else if (rsi <= 55 && aboveVWAP && aboveMA50 && isAggressiveMode) {
      signal = 'BUY'
      confidence = 65
    } else if (rsi <= 60 && aboveVWAP && isAggressiveMode) {
      signal = 'BUY'
      confidence = 55  // Very aggressive entry
    }

    // Enhanced scalping SELL signals (more aggressive)
    else if (rsi >= 70 && !aboveVWAP && bearishMATrend) {
      signal = 'STRONG_SELL'
      confidence = 95
    } else if (rsi >= 65 && !aboveVWAP && currentPrice < ma50) {
      signal = 'SELL'
      confidence = 85
    } else if (rsiOverbought && !aboveVWAP) {
      signal = 'SELL'
      confidence = 80
    } else if (rsi >= 50 && !aboveVWAP && bearishMATrend) {
      signal = 'SELL'
      confidence = 75
    } else if (rsi >= 45 && !aboveVWAP && currentPrice < ma50 && isAggressiveMode) {
      signal = 'SELL'
      confidence = 65
    } else if (rsi >= 40 && !aboveVWAP && isAggressiveMode) {
      signal = 'SELL'
      confidence = 55  // Very aggressive entry
    }

    // Momentum scalping for very aggressive mode (catch trends early)
    else if (isAggressiveMode && bullishMATrend && aboveVWAP && rsi >= 40 && rsi <= 60) {
      signal = 'BUY'
      confidence = 60
    } else if (isAggressiveMode && bearishMATrend && !aboveVWAP && rsi >= 40 && rsi <= 60) {
      signal = 'SELL'
      confidence = 60
    }
    
    // Ultra-aggressive momentum trades (catch any trend)
    else if (isAggressiveMode && bullishMATrend && rsi >= 35) {
      signal = 'BUY'
      confidence = 52
    } else if (isAggressiveMode && bearishMATrend && rsi <= 65) {
      signal = 'SELL'
      confidence = 52
    }

    // Log signal generation for debugging when confidence meets threshold
    if (signal !== 'HOLD' && confidence >= minConfidence) {
      console.log(`🎯 ${symbol} Signal: ${signal} (${confidence}% >= ${minConfidence}%) | RSI: ${rsi.toFixed(1)} | Price: ₹${currentPrice.toFixed(2)} | VWAP: ₹${vwap.toFixed(2)}`)
      console.log(`📊 ${symbol} Analysis: SL: ${(currentPrice * (1 - 2.5/100)).toFixed(2)} | TP: ${(currentPrice * (1 + 4.0/100)).toFixed(2)}`)
    }

    return { signal, confidence, rsi, vwap, ma50, ma100, currentPrice }
  }

  // Execute scalping trade
  const executeScalpingTrade = async (symbol: string, analysis: any) => {
    console.log(`🔍 Checking execution for ${symbol}: enabled=${isEnabled}, analysis=${JSON.stringify(analysis)}`)
    
    if (!isEnabled || !analysis) {
      console.log(`❌ ${symbol}: Execution blocked - enabled=${isEnabled}, analysis=${!!analysis}`)
      return
    }

    const { signal, confidence, currentPrice } = analysis
    if (confidence < minConfidence) {
      console.log(`❌ ${symbol}: Confidence ${confidence}% below threshold ${minConfidence}%`)
      return
    }

    console.log(`💯 ${symbol}: Signal passed confidence check! ${signal} at ${confidence}% (threshold: ${minConfidence}%)`)

    const existingPosition = positions.find(p => p.symbol === symbol)
    const now = Date.now()
    const lastTrade = lastTradeRef.current[symbol] || 0
    
    // Ultra-fast cooldown for aggressive scalping (5 seconds instead of 10)
    if (now - lastTrade < 5000) {
      console.log(`❌ ${symbol}: Cooldown active (${((now - lastTrade) / 1000).toFixed(1)}s ago)`)
      return
    }

    // Check if we've hit daily loss limit
    if (Math.abs(dayPnL) >= maxDailyLoss) {
      console.log('🛑 Daily loss limit reached, stopping scalping')
      return
    }

    console.log(`✅ ${symbol}: Ready to execute ${signal} (${confidence}%) - existing position: ${!!existingPosition}`)

    // BUY logic for scalping
    if ((signal === 'STRONG_BUY' || signal === 'BUY') && !existingPosition && positions.length < maxPositions) {
      console.log(`🟢 ${symbol}: Executing BUY order`)
      if (availableBalance < 500) {  // Lower minimum balance requirement
        console.log(`❌ ${symbol}: Insufficient balance (₹${availableBalance})`)
        return
      }

      const quantity = Math.floor(Math.min(maxPositionSize, availableBalance * 0.9) / currentPrice)  // Use 90% of available balance
      if (quantity <= 0) {
        console.log(`❌ ${symbol}: Quantity calculation failed: ${quantity}`)
        return
      }

      const totalCost = quantity * currentPrice
      const stopLossPrice = currentPrice * (1 - stopLossPercent / 100)
      const targetPrice = currentPrice * (1 + takeProfitPercent / 100)

      const trade: Trade = {
        id: `scalp-${Date.now()}-${symbol}`,
        symbol,
        type: 'BUY',
        price: currentPrice,
        quantity,
        timestamp: new Date(),
        signal,
        confidence,
        pnl: 0
      }

      const newPosition: Position = {
        symbol,
        quantity,
        avgBuyPrice: currentPrice,
        currentValue: totalCost,
        unrealizedPnL: 0,
        entryTime: new Date(),
        targetPrice,
        stopLossPrice
      }

      const newTrades = [trade, ...trades]
      const newPositions = [...positions, newPosition]
      const newAvailableBalance = availableBalance - totalCost

      console.log(`💰 BUY Balance Update for ${symbol}:`)
      console.log(`  - Investment: ₹${totalCost.toFixed(2)}`)
      console.log(`  - Previous Balance: ₹${availableBalance.toFixed(2)}`)
      console.log(`  - New Balance: ₹${newAvailableBalance.toFixed(2)}`)

      setTrades(newTrades)
      setPositions(newPositions)
      setAvailableBalance(newAvailableBalance)

      // Set timeout to close position after max hold time
      positionTimeoutRef.current[symbol] = setTimeout(() => {
        closePositionOnTime(symbol)
      }, maxHoldTime * 60 * 1000)

      console.log(`🚀 Scalping BUY: ${symbol} - ${quantity} @ ₹${currentPrice.toFixed(2)} (${confidence}% confidence)`)
      saveScalpingData(newTrades, newPositions, undefined, undefined, undefined, newAvailableBalance)
      lastTradeRef.current[symbol] = now
    }

    // SELL logic for scalping - can open short positions or close long positions
    else if (signal === 'STRONG_SELL' || signal === 'SELL') {
      console.log(`🔴 ${symbol}: Processing SELL signal`)
      // If we have a long position, close it
      if (existingPosition) {
        console.log(`🔄 ${symbol}: Closing existing long position`)
        closePosition(symbol, `${signal} Signal`)
        lastTradeRef.current[symbol] = now
      }
      // If no position and we can open new positions, open a short position
      else if (positions.length < maxPositions) {
        console.log(`🔻 ${symbol}: Opening new short position`)
        if (availableBalance < 500) {  // Lower minimum balance for shorts too
          console.log(`❌ ${symbol}: Insufficient balance for short (₹${availableBalance})`)
          return
        }

        const quantity = Math.floor(Math.min(maxPositionSize, availableBalance * 0.9) / currentPrice)  // Use 90% of available balance
        if (quantity <= 0) {
          console.log(`❌ ${symbol}: Short quantity calculation failed: ${quantity}`)
          return
        }

        const totalCost = quantity * currentPrice
        const stopLossPrice = currentPrice * (1 + stopLossPercent / 100) // Stop loss above current price for short
        const targetPrice = currentPrice * (1 - takeProfitPercent / 100) // Target below current price for short

        const trade: Trade = {
          id: `scalp-${Date.now()}-${symbol}`,
          symbol,
          type: 'SELL',
          price: currentPrice,
          quantity,
          timestamp: new Date(),
          signal,
          confidence,
          pnl: 0
        }

        // For short positions, we track negative quantity
        const newPosition: Position = {
          symbol,
          quantity: -quantity, // Negative for short position
          avgBuyPrice: currentPrice,
          currentValue: -totalCost, // Negative for short
          unrealizedPnL: 0,
          entryTime: new Date(),
          targetPrice,
          stopLossPrice
        }

        const newTrades = [trade, ...trades]
        const newPositions = [...positions, newPosition]
        // For short selling, reserve margin but don't reduce full balance like a buy
        const marginRequired = totalCost * 0.2 // 20% margin for short position
        const newAvailableBalance = availableBalance - marginRequired

        console.log(`💰 SELL Balance Update for ${symbol}:`)
        console.log(`  - Total Position Value: ₹${totalCost.toFixed(2)}`)
        console.log(`  - Margin Required (20%): ₹${marginRequired.toFixed(2)}`)
        console.log(`  - Previous Balance: ₹${availableBalance.toFixed(2)}`)
        console.log(`  - New Balance: ₹${newAvailableBalance.toFixed(2)}`)

        setTrades(newTrades)
        setPositions(newPositions)
        setAvailableBalance(newAvailableBalance)

        // Set timeout to close position after max hold time
        positionTimeoutRef.current[symbol] = setTimeout(() => {
          closePositionOnTime(symbol)
        }, maxHoldTime * 60 * 1000)

        console.log(`🔻 Scalping SHORT: ${symbol} - ${quantity} @ ₹${currentPrice.toFixed(2)} (${confidence}% confidence)`)
        saveScalpingData(newTrades, newPositions, undefined, undefined, undefined, newAvailableBalance)
        lastTradeRef.current[symbol] = now
      } else {
        console.log(`❌ ${symbol}: Maximum positions reached (${positions.length}/${maxPositions})`)
      }
    } else {
      console.log(`📊 ${symbol}: Signal ${signal} (${confidence}%) - no action taken`)
    }
  }

  // Check for profit targets and stop losses
  const checkExitConditions = () => {
    if (positions.length === 0) return

    console.log(`🔍 Checking exit conditions for ${positions.length} positions...`)
    
    positions.forEach(position => {
      const watchlistStock = watchlistStocks.find(stock => stock.symbol === position.symbol)
      const currentPrice = watchlistStock?.price
      
      if (!currentPrice) {
        console.log(`⚠️ ${position.symbol}: No current price data available`)
        return
      }

      const isShort = position.quantity < 0
      const priceChange = ((currentPrice - position.avgBuyPrice) / position.avgBuyPrice) * 100
      const holdTimeMinutes = Math.floor((Date.now() - position.entryTime.getTime()) / (1000 * 60))

      console.log(`📊 ${position.symbol}: Current ₹${currentPrice.toFixed(2)} vs Entry ₹${position.avgBuyPrice.toFixed(2)} | Change: ${priceChange.toFixed(2)}% | Hold: ${holdTimeMinutes}min | ${isShort ? 'SHORT' : 'LONG'}`)

      if (isShort) {
        // For short positions: profit when price goes down, loss when price goes up
        console.log(`  Short targets: Take Profit at ${-takeProfitPercent}% (current: ${priceChange.toFixed(2)}%), Stop Loss at ${stopLossPercent}%`)
        if (priceChange <= -takeProfitPercent) { // Price dropped = profit for short
          console.log(`🎯 ${position.symbol}: SHORT Take Profit triggered! ${priceChange.toFixed(2)}% <= ${-takeProfitPercent}%`)
          closePosition(position.symbol, 'Take Profit (Short)')
        }
        else if (priceChange >= stopLossPercent) { // Price rose = loss for short
          console.log(`🛑 ${position.symbol}: SHORT Stop Loss triggered! ${priceChange.toFixed(2)}% >= ${stopLossPercent}%`)
          closePosition(position.symbol, 'Stop Loss (Short)')
        }
      } else {
        // For long positions: profit when price goes up, loss when price goes down
        console.log(`  Long targets: Take Profit at ${takeProfitPercent}% (current: ${priceChange.toFixed(2)}%), Stop Loss at ${-stopLossPercent}%`)
        if (priceChange >= takeProfitPercent) {
          console.log(`🎯 ${position.symbol}: LONG Take Profit triggered! ${priceChange.toFixed(2)}% >= ${takeProfitPercent}%`)
          closePosition(position.symbol, 'Take Profit')
        }
        else if (priceChange <= -stopLossPercent) {
          console.log(`🛑 ${position.symbol}: LONG Stop Loss triggered! ${priceChange.toFixed(2)}% <= ${-stopLossPercent}%`)
          closePosition(position.symbol, 'Stop Loss')
        }
      }

      // Time-based exit check
      if (holdTimeMinutes >= maxHoldTime) {
        console.log(`⏰ ${position.symbol}: Max hold time reached (${holdTimeMinutes}min >= ${maxHoldTime}min)`)
        closePosition(position.symbol, 'Time Exit')
      }
    })
  }

  // Main scalping execution loop (faster interval)
  useEffect(() => {
    if (isEnabled && watchlistStocks.length > 0) {
      intervalRef.current = setInterval(() => {
        watchlistStocks.forEach(stock => {
          if (stock.technicalAnalysis) {
            const stockData = {
              quote: {
                regularMarketPrice: stock.price,
                regularMarketChange: stock.change,
                regularMarketChangePercent: stock.changePercent
              },
              technicalAnalysis: stock.technicalAnalysis
            }
            const analysis = analyzeScalpingSignal(stock.symbol, stockData)
            if (analysis) {
              // Log signals for debugging
              if (analysis.confidence >= minConfidence) {
                console.log(`📈 ${stock.symbol}: ${analysis.signal} (${analysis.confidence}%) - RSI:${analysis.rsi.toFixed(1)}, Price:${analysis.currentPrice}, VWAP:${analysis.vwap.toFixed(2)}, MA50:${analysis.ma50.toFixed(2)}`)
              }
              executeScalpingTrade(stock.symbol, analysis)
            }
          }
        })
        checkExitConditions()
      }, 1500 / scalingFactor) // Ultra-fast: 0.75 seconds with 2x scaling factor

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isEnabled, watchlistStocks, minConfidence, maxPositionSize, riskPerTrade, scalingFactor])

  // Reset all data
  const resetScalpingData = () => {
    setTrades([])
    setPositions([])
    setTotalPnL(0)
    setDayPnL(0)
    setAvailableBalance(50000)
    setTradingBalance(50000)
    
    // Clear all timeouts
    Object.values(positionTimeoutRef.current).forEach(timeout => clearTimeout(timeout))
    positionTimeoutRef.current = {}
    
    localStorage.removeItem('intradayScalpingData')
    localStorage.removeItem('intradayScalpingHistory')
    console.log('🧹 All scalping data reset')
  }

  // Reset balance only (for when balance goes negative)
  const resetBalance = () => {
    const newBalance = 50000
    setAvailableBalance(newBalance)
    setTradingBalance(newBalance)
    setTotalPnL(0)
    setDayPnL(0)
    
    // Save the updated balance
    saveScalpingData(trades, positions, 0, 0, newBalance, newBalance)
    console.log('💰 Balance reset to ₹50,000')
  }

  // Debug function to recalculate balance based on trades
  const recalculateBalance = () => {
    console.log('🔍 === COMPREHENSIVE BALANCE AUDIT ===')
    const initialBalance = 50000
    let calculatedBalance = initialBalance
    let calculatedPnL = 0
    
    console.log(`Starting balance: ₹${initialBalance.toLocaleString()}`)
    console.log('')
    
    // Track balance changes through all trades
    const tradeHistory: Array<{action: string, amount: number, balance: number, symbol: string}> = []
    
    trades.forEach((trade, index) => {
      const tradeValue = Math.abs(trade.quantity) * trade.price
      let balanceChange = 0
      let action = ''
      
      if (trade.exitPrice !== undefined && trade.holdTime !== undefined) {
        // This is a closing trade
        const pnl = trade.pnl || 0
        calculatedPnL += pnl
        
        if (trade.type === 'SELL') {
          // Closing a long position: return original investment + P&L
          balanceChange = tradeValue + pnl
          action = `CLOSE LONG: +₹${tradeValue.toFixed(2)} + P&L ₹${pnl.toFixed(2)}`
        } else if (trade.type === 'BUY') {
          // Closing a short position: return margin + P&L
          const margin = tradeValue * 0.2
          balanceChange = margin + pnl
          action = `CLOSE SHORT: +₹${margin.toFixed(2)} + P&L ₹${pnl.toFixed(2)}`
        }
        calculatedBalance += balanceChange
      } else {
        // This is an opening trade
        if (trade.type === 'BUY') {
          // Opening long position: deduct full amount
          balanceChange = -tradeValue
          action = `OPEN LONG: -₹${tradeValue.toFixed(2)}`
        } else if (trade.type === 'SELL') {
          // Opening short position: deduct margin only
          const margin = tradeValue * 0.2
          balanceChange = -margin
          action = `OPEN SHORT: -₹${margin.toFixed(2)} margin`
        }
        calculatedBalance += balanceChange
      }
      
      tradeHistory.push({
        action: `${index + 1}. ${trade.symbol} ${action}`,
        amount: balanceChange,
        balance: calculatedBalance,
        symbol: trade.symbol
      })
    })
    
    // Print detailed history
    tradeHistory.forEach(entry => {
      console.log(`${entry.action} | Balance: ₹${entry.balance.toFixed(2)}`)
    })
    
    console.log('')
    console.log('💰 FINAL RESULTS:')
    console.log(`Calculated Balance: ₹${calculatedBalance.toFixed(2)}`)
    console.log(`Current Balance: ₹${availableBalance.toFixed(2)}`)
    console.log(`Calculated P&L: ₹${calculatedPnL.toFixed(2)}`)
    console.log(`Current P&L: ₹${totalPnL.toFixed(2)}`)
    console.log(`Balance Difference: ₹${(availableBalance - calculatedBalance).toFixed(2)}`)
    console.log('')
    
    // Apply corrections
    if (Math.abs(availableBalance - calculatedBalance) > 0.01) {
      console.log('🔧 Applying balance correction...')
      setAvailableBalance(calculatedBalance)
      setTotalPnL(calculatedPnL)
      setDayPnL(calculatedPnL)
      saveScalpingData(trades, positions, calculatedPnL, calculatedPnL, undefined, calculatedBalance)
      console.log('✅ Balance corrected!')
    } else {
      console.log('✅ Balance is accurate!')
    }
    console.log('=====================================')
  }

  // Calculate today's trades
  const today = new Date().toDateString()
  const todayTrades = trades.filter(trade => trade.timestamp.toDateString() === today)

  // Debug logging for P&L issues
  const debugTradeAnalysis = () => {
    console.log('🔍 === COMPREHENSIVE TRADE ANALYSIS ===')
    console.log(`Available Balance: ₹${availableBalance.toFixed(2)}`)
    console.log(`Total P&L: ₹${totalPnL.toFixed(2)}`)
    console.log(`Day P&L: ₹${dayPnL.toFixed(2)}`)
    console.log(`Active Positions: ${positions.length}`)
    console.log('')
    
    // Group trades by symbol for better analysis
    const tradesBySymbol = trades.reduce((acc, trade) => {
      if (!acc[trade.symbol]) acc[trade.symbol] = []
      acc[trade.symbol].push(trade)
      return acc
    }, {} as Record<string, Trade[]>)
    
    Object.entries(tradesBySymbol).forEach(([symbol, symbolTrades]) => {
      console.log(`📊 ${symbol} Trades:`)
      let symbolPnL = 0
      symbolTrades.forEach((trade, index) => {
        const isCompleted = trade.exitPrice !== undefined && trade.holdTime !== undefined
        const pnl = trade.pnl || 0
        symbolPnL += pnl
        
        console.log(`  ${index + 1}. ${trade.type} ${trade.quantity} @ ₹${trade.price.toFixed(2)} | Completed: ${isCompleted} | P&L: ₹${pnl.toFixed(2)}`)
        if (isCompleted && trade.exitPrice) {
          console.log(`     Exit: ₹${trade.exitPrice.toFixed(2)} | Hold: ${trade.holdTime}min`)
        }
      })
      console.log(`  Symbol Total P&L: ₹${symbolPnL.toFixed(2)}`)
      console.log('')
    })
    
    // Check for balance discrepancies
    const completedTrades = trades.filter(t => t.exitPrice !== undefined && t.holdTime !== undefined)
    const totalCompletedPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    console.log(`Completed Trades P&L: ₹${totalCompletedPnL.toFixed(2)}`)
    console.log('===============================================')
  }

  useEffect(() => {
    if (trades.length > 0) {
      console.log('🔍 CURRENT TRADES DEBUG:')
      trades.slice(0, 5).forEach((trade, i) => {
        console.log(`${i + 1}. ${trade.type} ${trade.symbol}: ₹${trade.price} x ${trade.quantity} = ₹${(trade.price * trade.quantity).toFixed(2)} | P&L: ₹${(trade.pnl || 0).toFixed(2)}`)
      })
      console.log(`Available Balance: ₹${availableBalance.toFixed(2)}`)
      console.log(`Total P&L: ₹${totalPnL.toFixed(2)}`)
      console.log(`Day P&L: ₹${dayPnL.toFixed(2)}`)
    }
  }, [trades, availableBalance, totalPnL, dayPnL])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle>⚡ Intraday Scalping Trader</CardTitle>
                <CardDescription>High-frequency trading with RSI, VWAP, MA50 & MA100</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="scalping-enabled" className="text-sm font-medium">
                {isEnabled ? '🟢 Active' : '🔴 Inactive'}
              </Label>
              <Switch
                id="scalping-enabled"
                checked={isEnabled}
                onCheckedChange={onToggle}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="font-medium text-orange-800">Speed</div>
              <div className="text-orange-600">{scalingFactor}x Faster</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Max Hold</div>
              <div className="text-blue-600">{maxHoldTime} mins</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">Take Profit</div>
              <div className="text-green-600">{takeProfitPercent}%</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="font-medium text-red-800">Stop Loss</div>
              <div className="text-red-600">{stopLossPercent}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scalping Settings */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Scalping Configuration</CardTitle>
          <CardDescription>Optimized for intraday and scalping strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scalp-confidence">Min Confidence (%)</Label>
              <Input
                id="scalp-confidence"
                type="number"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                placeholder="e.g., 75"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Lower for faster entries</p>
            </div>
            <div>
              <Label htmlFor="scalp-position">Max Position Size (₹)</Label>
              <Input
                id="scalp-position"
                type="number"
                value={maxPositionSize}
                onChange={(e) => setMaxPositionSize(Number(e.target.value))}
                placeholder="e.g., 10000"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Per trade amount</p>
            </div>
            <div>
              <Label htmlFor="scalp-risk">Risk Per Trade (%)</Label>
              <Input
                id="scalp-risk"
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                step="0.1"
                placeholder="e.g., 1.5"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Risk percentage</p>
            </div>
            <div>
              <Label htmlFor="scalp-stop">Stop Loss (%)</Label>
              <Input
                id="scalp-stop"
                type="number"
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(Number(e.target.value))}
                step="0.1"
                placeholder="e.g., 0.8"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Tight stop loss</p>
            </div>
            <div>
              <Label htmlFor="scalp-profit">Take Profit (%)</Label>
              <Input
                id="scalp-profit"
                type="number"
                value={takeProfitPercent}
                onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                step="0.1"
                placeholder="e.g., 1.2"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Quick profit target</p>
            </div>
            <div>
              <Label htmlFor="scalp-time">Max Hold Time (min)</Label>
              <Input
                id="scalp-time"
                type="number"
                value={maxHoldTime}
                onChange={(e) => setMaxHoldTime(Number(e.target.value))}
                placeholder="e.g., 30"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-exit time</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">⚡ Scalping Features</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Ultra-fast execution: {3 / scalingFactor} second intervals</p>
              <p>• Aggressive RSI levels: 35/65 (vs normal 30/70)</p>
              <p>• Time-based exits: Maximum {maxHoldTime} minute holds</p>
              <p>• Tight risk management: {stopLossPercent}% stop loss, {takeProfitPercent}% take profit</p>
              <p>• High-frequency signals with VWAP + MA crossovers</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">🎯 Optimization Tips</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>For More Trades:</strong> Lower confidence to 50-60% (current: {minConfidence}%)</p>
              <p><strong>Better Risk/Reward:</strong> Stop Loss: 2-3%, Take Profit: 3-5% (current: {stopLossPercent}%/{takeProfitPercent}%)</p>
              <p><strong>Optimal Hold Time:</strong> 15-45 minutes (current: {maxHoldTime} min)</p>
              <p><strong>Position Size:</strong> Consider smaller amounts for more diversification</p>
              {stopLossPercent <= 1.5 && <p className="text-orange-600"><strong>⚠️ Stop Loss too tight!</strong> Consider 2-3% for better profit ratio</p>}
              {takeProfitPercent <= 1.5 && <p className="text-orange-600"><strong>⚠️ Take Profit too small!</strong> Consider 3-5% for better returns</p>}
              {minConfidence >= 75 && <p className="text-orange-600"><strong>⚠️ Confidence too high!</strong> Consider 50-65% for more signals</p>}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Optimized scalping preset
                setMinConfidence(55)
                setStopLossPercent(2.5)
                setTakeProfitPercent(4.0)
                setMaxHoldTime(20)
                setRiskPerTrade(2.0)
                console.log('🎯 Applied optimized scalping preset: 55% confidence, 2.5% SL, 4% TP, 20min hold')
              }}
              className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              🎯 Optimize Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => saveScalpingData()}
              className="text-xs"
            >
              Save Now
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetScalpingData}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              Reset All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={recalculateBalance}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              Fix Balance
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugTradeAnalysis}
              className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
            >
              Debug Trades
            </Button>
          </div>

          {/* Auto-Trading Control */}
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Auto-Trading</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automated execution control</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-green-600" : "bg-gray-500"}>
                  {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
                <Switch
                  id="scalping-auto-trading"
                  checked={isEnabled}
                  onCheckedChange={onToggle}
                />
              </div>
            </div>
            
            {isEnabled && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Interval:</span>
                    <span className="ml-2 font-medium">{3 / scalingFactor}s</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
                    <span className="ml-2 font-medium">{minConfidence}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Max Size:</span>
                    <span className="ml-2 font-medium">₹{maxPositionSize.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hold Time:</span>
                    <span className="ml-2 font-medium">{maxHoldTime}min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className={`text-lg font-semibold ${availableBalance < 0 ? 'text-red-600' : ''}`}>
                    ₹{availableBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              {availableBalance < 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetBalance}
                  className="text-xs h-8"
                  title="Reset balance to ₹50,000"
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Today's P&L</p>
                <p className={`text-lg font-semibold ${dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dayPnL >= 0 ? '+' : ''}₹{dayPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Active Positions</p>
                <p className="text-lg font-semibold">{positions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Today's Trades</p>
                <p className="text-lg font-semibold">{todayTrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Profit & Loss Analysis</CardTitle>
          <CardDescription>Comprehensive trading performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today's Performance */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Today's Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Day P&L:</span>
                  <span className={`font-medium ${dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dayPnL >= 0 ? '+' : ''}₹{dayPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trades Today:</span>
                  <span className="font-medium">{todayTrades.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate:</span>
                  <span className="font-medium">
                    {todayTrades.length > 0 
                      ? `${((todayTrades.filter(t => (t.pnl || 0) > 0).length / todayTrades.length) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Performance */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Overall Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total P&L:</span>
                  <span className={`font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Trades:</span>
                  <span className="font-medium">{trades.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overall Win Rate:</span>
                  <span className="font-medium">
                    {trades.length > 0 
                      ? `${((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Position Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Current Positions</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Positions:</span>
                  <span className="font-medium">{positions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Unrealized P&L:</span>
                  <span className={`font-medium ${
                    positions.reduce((sum, pos) => {
                      const watchlistStock = watchlistStocks.find(s => s.symbol === pos.symbol)
                      const currentPrice = watchlistStock?.price || pos.avgBuyPrice
                      return sum + ((currentPrice - pos.avgBuyPrice) * pos.quantity)
                    }, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(() => {
                      const unrealizedPnL = positions.reduce((sum, pos) => {
                        const watchlistStock = watchlistStocks.find(s => s.symbol === pos.symbol)
                        const currentPrice = watchlistStock?.price || pos.avgBuyPrice
                        return sum + ((currentPrice - pos.avgBuyPrice) * pos.quantity)
                      }, 0)
                      return `${unrealizedPnL >= 0 ? '+' : ''}₹${unrealizedPnL.toFixed(2)}`
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Balance:</span>
                  <span className={`font-medium ${availableBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{availableBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* P&L Chart Summary */}
          {trades.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-sm mb-3">Recent Trade Performance</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  // Calculate trade performance metrics
                  const completedTrades = trades.filter(t => t.pnl !== undefined && t.exitPrice !== undefined)
                  const winningTrades = completedTrades.filter(t => (t.pnl || 0) > 0)
                  const losingTrades = completedTrades.filter(t => (t.pnl || 0) < 0)
                  const totalGains = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
                  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
                  
                  console.log('🔍 Trade Performance Debug:', {
                    totalTrades: trades.length,
                    completedTrades: completedTrades.length,
                    winningTrades: winningTrades.length,
                    losingTrades: losingTrades.length,
                    totalGains,
                    totalLosses
                  })
                  
                  return (
                    <>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-semibold text-green-600">
                          {winningTrades.length}
                        </div>
                        <div className="text-xs text-green-700">Winning Trades</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-semibold text-red-600">
                          {losingTrades.length}
                        </div>
                        <div className="text-xs text-red-700">Losing Trades</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">
                          ₹{totalGains.toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-700">Total Gains</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-semibold text-orange-600">
                          ₹{totalLosses.toFixed(2)}
                        </div>
                        <div className="text-xs text-orange-700">Total Losses</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Positions */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Active Scalping Positions</CardTitle>
          <CardDescription>Real-time positions with time limits</CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No active positions</p>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => {
                const watchlistStock = watchlistStocks.find(stock => stock.symbol === position.symbol)
                const currentPrice = watchlistStock?.price || position.avgBuyPrice
                const isShort = position.quantity < 0
                const absQuantity = Math.abs(position.quantity)
                
                // Calculate P&L based on position type
                let unrealizedPnL, pnlPercent
                if (isShort) {
                  // For short positions: profit when current price < avg sell price
                  unrealizedPnL = (position.avgBuyPrice - currentPrice) * absQuantity
                  pnlPercent = ((position.avgBuyPrice - currentPrice) / position.avgBuyPrice) * 100
                } else {
                  // For long positions: profit when current price > avg buy price
                  unrealizedPnL = (currentPrice - position.avgBuyPrice) * position.quantity
                  pnlPercent = ((currentPrice - position.avgBuyPrice) / position.avgBuyPrice) * 100
                }
                
                const holdTimeMinutes = Math.floor((Date.now() - position.entryTime.getTime()) / (1000 * 60))
                const timeRemaining = Math.max(0, maxHoldTime - holdTimeMinutes)
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {isShort ? 'SHORT' : 'LONG'} {absQuantity} @ ₹{position.avgBuyPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current: ₹{currentPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-orange-600">
                        Hold: {holdTimeMinutes}min | Remaining: {timeRemaining}min
                      </div>
                    </div>
                    <div className="text-right mr-3">
                      <div className={`font-medium ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{unrealizedPnL.toFixed(2)}
                      </div>
                      <div className={`text-sm ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </div>
                      <div className={`text-sm ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closePosition(position.symbol, 'Manual Close')}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300"
                      title={`Close ${position.symbol} position`}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Scalping Trades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 Recent Scalping Trades ({todayTrades.length} today)</CardTitle>
              <CardDescription>Latest trading activity with P&L details</CardDescription>
            </div>
            {trades.length > 0 && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  Today: <span className={`${dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dayPnL >= 0 ? '+' : ''}₹{dayPnL.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Win Rate: {todayTrades.length > 0 
                    ? `${((todayTrades.filter(t => (t.pnl || 0) > 0).length / todayTrades.length) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No trades executed yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {trades.slice(0, 20).map((trade) => {
                // Enhanced P&L calculation for each trade with complete details
                let displayPnL = trade.pnl || 0
                let displayPnLPercent = 0
                let isCompletedTrade = false
                let tradeStatus = 'ACTIVE'
                let tradeAction: string = trade.type
                let entryPrice = trade.price
                let exitPrice = null
                let positionDirection = trade.type === 'BUY' ? 'LONG' : 'SHORT'
                
                // A trade is completed ONLY if it has both exitPrice AND holdTime
                // exitPrice being same as price means no real price movement occurred
                if (trade.exitPrice !== undefined && trade.holdTime !== undefined) {
                  isCompletedTrade = true
                  tradeStatus = 'COMPLETED'
                  exitPrice = trade.exitPrice
                  
                  // Use the P&L that was already calculated during position closing
                  displayPnL = trade.pnl || 0
                  
                  // Calculate percentage based on the actual P&L and entry price
                  if (trade.price !== 0) {
                    const investmentValue = Math.abs(trade.quantity) * trade.price
                    displayPnLPercent = (displayPnL / investmentValue) * 100
                  }
                  
                  // Determine trade flow for display
                  if (trade.type === 'SELL') {
                    positionDirection = 'LONG → CLOSED'
                    tradeAction = 'SELL (Close Long)'
                  } else if (trade.type === 'BUY') {
                    positionDirection = 'SHORT → CLOSED'
                    tradeAction = 'BUY (Cover Short)'
                  }
                } else {
                  // This is an opening trade - check if there's still an active position
                  const hasActivePosition = positions.some(p => p.symbol === trade.symbol)
                  if (!hasActivePosition) {
                    // This opening trade doesn't have an active position, so it's likely stale
                    tradeStatus = 'ORPHANED'
                  }
                  tradeAction = trade.type === 'BUY' ? 'BUY (Open Long)' : 'SELL (Open Short)'
                  positionDirection = trade.type === 'BUY' ? 'LONG POSITION' : 'SHORT POSITION'
                }
                
                const positionValue = trade.quantity * trade.price
                
                return (
                  <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Trade Action & Status */}
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={trade.type === 'BUY' ? 'default' : 'secondary'} 
                          className={`min-w-[100px] text-center text-xs ${
                            isCompletedTrade 
                              ? displayPnL >= 0 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {tradeAction}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs text-center ${
                            isCompletedTrade ? 'border-purple-200 text-purple-700' : 'border-amber-200 text-amber-700'
                          }`}
                        >
                          {isCompletedTrade && trade.holdTime ? `${trade.holdTime}min` : 'ACTIVE'}
                        </Badge>
                      </div>
                      
                      {/* Stock & Position Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">{trade.symbol}</span>
                          <Badge variant="outline" className="text-xs font-medium">
                            {trade.quantity} shares
                          </Badge>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-blue-600">Entry: ₹{entryPrice.toFixed(2)}</span>
                            {exitPrice && (
                              <span className="font-medium text-orange-600">Exit: ₹{exitPrice.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="font-medium text-gray-600 uppercase text-xs">
                            {positionDirection}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance & Value */}
                    <div className="text-right space-y-1 min-w-[120px]">
                      <div className="text-xs text-muted-foreground">
                        {trade.timestamp.toLocaleTimeString()}
                      </div>
                      
                      <div className="text-xs font-medium text-blue-600">
                        Value: ₹{positionValue.toLocaleString()}
                      </div>
                      
                      {isCompletedTrade ? (
                        <div className="border-l-2 pl-2 space-y-1" style={{borderColor: displayPnL >= 0 ? '#16a34a' : '#dc2626'}}>
                          <div className={`text-sm font-bold ${displayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {displayPnL >= 0 ? '+' : ''}₹{displayPnL.toFixed(2)}
                          </div>
                          <div className={`text-xs font-bold ${displayPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {displayPnLPercent >= 0 ? '+' : ''}{displayPnLPercent.toFixed(2)}%
                          </div>
                          <div className="text-xs font-medium">
                            {displayPnL >= 0 ? '📈 PROFIT' : '📉 LOSS'}
                          </div>
                        </div>
                      ) : (
                        <div className="border-l-2 border-amber-300 pl-2 space-y-1">
                          <div className="text-xs font-medium text-amber-600">
                            🔄 ACTIVE
                          </div>
                          <div className="text-xs text-gray-600">
                            {trade.type === 'BUY' ? '📈 Long' : '📉 Short'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scalping Watchlist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 Scalping Watchlist</CardTitle>
              <CardDescription>High-volume stocks with real-time technical analysis</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWatchlist}
                disabled={isWatchlistLoading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isWatchlistLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {lastWatchlistUpdate && (
                <span className="text-xs text-muted-foreground">
                  {lastWatchlistUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Custom Stock */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add stock symbol (e.g., WIPRO.NS)"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomStock()}
              className="flex-1"
            />
            <Button onClick={addCustomStock} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Watchlist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlistStocks.map((stock) => (
              <Card key={stock.symbol} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStock(stock.symbol)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-red-50"
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                        <div className={`text-xs ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {stock.isLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : stock.error ? (
                      <div className="text-xs text-red-500 text-center py-1">{stock.error}</div>
                    ) : stock.technicalAnalysis ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>RSI:</span>
                          <span className={
                            stock.technicalAnalysis.rsi < 35 ? 'text-green-600' :
                            stock.technicalAnalysis.rsi > 65 ? 'text-red-600' : 'text-gray-600'
                          }>
                            {stock.technicalAnalysis.rsi.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>VWAP:</span>
                          <span className={stock.price > stock.technicalAnalysis.vwap ? 'text-green-600' : 'text-red-600'}>
                            ₹{stock.technicalAnalysis.vwap.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>MA50:</span>
                          <span className={stock.price > stock.technicalAnalysis.ma50 ? 'text-green-600' : 'text-red-600'}>
                            ₹{stock.technicalAnalysis.ma50.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Scalping Signal */}
                        <div className="pt-1">
                          {(() => {
                            const stockData = {
                              quote: { regularMarketPrice: stock.price },
                              technicalAnalysis: stock.technicalAnalysis
                            }
                            const analysis = analyzeScalpingSignal(stock.symbol, stockData)
                            if (analysis && analysis.confidence >= minConfidence) {
                              return (
                                <Badge 
                                  variant={analysis.signal.includes('BUY') ? 'default' : 'secondary'}
                                  className={`text-xs w-full justify-center ${
                                    analysis.signal.includes('BUY') ? 'bg-green-100 text-green-800' :
                                    analysis.signal.includes('SELL') ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {analysis.signal} ({analysis.confidence}%)
                                </Badge>
                              )
                            }
                            return <Badge variant="outline" className="text-xs w-full justify-center">HOLD</Badge>
                          })()}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {watchlistStocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading scalping watchlist...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

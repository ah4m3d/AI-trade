"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, Clock, Target } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
}

interface Position {
  symbol: string
  quantity: number
  avgBuyPrice: number
  currentValue: number
  unrealizedPnL: number
}

interface AutoTraderProps {
  technicalData: any
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function AutoTrader({ technicalData, isEnabled, onToggle }: AutoTraderProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [totalPnL, setTotalPnL] = useState(0)
  const [dayPnL, setDayPnL] = useState(0)
  const [tradingBalance, setTradingBalance] = useState(100000) // Starting with ₹1,00,000
  const [availableBalance, setAvailableBalance] = useState(100000)
  
  // Trading parameters
  const [minConfidence, setMinConfidence] = useState(70)
  const [maxPositionSize, setMaxPositionSize] = useState(10000) // Max ₹10,000 per trade
  const [riskPerTrade, setRiskPerTrade] = useState(2) // 2% risk per trade
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTradeRef = useRef<{ [symbol: string]: number }>({})

  // Calculate position size based on risk management
  const calculatePositionSize = (price: number, stopLoss: number) => {
    const riskAmount = (tradingBalance * riskPerTrade) / 100
    const riskPerShare = Math.abs(price - stopLoss)
    const quantity = Math.floor(riskAmount / riskPerShare)
    const positionValue = quantity * price
    
    return Math.min(quantity, Math.floor(maxPositionSize / price))
  }

  // Execute trade based on AI signals
  const executeTrade = async (symbol: string, analysis: any) => {
    if (!isEnabled || !analysis) return

    const { signal, confidence, priceTargets, rsi, vwap } = analysis
    const currentPrice = technicalData[symbol]?.quote?.regularMarketPrice || 0
    
    if (confidence < minConfidence || currentPrice === 0) return

    // Prevent duplicate trades within 5 minutes
    const lastTradeTime = lastTradeRef.current[symbol] || 0
    const timeSinceLastTrade = Date.now() - lastTradeTime
    if (timeSinceLastTrade < 5 * 60 * 1000) return // 5 minutes cooldown

    const existingPosition = positions.find(p => p.symbol === symbol)
    
    try {
      if (signal === 'STRONG_BUY' || signal === 'BUY') {
        if (!existingPosition || existingPosition.quantity === 0) {
          const quantity = calculatePositionSize(priceTargets.buyPrice, priceTargets.stopLoss)
          const totalCost = quantity * priceTargets.buyPrice
          
          if (totalCost <= availableBalance && quantity > 0) {
            const trade: Trade = {
              id: `trade_${Date.now()}_${symbol}`,
              symbol,
              type: 'BUY',
              price: priceTargets.buyPrice,
              quantity,
              timestamp: new Date(),
              signal,
              confidence
            }
            
            setTrades(prev => [trade, ...prev])
            setAvailableBalance(prev => prev - totalCost)
            
            // Update or create position
            setPositions(prev => {
              const existingIndex = prev.findIndex(p => p.symbol === symbol)
              if (existingIndex >= 0) {
                const updated = [...prev]
                const existing = updated[existingIndex]
                const newQuantity = existing.quantity + quantity
                const newAvgPrice = ((existing.quantity * existing.avgBuyPrice) + totalCost) / newQuantity
                
                updated[existingIndex] = {
                  ...existing,
                  quantity: newQuantity,
                  avgBuyPrice: newAvgPrice,
                  currentValue: newQuantity * currentPrice,
                  unrealizedPnL: (currentPrice - newAvgPrice) * newQuantity
                }
                return updated
              } else {
                return [...prev, {
                  symbol,
                  quantity,
                  avgBuyPrice: priceTargets.buyPrice,
                  currentValue: quantity * currentPrice,
                  unrealizedPnL: (currentPrice - priceTargets.buyPrice) * quantity
                }]
              }
            })
            
            lastTradeRef.current[symbol] = Date.now()
          }
        }
      } else if ((signal === 'STRONG_SELL' || signal === 'SELL') && existingPosition && existingPosition.quantity > 0) {
        const sellPrice = priceTargets.sellPrice
        const totalValue = existingPosition.quantity * sellPrice
        const pnl = (sellPrice - existingPosition.avgBuyPrice) * existingPosition.quantity
        
        const trade: Trade = {
          id: `trade_${Date.now()}_${symbol}`,
          symbol,
          type: 'SELL',
          price: sellPrice,
          quantity: existingPosition.quantity,
          timestamp: new Date(),
          signal,
          confidence,
          pnl
        }
        
        setTrades(prev => [trade, ...prev])
        setAvailableBalance(prev => prev + totalValue)
        setTotalPnL(prev => prev + pnl)
        setDayPnL(prev => prev + pnl)
        
        // Remove position
        setPositions(prev => prev.filter(p => p.symbol !== symbol))
        lastTradeRef.current[symbol] = Date.now()
      }
    } catch (error) {
      console.error('Trade execution error:', error)
    }
  }

  // Auto-trading loop
  useEffect(() => {
    if (isEnabled && technicalData) {
      intervalRef.current = setInterval(() => {
        Object.keys(technicalData).forEach(symbol => {
          const analysis = technicalData[symbol]?.technicalAnalysis
          if (analysis) {
            executeTrade(symbol, analysis)
          }
        })
      }, 10000) // Check every 10 seconds
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isEnabled, technicalData, minConfidence, maxPositionSize, riskPerTrade])

  // Update unrealized P&L
  useEffect(() => {
    setPositions(prev => prev.map(position => {
      const currentPrice = technicalData[position.symbol]?.quote?.regularMarketPrice || position.avgBuyPrice
      return {
        ...position,
        currentValue: position.quantity * currentPrice,
        unrealizedPnL: (currentPrice - position.avgBuyPrice) * position.quantity
      }
    }))
  }, [technicalData])

  // Calculate total unrealized P&L
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
  const totalEquity = availableBalance + positions.reduce((sum, pos) => sum + pos.currentValue, 0)

  // Reset daily P&L at midnight
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    const resetTimer = setTimeout(() => {
      setDayPnL(0)
    }, msUntilMidnight)
    
    return () => clearTimeout(resetTimer)
  }, [])

  const todayTrades = trades.filter(trade => {
    const today = new Date().toDateString()
    return trade.timestamp.toDateString() === today
  })

  return (
    <div className="space-y-6">
      {/* Auto Trading Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Auto Trading System
              </CardTitle>
              <CardDescription>
                Automated trading based on AI technical analysis signals
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-trading">Enable Auto Trading</Label>
              <Switch
                id="auto-trading"
                checked={isEnabled}
                onCheckedChange={onToggle}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="min-confidence">Min Confidence (%)</Label>
              <Input
                id="min-confidence"
                type="number"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="max-position">Max Position Size (₹)</Label>
              <Input
                id="max-position"
                type="number"
                value={maxPositionSize}
                onChange={(e) => setMaxPositionSize(Number(e.target.value))}
                min="1000"
                max="50000"
              />
            </div>
            <div>
              <Label htmlFor="risk-per-trade">Risk Per Trade (%)</Label>
              <Input
                id="risk-per-trade"
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                min="0.5"
                max="5"
                step="0.1"
              />
            </div>
          </div>
          
          {isEnabled && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Auto trading is active. The system will execute trades based on AI signals every 10 seconds.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Equity</p>
                <p className="text-2xl font-bold">₹{totalEquity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Available Cash</p>
                <p className="text-2xl font-bold">₹{availableBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Day P&L</p>
                <p className={`text-2xl font-bold ${dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{dayPnL.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalUnrealizedPnL.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Positions */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {positions.map((position) => (
                <div key={position.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{position.symbol}</Badge>
                    <div>
                      <p className="font-medium">{position.quantity} shares</p>
                      <p className="text-sm text-muted-foreground">Avg: ₹{position.avgBuyPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{position.currentValue.toLocaleString()}</p>
                    <p className={`text-sm ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {position.unrealizedPnL >= 0 ? '+' : ''}₹{position.unrealizedPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Trading Log ({todayTrades.length} trades today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {trades.slice(0, 20).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'}>
                    {trade.type}
                  </Badge>
                  <div>
                    <p className="font-medium">{trade.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {trade.quantity} @ ₹{trade.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline">{trade.signal}</Badge>
                    <p className="text-xs text-muted-foreground">{trade.confidence}% confidence</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {trade.timestamp.toLocaleTimeString()}
                  </p>
                  {trade.pnl !== undefined && (
                    <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

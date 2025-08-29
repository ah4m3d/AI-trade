"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { StockDashboard } from "@/components/stock-dashboard"
import AIWatchlistAnalyzer from "@/components/ai-watchlist-analyzer"
import MonthlyTradingTracker from "@/components/monthly-trading-tracker"
import IntradayScalpingTrader from "@/components/intraday-scalping-trader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, BarChart3, Zap } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("ai-watchlist")
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false)
  const [scalpingEnabled, setScalpingEnabled] = useState(false)
  const [sharedTechnicalData, setSharedTechnicalData] = useState({})

  // Load auto-trading states from localStorage
  useEffect(() => {
    try {
      // Load main auto-trading state
      const savedAutoTradingState = localStorage.getItem('autoTradingEnabled')
      if (savedAutoTradingState !== null) {
        setAutoTradingEnabled(JSON.parse(savedAutoTradingState))
      }
      
      // Load scalping state
      const savedScalpingState = localStorage.getItem('scalpingEnabled')
      if (savedScalpingState !== null) {
        setScalpingEnabled(JSON.parse(savedScalpingState))
      }
    } catch (error) {
      console.error('Error loading trading states:', error)
    }
  }, [])

  // Save auto-trading state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('autoTradingEnabled', JSON.stringify(autoTradingEnabled))
      localStorage.setItem('autoTradingEnabled_backup', JSON.stringify(autoTradingEnabled))
    } catch (error) {
      console.error('Error saving auto-trading state:', error)
    }
  }, [autoTradingEnabled])

  // Save scalping state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scalpingEnabled', JSON.stringify(scalpingEnabled))
    } catch (error) {
      console.error('Error saving scalping state:', error)
    }
  }, [scalpingEnabled])

  const handleAutoTradingToggle = (enabled: boolean) => {
    setAutoTradingEnabled(enabled)
  }

  const handleScalpingToggle = (enabled: boolean) => {
    setScalpingEnabled(enabled)
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">🚀 AI Stock Trading Platform</h1>
          <p className="text-muted-foreground">Professional auto-trading with real Yahoo Finance data and 30-day challenge tracking</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="ai-watchlist" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              AI Auto Trading
              <Badge variant="outline" className="ml-1">
                Live Market
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="scalping" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intraday Scalping
              <Badge variant="outline" className="ml-1 bg-orange-50 text-orange-600">
                High Frequency
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="monthly-challenge" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              30-Day Challenge
              <Badge variant="outline" className="ml-1">
                P&L Tracking
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
              <Badge variant="outline" className="ml-1">
                Overview
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-watchlist" className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold mb-2">🤖 AI-Powered Auto Trading System</h2>
              <p className="text-muted-foreground">
                Real Yahoo Finance data • Advanced technical analysis • Automated buy/sell execution
              </p>
            </div>
            <AIWatchlistAnalyzer 
              onTechnicalDataUpdate={setSharedTechnicalData}
              autoTradingEnabled={autoTradingEnabled}
              onAutoTradingToggle={handleAutoTradingToggle}
            />
          </TabsContent>
          
          <TabsContent value="scalping" className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold mb-2">⚡ Intraday Scalping Trader</h2>
              <p className="text-muted-foreground">
                High-frequency trading • Ultra-fast execution • Time-based exits • RSI/VWAP/MA signals
              </p>
            </div>
            <IntradayScalpingTrader 
              technicalData={sharedTechnicalData} 
              isEnabled={scalpingEnabled} 
              onToggle={handleScalpingToggle} 
            />
          </TabsContent>
          
          <TabsContent value="monthly-challenge" className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold mb-2">📊 30-Day Live Trading Challenge</h2>
              <p className="text-muted-foreground">
                Track real market performance and P&L over 30 days with comprehensive analytics
              </p>
            </div>
            <MonthlyTradingTracker />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold mb-2">📈 Trading Dashboard</h2>
              <p className="text-muted-foreground">
                Real-time stock monitoring and trading overview
              </p>
            </div>
            <StockDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

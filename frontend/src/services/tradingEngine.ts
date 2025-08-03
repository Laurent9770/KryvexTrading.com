import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import activityService from "./activityService";

export interface TradeRequest {
  type: 'spot' | 'futures' | 'options' | 'binary' | 'quant' | 'bot' | 'staking' | 'strategy' | 'user_transfer' | 'account_transfer';
  action: 'buy' | 'sell' | 'stake' | 'unstake' | 'claim' | 'pause' | 'resume' | 'stop';
  symbol: string;
  amount: number;
  price?: number;
  leverage?: number;
  duration?: number; // for staking/binary options/bots
  stopLoss?: number;
  takeProfit?: number;
  direction?: 'up' | 'down' | 'long' | 'short';
  expiryTime?: number; // in seconds
  payout?: number; // percentage for binary options
  botId?: string; // for bot operations
  poolId?: string; // for staking operations
  // Transfer specific fields
  fromAccount?: 'trading' | 'funding';
  toAccount?: 'trading' | 'funding';
  fromAsset?: string;
  toAsset?: string;
  recipient?: string;
  message?: string;
}

export interface TradeResult {
  success: boolean;
  tradeId: string;
  message: string;
  profit?: number;
  loss?: number;
  newBalance: number;
}

export interface TradingNotification {
  id: string;
  type: 'trade_placed' | 'trade_won' | 'trade_lost' | 'stake_initiated' | 'stake_completed' | 'insufficient_balance';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

class TradingEngine {
  private static instance: TradingEngine;
  private notifications: TradingNotification[] = [];
  private tradeHistory: any[] = [];
  private authContext: any = null;

  private constructor() {}

  static getInstance(): TradingEngine {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine();
    }
    return TradingEngine.instance;
  }

  // Set auth context reference
  setAuthContext(authContext: any) {
    this.authContext = authContext;
  }

  // Centralized trade execution
  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    const { type, action, symbol, amount, price, leverage = 1, duration } = request;

    console.log(`🚀 EXECUTING TRADE: ${type} ${action} ${symbol} $${amount} at $${price || 'market'}`);

    // Route to specific handlers based on trade type
    switch (type) {
      case 'spot':
        return this.handleSpotTrade(request);
      case 'futures':
        return this.handleFuturesTrade(request);
      case 'options':
        return this.handleOptionsTrade(request);
      case 'binary':
        return this.handleBinaryTrade(request);
      case 'quant':
        return this.handleQuantTrade(request);
      case 'bot':
        return this.handleBotTrade(request);
      case 'staking':
        return this.handleStakingOperation(request);
      case 'strategy':
        return this.handleStrategyTrade(request);
      default:
        return this.handleGenericTrade(request);
    }

    // Calculate required funds
    const requiredFunds = this.calculateRequiredFunds(request);
    console.log(`💰 REQUIRED FUNDS: $${requiredFunds.toFixed(2)}`);

    // Check if user has sufficient funds
    const hasSufficientFunds = await this.checkSufficientFunds(requiredFunds);

    if (!hasSufficientFunds) {
      console.log(`🚫 TRADE BLOCKED: Insufficient funds`);
      const notification: TradingNotification = {
        id: Date.now().toString(),
        type: 'insufficient_balance',
        title: 'Insufficient Trading Funds',
        message: 'Please transfer from Funding Account.',
        timestamp: new Date()
      };

      this.addNotification(notification);

      return {
        success: false,
        tradeId: '',
        message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
        newBalance: 0
      };
    }

    console.log(`✅ FUNDS SUFFICIENT: Proceeding with trade`);

    // Deduct funds from Trading Account immediately
    await this.deductFromTradingAccount(requiredFunds);

    // Generate trade ID
    const tradeId = this.generateTradeId();

    // Simulate trade execution (in real app, this would call exchange API)
    const tradeResult = await this.simulateTradeExecution(request, tradeId);

    // Process trade outcome
    if (tradeResult.success) {
      // Add profit back to Trading Account
      if (tradeResult.profit) {
        await this.addToTradingAccount(tradeResult.profit);
      }

      // Add to trade history
      this.addToTradeHistory({
        id: tradeId,
        type,
        action,
        symbol,
        amount,
        price: price || this.getCurrentPrice(symbol),
        profit: tradeResult.profit,
        loss: tradeResult.loss,
        timestamp: new Date(),
        status: tradeResult.profit ? 'won' : 'lost'
      });

      // Send notification
      const notification: TradingNotification = {
        id: Date.now().toString(),
        type: tradeResult.profit ? 'trade_won' : 'trade_lost',
        title: tradeResult.profit ? 'Trade Won!' : 'Trade Lost',
        message: tradeResult.profit
          ? `Profit: +$${tradeResult.profit.toFixed(2)}`
          : `Loss: -$${Math.abs(tradeResult.loss || 0).toFixed(2)}`,
        timestamp: new Date(),
        data: tradeResult
      };

      this.addNotification(notification);
    }

    return tradeResult;
  }

  // Handle spot trades (timed trades)
  private async handleSpotTrade(request: TradeRequest): Promise<TradeResult> {
    const { action, symbol, amount, price, duration } = request;
    const tradeId = this.generateTradeId();
    const currentPrice = price || this.getCurrentPrice(symbol);

    // Add to trade history as pending
    this.addToTradeHistory({
      id: tradeId,
      type: 'spot',
      action,
      symbol,
      amount,
      price: currentPrice,
      duration,
      timestamp: new Date(),
      status: 'pending',
      entry_price: currentPrice,
      direction: action
    });

    // Log activity
    if (this.authContext?.user?.id) {
      const activity = {
        type: 'spot' as const,
        action: `${action.toUpperCase()}_SPOT`,
        description: `${action === 'buy' ? 'Bought' : 'Sold'} $${amount} ${symbol}`,
        amount: `$${amount}`,
        symbol,
        status: 'pending' as const,
        icon: '📈'
      };
      activityService.addActivity(this.authContext.user.id, activity);
    }

    // Send notification for trade start
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: 'trade_placed',
      title: 'Spot Trade Started',
      message: `${action.toUpperCase()} ${symbol} for $${amount} - Duration: ${duration} minutes`,
      timestamp: new Date(),
      data: { tradeId, duration }
    };

    this.addNotification(notification);

    return {
      success: true,
      tradeId,
      message: 'Spot trade started successfully',
      newBalance: 0
    };
  }

  // Handle strategy trades
  private async handleStrategyTrade(request: TradeRequest): Promise<TradeResult> {
    const tradeId = this.generateTradeId();
    const currentPrice = this.getCurrentPrice(request.symbol);
    const entryPrice = request.price || currentPrice;

    console.log(`🤖 STRATEGY TRADE EXECUTED: ${tradeId} at $${entryPrice}`);

    // Deduct funds immediately
    await this.deductFromTradingAccount(request.amount);

    // Simulate strategy execution with profit/loss
    const profitChance = 0.65; // 65% chance of profit
    const isProfitable = Math.random() < profitChance;
    const profitPercentage = isProfitable ? (Math.random() * 0.15 + 0.05) : (Math.random() * 0.08 + 0.02); // 5-20% profit or 2-10% loss
    const profitAmount = request.amount * profitPercentage;
    const finalAmount = isProfitable ? request.amount + profitAmount : request.amount - profitAmount;

    // Add to trading account
    await this.addToTradingAccount(finalAmount);

    // Add to trade history
    const trade = {
      id: tradeId,
      type: 'strategy',
      direction: request.action,
      amount: request.amount,
      entry_price: entryPrice,
      exit_price: currentPrice,
      profit: isProfitable ? profitAmount : 0,
      loss: isProfitable ? 0 : profitAmount,
      status: 'completed',
      symbol: request.symbol,
      timestamp: new Date()
    };

    this.addToTradeHistory(trade);

    // Create notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: isProfitable ? 'trade_won' : 'trade_lost',
      title: isProfitable ? 'Strategy Trade Won' : 'Strategy Trade Lost',
      message: isProfitable 
        ? `Strategy trade won! Profit: +$${profitAmount.toFixed(2)}`
        : `Strategy trade lost. Loss: -$${profitAmount.toFixed(2)}`,
      timestamp: new Date(),
      data: { tradeId, profitAmount, isProfitable }
    };

    this.addNotification(notification);

    return {
      success: true,
      tradeId: tradeId,
      message: isProfitable 
        ? `Strategy trade completed successfully. Profit: +$${profitAmount.toFixed(2)}`
        : `Strategy trade completed. Loss: -$${profitAmount.toFixed(2)}`,
      profit: isProfitable ? profitAmount : undefined,
      loss: isProfitable ? undefined : profitAmount,
      newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
    };
  }

  // Handle staking operations
  private async handleStakingOperation(request: TradeRequest): Promise<TradeResult> {
    const { action, symbol, amount } = request;
    const tradeId = this.generateTradeId();

    console.log(`🔒 STAKING OPERATION: ${action} ${symbol} $${amount}`);

    // Handle different staking actions
    switch (action) {
      case 'stake':
        // For staking, we deduct the amount from trading account
        await this.deductFromTradingAccount(amount);
        
        // Add to trade history
        this.addToTradeHistory({
          id: tradeId,
          type: 'staking',
          action: 'stake',
          symbol,
          amount,
          timestamp: new Date(),
          status: 'completed'
        });

        return {
          success: true,
          tradeId,
          message: `Successfully staked ${amount} ${symbol}`,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };

      case 'unstake':
        // For unstaking, we add the amount back to trading account
        await this.addToTradingAccount(amount);
        
        // Add to trade history
        this.addToTradeHistory({
          id: tradeId,
          type: 'staking',
          action: 'unstake',
          symbol,
          amount,
          timestamp: new Date(),
          status: 'completed'
        });

        return {
          success: true,
          tradeId,
          message: `Successfully unstaked ${amount} ${symbol}`,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };

      default:
        return {
          success: false,
          tradeId,
          message: `Invalid staking action: ${action}`,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };
    }
  }

  // Handle futures trades
  private async handleFuturesTrade(request: TradeRequest): Promise<TradeResult> {
    const { action, symbol, amount, price, leverage = 1, direction, stopLoss, takeProfit, duration } = request;
    const tradeId = this.generateTradeId();
    const currentPrice = price || this.getCurrentPrice(symbol);

    console.log(`📈 FUTURES TRADE: ${direction} ${symbol} $${amount} at $${currentPrice} with ${leverage}x leverage`);

    // Calculate required margin
    const requiredMargin = (amount * currentPrice) / leverage;
    
    // Check sufficient funds
    const hasSufficientFunds = await this.checkSufficientFunds(requiredMargin);
    if (!hasSufficientFunds) {
      return {
        success: false,
        tradeId,
        message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
        newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
      };
    }

    // Deduct margin from trading account
    await this.deductFromTradingAccount(requiredMargin);

    // Add to trade history as pending
    this.addToTradeHistory({
      id: tradeId,
      type: 'futures',
      action,
      symbol,
      amount,
      price: currentPrice,
      leverage,
      direction,
      stopLoss,
      takeProfit,
      duration,
      timestamp: new Date(),
      status: 'pending',
      entry_price: currentPrice
    });

    // Send notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: 'trade_placed',
      title: 'Futures Trade Started',
      message: `${direction?.toUpperCase()} ${symbol} for $${amount} - Leverage: ${leverage}x`,
      timestamp: new Date(),
      data: { tradeId, duration }
    };
    this.addNotification(notification);

    return {
      success: true,
      tradeId,
      message: 'Futures trade started successfully',
      newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
    };
  }

  // Handle options trades
  private async handleOptionsTrade(request: TradeRequest): Promise<TradeResult> {
    const { action, symbol, amount, price, direction, expiryTime, stopLoss, takeProfit } = request;
    const tradeId = this.generateTradeId();
    const currentPrice = price || this.getCurrentPrice(symbol);

    console.log(`📊 OPTIONS TRADE: ${direction} ${symbol} $${amount} at $${currentPrice} expiry: ${expiryTime}s`);

    // Calculate premium (options cost)
    const premium = amount * currentPrice * 0.1; // 10% of underlying value
    
    // Check sufficient funds
    const hasSufficientFunds = await this.checkSufficientFunds(premium);
    if (!hasSufficientFunds) {
      return {
        success: false,
        tradeId,
        message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
        newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
      };
    }

    // Deduct premium from trading account
    await this.deductFromTradingAccount(premium);

    // Add to trade history as pending
    this.addToTradeHistory({
      id: tradeId,
      type: 'options',
      action,
      symbol,
      amount,
      price: currentPrice,
      direction,
      expiryTime,
      stopLoss,
      takeProfit,
      timestamp: new Date(),
      status: 'pending',
      entry_price: currentPrice
    });

    // Send notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: 'trade_placed',
      title: 'Options Trade Started',
      message: `${direction?.toUpperCase()} ${symbol} for $${amount} - Expiry: ${expiryTime}s`,
      timestamp: new Date(),
      data: { tradeId, expiryTime }
    };
    this.addNotification(notification);

    return {
      success: true,
      tradeId,
      message: 'Options trade started successfully',
      newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
    };
  }

  // Handle binary options trades
  private async handleBinaryTrade(request: TradeRequest): Promise<TradeResult> {
    const { action, symbol, amount, direction, payout = 85, expiryTime = 60 } = request;
    const tradeId = this.generateTradeId();
    const currentPrice = this.getCurrentPrice(symbol);

    console.log(`🎯 BINARY TRADE: ${direction} ${symbol} $${amount} payout: ${payout}% expiry: ${expiryTime}s`);

    // Check sufficient funds
    const hasSufficientFunds = await this.checkSufficientFunds(amount);
    if (!hasSufficientFunds) {
      return {
        success: false,
        tradeId,
        message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
        newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
      };
    }

    // Deduct amount from trading account
    await this.deductFromTradingAccount(amount);

    // Add to trade history as pending
    this.addToTradeHistory({
      id: tradeId,
      type: 'binary',
      action,
      symbol,
      amount,
      direction,
      payout,
      expiryTime,
      timestamp: new Date(),
      status: 'pending',
      entry_price: currentPrice
    });

    // Send notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: 'trade_placed',
      title: 'Binary Trade Started',
      message: `${direction?.toUpperCase()} ${symbol} for $${amount} - Payout: ${payout}%`,
      timestamp: new Date(),
      data: { tradeId, expiryTime }
    };
    this.addNotification(notification);

    return {
      success: true,
      tradeId,
      message: 'Binary trade started successfully',
      newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
    };
  }

  // Handle quant trading
  private async handleQuantTrade(request: TradeRequest): Promise<TradeResult> {
    const { action, symbol, amount, duration } = request;
    const tradeId = this.generateTradeId();
    const currentPrice = this.getCurrentPrice(symbol);

    console.log(`🤖 QUANT TRADE: ${symbol} $${amount} duration: ${duration}min`);

    // Check sufficient funds
    const hasSufficientFunds = await this.checkSufficientFunds(amount);
    if (!hasSufficientFunds) {
      return {
        success: false,
        tradeId,
        message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
        newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
      };
    }

    // Deduct amount from trading account
    await this.deductFromTradingAccount(amount);

    // Add to trade history as pending
    this.addToTradeHistory({
      id: tradeId,
      type: 'quant',
      action,
      symbol,
      amount,
      price: currentPrice,
      duration,
      timestamp: new Date(),
      status: 'pending',
      entry_price: currentPrice
    });

    // Send notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: 'trade_placed',
      title: 'Quant Trade Started',
      message: `${symbol} for $${amount} - Duration: ${duration}min`,
      timestamp: new Date(),
      data: { tradeId, duration }
    };
    this.addNotification(notification);

    return {
      success: true,
      tradeId,
      message: 'Quant trade started successfully',
      newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
    };
  }

  // Handle bot trading
  private async handleBotTrade(request: TradeRequest): Promise<TradeResult> {
    const { action, botId, amount, duration } = request;
    const tradeId = this.generateTradeId();

    console.log(`🤖 BOT TRADE: ${action} bot ${botId} $${amount} duration: ${duration}min`);

    switch (action) {
      case 'buy':
        // Start bot - deduct amount from trading account
        const hasSufficientFunds = await this.checkSufficientFunds(amount);
        if (!hasSufficientFunds) {
          return {
            success: false,
            tradeId,
            message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
            newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
          };
        }

        await this.deductFromTradingAccount(amount);

        // Add to trade history as running
        this.addToTradeHistory({
          id: tradeId,
          type: 'bot',
          action: 'start',
          symbol: `Bot ${botId}`,
          amount,
          duration,
          timestamp: new Date(),
          status: 'running',
          botId
        });

        return {
          success: true,
          tradeId,
          message: `Bot ${botId} started successfully`,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };

      case 'pause':
        // Pause bot - update status
        this.addToTradeHistory({
          id: tradeId,
          type: 'bot',
          action: 'pause',
          symbol: `Bot ${botId}`,
          amount: 0,
          timestamp: new Date(),
          status: 'paused',
          botId
        });

        return {
          success: true,
          tradeId,
          message: `Bot ${botId} paused successfully`,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };

      case 'stop':
        // Stop bot and collect profits
        const profit = amount * (0.1 + Math.random() * 0.2); // 10-30% profit
        await this.addToTradingAccount(amount + profit);

        this.addToTradeHistory({
          id: tradeId,
          type: 'bot',
          action: 'stop',
          symbol: `Bot ${botId}`,
          amount,
          profit,
          timestamp: new Date(),
          status: 'completed',
          botId
        });

        return {
          success: true,
          tradeId,
          message: `Bot ${botId} stopped. Profit: +$${profit.toFixed(2)}`,
          profit,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };

      default:
        return {
          success: false,
          tradeId,
          message: `Invalid bot action: ${action}`,
          newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
        };
    }
  }

  // Handle generic trades (fallback)
  private async handleGenericTrade(request: TradeRequest): Promise<TradeResult> {
    const { type, action, symbol, amount, price } = request;
    const tradeId = this.generateTradeId();
    const currentPrice = price || this.getCurrentPrice(symbol);

    console.log(`🔄 GENERIC TRADE: ${type} ${action} ${symbol} $${amount} at $${currentPrice}`);

    // Check sufficient funds
    const hasSufficientFunds = await this.checkSufficientFunds(amount);
    if (!hasSufficientFunds) {
      return {
        success: false,
        tradeId,
        message: 'Insufficient Trading Funds. Please transfer from Funding Account.',
        newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
      };
    }

    // Deduct amount from trading account
    await this.deductFromTradingAccount(amount);

    // Simulate trade execution
    const isWin = Math.random() > 0.4; // 60% win rate
    const profit = isWin ? amount * (0.05 + Math.random() * 0.15) : 0; // 5-20% profit
    const loss = isWin ? 0 : amount * (0.02 + Math.random() * 0.08); // 2-10% loss

    // Add profit back if won
    if (isWin) {
      await this.addToTradingAccount(amount + profit);
    }

    // Add to trade history
    this.addToTradeHistory({
      id: tradeId,
      type,
      action,
      symbol,
      amount,
      price: currentPrice,
      profit: isWin ? profit : undefined,
      loss: isWin ? undefined : loss,
      timestamp: new Date(),
      status: isWin ? 'won' : 'lost'
    });

    return {
      success: true,
      tradeId,
      message: isWin ? `Trade won! Profit: +$${profit.toFixed(2)}` : `Trade lost. Loss: -$${loss.toFixed(2)}`,
      profit: isWin ? profit : undefined,
      loss: isWin ? undefined : loss,
      newBalance: this.authContext?.tradingAccount?.USDT?.available || 0
    };
  }

  // Complete a spot trade with final outcome
  async completeSpotTrade(tradeId: string, outcome: 'win' | 'lose', finalPrice: number, profitPercentage: number): Promise<void> {
    const tradeHistory = this.getTradeHistory();
    const trade = tradeHistory.find(t => t.id === tradeId);
    
    if (!trade) {
      console.error(`Trade ${tradeId} not found`);
      return;
    }

    const payout = outcome === 'win' ? trade.amount * (1 + profitPercentage / 100) : 0;
    const profit = outcome === 'win' ? payout - trade.amount : 0;
    const loss = outcome === 'lose' ? trade.amount : 0;

    // Update trade in history
    const updatedTrade = {
      ...trade,
      status: outcome === 'win' ? 'won' : 'lost',
      profit: outcome === 'win' ? profit : undefined,
      loss: outcome === 'lose' ? loss : undefined,
      exit_price: finalPrice,
      outcome,
      payout
    };

    // Replace the trade in history
    const updatedHistory = tradeHistory.map(t => t.id === tradeId ? updatedTrade : t);
    this.tradeHistory = updatedHistory;

    // Add profit to trading account if won
    if (outcome === 'win') {
      await this.addToTradingAccount(payout);
    }

    // Send completion notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: outcome === 'win' ? 'trade_won' : 'trade_lost',
      title: outcome === 'win' ? 'Spot Trade Won!' : 'Spot Trade Lost',
      message: outcome === 'win'
        ? `Profit: +$${profit.toFixed(2)}`
        : `Loss: -$${loss.toFixed(2)}`,
      timestamp: new Date(),
      data: { tradeId, outcome, profit, loss }
    };

    this.addNotification(notification);
  }

  // Complete futures trade
  async completeFuturesTrade(tradeId: string, outcome: 'win' | 'lose', finalPrice: number): Promise<void> {
    const tradeHistory = this.getTradeHistory();
    const trade = tradeHistory.find(t => t.id === tradeId);
    
    if (!trade) {
      console.error(`Futures trade ${tradeId} not found`);
      return;
    }

    const leverage = trade.leverage || 1;
    const priceChange = ((finalPrice - trade.entry_price) / trade.entry_price) * leverage;
    const isWin = (trade.direction === 'long' && priceChange > 0) || (trade.direction === 'short' && priceChange < 0);
    
    const profit = isWin ? trade.amount * Math.abs(priceChange) : 0;
    const loss = isWin ? 0 : trade.amount;

    // Update trade in history
    const updatedTrade = {
      ...trade,
      status: isWin ? 'won' : 'lost',
      profit: isWin ? profit : undefined,
      loss: isWin ? undefined : loss,
      exit_price: finalPrice,
      outcome: isWin ? 'win' : 'lose'
    };

    // Replace the trade in history
    const updatedHistory = tradeHistory.map(t => t.id === tradeId ? updatedTrade : t);
    this.tradeHistory = updatedHistory;

    // Add profit to trading account if won
    if (isWin) {
      await this.addToTradingAccount(trade.amount + profit);
    }

    // Send completion notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: isWin ? 'trade_won' : 'trade_lost',
      title: isWin ? 'Futures Trade Won!' : 'Futures Trade Lost',
      message: isWin
        ? `Profit: +$${profit.toFixed(2)}`
        : `Loss: -$${loss.toFixed(2)}`,
      timestamp: new Date(),
      data: { tradeId, outcome: isWin ? 'win' : 'lose', profit, loss }
    };

    this.addNotification(notification);
  }

  // Complete binary options trade
  async completeBinaryTrade(tradeId: string, outcome: 'win' | 'lose', finalPrice: number): Promise<void> {
    const tradeHistory = this.getTradeHistory();
    const trade = tradeHistory.find(t => t.id === tradeId);
    
    if (!trade) {
      console.error(`Binary trade ${tradeId} not found`);
      return;
    }

    const payout = outcome === 'win' ? trade.amount * (1 + (trade.payout || 85) / 100) : 0;
    const profit = outcome === 'win' ? payout - trade.amount : 0;
    const loss = outcome === 'lose' ? trade.amount : 0;

    // Update trade in history
    const updatedTrade = {
      ...trade,
      status: outcome === 'win' ? 'won' : 'lost',
      profit: outcome === 'win' ? profit : undefined,
      loss: outcome === 'lose' ? loss : undefined,
      exit_price: finalPrice,
      outcome
    };

    // Replace the trade in history
    const updatedHistory = tradeHistory.map(t => t.id === tradeId ? updatedTrade : t);
    this.tradeHistory = updatedHistory;

    // Add profit to trading account if won
    if (outcome === 'win') {
      await this.addToTradingAccount(payout);
    }

    // Send completion notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: outcome === 'win' ? 'trade_won' : 'trade_lost',
      title: outcome === 'win' ? 'Binary Trade Won!' : 'Binary Trade Lost',
      message: outcome === 'win'
        ? `Profit: +$${profit.toFixed(2)}`
        : `Loss: -$${loss.toFixed(2)}`,
      timestamp: new Date(),
      data: { tradeId, outcome, profit, loss }
    };

    this.addNotification(notification);
  }

  // Complete options trade
  async completeOptionsTrade(tradeId: string, outcome: 'win' | 'lose', finalPrice: number): Promise<void> {
    const tradeHistory = this.getTradeHistory();
    const trade = tradeHistory.find(t => t.id === tradeId);
    
    if (!trade) {
      console.error(`Options trade ${tradeId} not found`);
      return;
    }

    const premium = trade.amount * trade.entry_price * 0.1;
    const profit = outcome === 'win' ? premium * 2 : 0; // 2x premium if won
    const loss = outcome === 'lose' ? premium : 0;

    // Update trade in history
    const updatedTrade = {
      ...trade,
      status: outcome === 'win' ? 'won' : 'lost',
      profit: outcome === 'win' ? profit : undefined,
      loss: outcome === 'lose' ? loss : undefined,
      exit_price: finalPrice,
      outcome
    };

    // Replace the trade in history
    const updatedHistory = tradeHistory.map(t => t.id === tradeId ? updatedTrade : t);
    this.tradeHistory = updatedHistory;

    // Add profit to trading account if won
    if (outcome === 'win') {
      await this.addToTradingAccount(premium + profit);
    }

    // Send completion notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: outcome === 'win' ? 'trade_won' : 'trade_lost',
      title: outcome === 'win' ? 'Options Trade Won!' : 'Options Trade Lost',
      message: outcome === 'win'
        ? `Profit: +$${profit.toFixed(2)}`
        : `Loss: -$${loss.toFixed(2)}`,
      timestamp: new Date(),
      data: { tradeId, outcome, profit, loss }
    };

    this.addNotification(notification);
  }

  // Complete quant trade
  async completeQuantTrade(tradeId: string, outcome: 'win' | 'lose', finalPrice: number): Promise<void> {
    const tradeHistory = this.getTradeHistory();
    const trade = tradeHistory.find(t => t.id === tradeId);
    
    if (!trade) {
      console.error(`Quant trade ${tradeId} not found`);
      return;
    }

    const profit = outcome === 'win' ? trade.amount * (0.1 + Math.random() * 0.2) : 0; // 10-30% profit
    const loss = outcome === 'lose' ? trade.amount * (0.05 + Math.random() * 0.1) : 0; // 5-15% loss

    // Update trade in history
    const updatedTrade = {
      ...trade,
      status: outcome === 'win' ? 'won' : 'lost',
      profit: outcome === 'win' ? profit : undefined,
      loss: outcome === 'lose' ? loss : undefined,
      exit_price: finalPrice,
      outcome
    };

    // Replace the trade in history
    const updatedHistory = tradeHistory.map(t => t.id === tradeId ? updatedTrade : t);
    this.tradeHistory = updatedHistory;

    // Add profit to trading account if won
    if (outcome === 'win') {
      await this.addToTradingAccount(trade.amount + profit);
    }

    // Send completion notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: outcome === 'win' ? 'trade_won' : 'trade_lost',
      title: outcome === 'win' ? 'Quant Trade Won!' : 'Quant Trade Lost',
      message: outcome === 'win'
        ? `Profit: +$${profit.toFixed(2)}`
        : `Loss: -$${loss.toFixed(2)}`,
      timestamp: new Date(),
      data: { tradeId, outcome, profit, loss }
    };

    this.addNotification(notification);
  }

  // Admin override trade outcome
  async adminOverrideTrade(tradeId: string, outcome: 'win' | 'lose', finalPrice: number): Promise<void> {
    const tradeHistory = this.getTradeHistory();
    const trade = tradeHistory.find(t => t.id === tradeId);
    
    if (!trade) {
      console.error(`Trade ${tradeId} not found for admin override`);
      return;
    }

    console.log(`👑 ADMIN OVERRIDE: Trade ${tradeId} forced to ${outcome}`);

    // Complete trade based on type
    switch (trade.type) {
      case 'spot':
        await this.completeSpotTrade(tradeId, outcome, finalPrice, 5); // 5% base profit
        break;
      case 'futures':
        await this.completeFuturesTrade(tradeId, outcome, finalPrice);
        break;
      case 'binary':
        await this.completeBinaryTrade(tradeId, outcome, finalPrice);
        break;
      case 'options':
        await this.completeOptionsTrade(tradeId, outcome, finalPrice);
        break;
      case 'quant':
        await this.completeQuantTrade(tradeId, outcome, finalPrice);
        break;
      default:
        console.error(`Admin override not supported for trade type: ${trade.type}`);
    }

    // Send admin override notification
    const notification: TradingNotification = {
      id: Date.now().toString(),
      type: outcome === 'win' ? 'trade_won' : 'trade_lost',
      title: `Admin Override - Trade ${outcome.toUpperCase()}`,
      message: `Trade ${tradeId} was manually set to ${outcome} by admin`,
      timestamp: new Date(),
      data: { tradeId, outcome, adminOverride: true }
    };

    this.addNotification(notification);
  }

  // Calculate required funds based on trade type
  private calculateRequiredFunds(request: TradeRequest): number {
    const { type, amount, price, leverage } = request;
    const currentPrice = price || this.getCurrentPrice(request.symbol);

    switch (type) {
      case 'spot':
        return amount * currentPrice;
      case 'futures':
        return (amount * currentPrice) / leverage;
      case 'options':
        return amount * currentPrice * 0.1; // Options premium
      case 'binary':
        return amount; // Binary options are fixed amount
      case 'quant':
        return amount * currentPrice;
      case 'bot':
        return amount * currentPrice;
      case 'staking':
        return amount; // Staking amount
      default:
        return amount * currentPrice;
    }
  }

  // Check if user has sufficient funds in Trading Account
  private async checkSufficientFunds(requiredAmount: number): Promise<boolean> {
    if (!this.authContext) {
      console.warn('AuthContext not set in TradingEngine');
      return false;
    }

    // Get current USDT balance from trading account
    const usdtBalance = this.authContext.tradingAccount?.USDT?.available;
    if (!usdtBalance) {
      console.warn('No USDT balance found in trading account');
      return false;
    }

    const availableBalance = parseFloat(usdtBalance.replace(/,/g, ''));
    console.log(`🔍 BALANCE CHECK: Required $${requiredAmount.toFixed(2)}, Available $${availableBalance.toFixed(2)}`);

    const hasSufficient = availableBalance >= requiredAmount;
    if (!hasSufficient) {
      console.log(`❌ INSUFFICIENT FUNDS: Need $${requiredAmount.toFixed(2)}, have $${availableBalance.toFixed(2)}`);
    } else {
      console.log(`✅ SUFFICIENT FUNDS: Have $${availableBalance.toFixed(2)}, need $${requiredAmount.toFixed(2)}`);
    }

    return hasSufficient;
  }

  // Deduct funds from Trading Account
  private async deductFromTradingAccount(amount: number): Promise<void> {
    if (!this.authContext?.updateTradingBalance) {
      console.warn('updateTradingBalance not available in AuthContext');
      return;
    }

    // Deduct from USDT balance
    this.authContext.updateTradingBalance('USDT', amount, 'subtract');
    console.log(`Deducted $${amount} from Trading Account`);
  }

  // Add funds to Trading Account
  private async addToTradingAccount(amount: number): Promise<void> {
    if (!this.authContext?.updateTradingBalance) {
      console.warn('updateTradingBalance not available in AuthContext');
      return;
    }

    // Add to USDT balance
    this.authContext.updateTradingBalance('USDT', amount, 'add');
    console.log(`Added $${amount} to Trading Account`);
  }

  // Simulate trade execution
  private async simulateTradeExecution(request: TradeRequest, tradeId: string): Promise<TradeResult> {
    // Simulate trade processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate trade outcome (in real app, this would be based on market conditions)
    const isWin = Math.random() > 0.4; // 60% win rate for demo
    const baseAmount = request.amount * (request.price || this.getCurrentPrice(request.symbol));

    if (isWin) {
      const profit = baseAmount * (0.05 + Math.random() * 0.15); // 5-20% profit
      return {
        success: true,
        tradeId,
        message: 'Trade executed successfully',
        profit,
        newBalance: 10000 + profit // Mock new balance
      };
    } else {
      const loss = baseAmount * (0.02 + Math.random() * 0.08); // 2-10% loss
      return {
        success: true,
        tradeId,
        message: 'Trade executed successfully',
        loss,
        newBalance: 10000 - loss // Mock new balance
      };
    }
  }

  // Get current price for a symbol
  private getCurrentPrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'BTC': 48500,
      'ETH': 3200,
      'SOL': 485,
      'ADA': 1,
      'XRP': 2.34,
      'USDT': 1
    };
    return prices[symbol] || 100;
  }

  // Generate unique trade ID
  private generateTradeId(): string {
    return `TRADE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add notification
  private addNotification(notification: TradingNotification): void {
    this.notifications.unshift(notification);
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
  }

  // Add to trade history
  private addToTradeHistory(trade: any): void {
    this.tradeHistory.unshift(trade);
    // Keep only last 1000 trades
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(0, 1000);
    }
  }

  // Get all notifications
  getNotifications(): TradingNotification[] {
    return [...this.notifications];
  }

  // Get trade history
  getTradeHistory(): any[] {
    return [...this.tradeHistory];
  }

  // Get trade history filtered by type
  getTradeHistoryByType(type: string): any[] {
    return this.tradeHistory.filter(trade => trade.type === type);
  }

  getSpotTrades(): any[] {
    return this.tradeHistory.filter(trade => trade.type === 'spot');
  }

  // Get active trades by type
  getActiveTrades(type?: string): any[] {
    if (type) {
      return this.tradeHistory.filter(trade => trade.type === type && trade.status === 'pending');
    }
    return this.tradeHistory.filter(trade => trade.status === 'pending');
  }

  // Get trades by type
  getTradesByType(type: string): any[] {
    return this.tradeHistory.filter(trade => trade.type === type);
  }

  // Get running bots
  getRunningBots(): any[] {
    return this.tradeHistory.filter(trade => trade.type === 'bot' && trade.status === 'running');
  }

  // Get active stakes
  getActiveStakes(): any[] {
    return this.tradeHistory.filter(trade => trade.type === 'staking' && trade.status === 'active');
  }

  // Get trade statistics by type
  getTradeStatisticsByType(type: string): {
    totalTrades: number;
    wins: number;
    losses: number;
    netProfit: number;
    winRate: number;
  } {
    const typeTrades = this.tradeHistory.filter(trade => trade.type === type);
    const totalTrades = typeTrades.length;
    const wins = typeTrades.filter(trade => trade.status === 'won').length;
    const losses = typeTrades.filter(trade => trade.status === 'lost').length;

    const netProfit = typeTrades.reduce((sum, trade) => {
      return sum + (trade.profit || 0) - (trade.loss || 0);
    }, 0);

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return {
      totalTrades,
      wins,
      losses,
      netProfit,
      winRate
    };
  }

  // Get comprehensive trade statistics
  getComprehensiveStatistics(): {
    totalTrades: number;
    wins: number;
    losses: number;
    netProfit: number;
    winRate: number;
    byType: {
      spot: any;
      futures: any;
      options: any;
      binary: any;
      quant: any;
      bot: any;
      staking: any;
    };
    activeTrades: number;
    runningBots: number;
    activeStakes: number;
  } {
    const totalTrades = this.tradeHistory.length;
    const wins = this.tradeHistory.filter(trade => trade.status === 'won').length;
    const losses = this.tradeHistory.filter(trade => trade.status === 'lost').length;
    const activeTrades = this.getActiveTrades().length;
    const runningBots = this.getRunningBots().length;
    const activeStakes = this.getActiveStakes().length;

    const netProfit = this.tradeHistory.reduce((sum, trade) => {
      return sum + (trade.profit || 0) - (trade.loss || 0);
    }, 0);

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return {
      totalTrades,
      wins,
      losses,
      netProfit,
      winRate,
      byType: {
        spot: this.getTradeStatisticsByType('spot'),
        futures: this.getTradeStatisticsByType('futures'),
        options: this.getTradeStatisticsByType('options'),
        binary: this.getTradeStatisticsByType('binary'),
        quant: this.getTradeStatisticsByType('quant'),
        bot: this.getTradeStatisticsByType('bot'),
        staking: this.getTradeStatisticsByType('staking')
      },
      activeTrades,
      runningBots,
      activeStakes
    };
  }

  // Get trade statistics
  getTradeStatistics(): {
    totalTrades: number;
    wins: number;
    losses: number;
    netProfit: number;
    winRate: number;
  } {
    const totalTrades = this.tradeHistory.length;
    const wins = this.tradeHistory.filter(trade => trade.status === 'won').length;
    const losses = this.tradeHistory.filter(trade => trade.status === 'lost').length;

    const netProfit = this.tradeHistory.reduce((sum, trade) => {
      return sum + (trade.profit || 0) - (trade.loss || 0);
    }, 0);

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return {
      totalTrades,
      wins,
      losses,
      netProfit,
      winRate
    };
  }
}

// Export singleton instance
export const tradingEngine = TradingEngine.getInstance();
export default tradingEngine; 
import { useAuth } from '@/contexts/AuthContext';

export interface StakingPool {
  id: string;
  token: string;
  name: string;
  apy: number;
  minStake: number;
  totalStaked: number;
  rewardType: string;
  duration: string;
  status: 'Active' | 'Limited' | 'Inactive';
  description: string;
  icon: string;
  color: string;
}

export interface StakingPosition {
  id: string;
  poolId: string;
  token: string;
  amount: number;
  value: number;
  apy: number;
  rewards: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'unstaking' | 'completed';
  canClaim: boolean;
  canUnstake: boolean;
}

export interface StakingStats {
  totalStaked: number;
  totalRewards: number;
  avgApy: number;
  activeStakes: number;
  totalValue: number;
}

class StakingService {
  private static instance: StakingService;
  private stakingPositions: StakingPosition[] = [];
  private stakingPools: StakingPool[] = [
    {
      id: 'eth-pool',
      token: "ETH",
      name: "Ethereum 2.0 Staking",
      apy: 4.5,
      minStake: 0.1,
      totalStaked: 2500000000,
      rewardType: "ETH",
      duration: "Flexible",
      status: "Active",
      description: "Stake ETH and earn rewards while supporting the Ethereum network",
      icon: "🔵",
      color: "from-blue-500/20 to-indigo-500/20"
    },
    {
      id: 'sol-pool',
      token: "SOL",
      name: "Solana Staking",
      apy: 7.2,
      minStake: 1,
      totalStaked: 890000000,
      rewardType: "SOL",
      duration: "Epoch (~2 days)",
      status: "Active",
      description: "High-performance staking with fast reward distribution",
      icon: "🟣",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      id: 'ada-pool',
      token: "ADA",
      name: "Cardano Staking",
      apy: 5.1,
      minStake: 10,
      totalStaked: 12300000000,
      rewardType: "ADA",
      duration: "Epoch (~5 days)",
      status: "Active",
      description: "Sustainable staking with proof-of-stake consensus",
      icon: "🟢",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      id: 'dot-pool',
      token: "DOT",
      name: "Polkadot Staking",
      apy: 12.8,
      minStake: 1,
      totalStaked: 5800000000,
      rewardType: "DOT",
      duration: "28 days",
      status: "Limited",
      description: "Cross-chain staking with high APY returns",
      icon: "🟡",
      color: "from-yellow-500/20 to-orange-500/20"
    },
    {
      id: 'avax-pool',
      token: "AVAX",
      name: "Avalanche Staking",
      apy: 9.5,
      minStake: 25,
      totalStaked: 3200000000,
      rewardType: "AVAX",
      duration: "Flexible",
      status: "Active",
      description: "High-performance blockchain staking with fast finality",
      icon: "🟠",
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      id: 'matic-pool',
      token: "MATIC",
      name: "Polygon Staking",
      apy: 8.2,
      minStake: 100,
      totalStaked: 1800000000,
      rewardType: "MATIC",
      duration: "Flexible",
      status: "Active",
      description: "Layer 2 scaling solution staking with high rewards",
      icon: "🟣",
      color: "from-purple-500/20 to-indigo-500/20"
    }
  ];

  private constructor() {
    this.loadStakingData();
  }

  static getInstance(): StakingService {
    if (!StakingService.instance) {
      StakingService.instance = new StakingService();
    }
    return StakingService.instance;
  }

  private loadStakingData() {
    try {
      const savedPositions = localStorage.getItem('staking_positions');
      if (savedPositions) {
        this.stakingPositions = JSON.parse(savedPositions);
      }
    } catch (error) {
      console.warn('Error loading staking data:', error);
    }
  }

  private saveStakingData() {
    try {
      localStorage.setItem('staking_positions', JSON.stringify(this.stakingPositions));
    } catch (error) {
      console.warn('Error saving staking data:', error);
    }
  }

  // Get all staking pools
  getStakingPools(): StakingPool[] {
    return this.stakingPools;
  }

  // Get user's staking positions
  getStakingPositions(): StakingPosition[] {
    return this.stakingPositions;
  }

  // Get staking statistics
  getStakingStats(): StakingStats {
    const totalStaked = this.stakingPositions.reduce((sum, pos) => sum + pos.value, 0);
    const totalRewards = this.stakingPositions.reduce((sum, pos) => sum + pos.rewards, 0);
    const activeStakes = this.stakingPositions.filter(pos => pos.status === 'active').length;
    
    const avgApy = this.stakingPositions.length > 0 
      ? this.stakingPositions.reduce((sum, pos) => sum + pos.apy, 0) / this.stakingPositions.length
      : 0;

    return {
      totalStaked,
      totalRewards,
      avgApy,
      activeStakes,
      totalValue: totalStaked + totalRewards
    };
  }

  // Stake tokens
  async stakeTokens(poolId: string, amount: number, token: string): Promise<{ success: boolean; message: string; position?: StakingPosition }> {
    try {
      const pool = this.stakingPools.find(p => p.id === poolId);
      if (!pool) {
        return { success: false, message: 'Staking pool not found' };
      }

      if (amount < pool.minStake) {
        return { success: false, message: `Minimum stake is ${pool.minStake} ${pool.token}` };
      }

      // Create new staking position
      const position: StakingPosition = {
        id: `stake-${Date.now()}`,
        poolId,
        token,
        amount,
        value: amount * this.getTokenPrice(token), // Convert to USD value
        apy: pool.apy,
        rewards: 0,
        startDate: new Date().toISOString(),
        status: 'active',
        canClaim: false,
        canUnstake: true
      };

      this.stakingPositions.push(position);
      this.saveStakingData();

      return { 
        success: true, 
        message: `Successfully staked ${amount} ${token}`,
        position 
      };
    } catch (error) {
      console.error('Error staking tokens:', error);
      return { success: false, message: 'Failed to stake tokens' };
    }
  }

  // Unstake tokens
  async unstakeTokens(positionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const position = this.stakingPositions.find(p => p.id === positionId);
      if (!position) {
        return { success: false, message: 'Staking position not found' };
      }

      if (position.status !== 'active') {
        return { success: false, message: 'Position is not active' };
      }

      // Update position status
      position.status = 'unstaking';
      position.canUnstake = false;
      this.saveStakingData();

      return { 
        success: true, 
        message: `Unstaking initiated for ${position.amount} ${position.token}` 
      };
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      return { success: false, message: 'Failed to unstake tokens' };
    }
  }

  // Claim rewards
  async claimRewards(positionId: string): Promise<{ success: boolean; message: string; rewards?: number }> {
    try {
      const position = this.stakingPositions.find(p => p.id === positionId);
      if (!position) {
        return { success: false, message: 'Staking position not found' };
      }

      if (position.rewards <= 0) {
        return { success: false, message: 'No rewards to claim' };
      }

      const rewards = position.rewards;
      position.rewards = 0;
      position.canClaim = false;
      this.saveStakingData();

      return { 
        success: true, 
        message: `Claimed ${rewards} ${position.token} in rewards`,
        rewards 
      };
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return { success: false, message: 'Failed to claim rewards' };
    }
  }

  // Calculate rewards for all positions
  calculateRewards() {
    const now = new Date();
    this.stakingPositions.forEach(position => {
      if (position.status === 'active') {
        const startDate = new Date(position.startDate);
        const daysStaked = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const dailyRate = position.apy / 365 / 100;
        const newRewards = position.amount * dailyRate * daysStaked;
        
        position.rewards = newRewards;
        position.canClaim = newRewards > 0;
      }
    });
    this.saveStakingData();
  }

  // Get token price (simplified)
  private getTokenPrice(token: string): number {
    const prices: { [key: string]: number } = {
      'ETH': 2500,
      'SOL': 100,
      'ADA': 0.5,
      'DOT': 7,
      'AVAX': 25,
      'MATIC': 0.8
    };
    return prices[token] || 1;
  }

  // Update rewards periodically
  startRewardCalculation() {
    // Calculate rewards every hour
    setInterval(() => {
      this.calculateRewards();
    }, 60 * 60 * 1000);
    
    // Initial calculation
    this.calculateRewards();
  }
}

const stakingService = StakingService.getInstance();
export default stakingService; 
import supabase from '@/lib/supabaseClient';

export interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  minStake: number;
  maxStake: number;
  totalStaked: number;
  totalRewards: number;
  lockPeriod: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface StakingPosition {
  id: string;
  userId: string;
  poolId: string;
  token: string;
  amount: number;
  apy: number;
  startDate: string;
  endDate?: string;
  rewards: number;
  status: 'active' | 'completed' | 'cancelled';
  lockPeriod: number;
}

export interface StakingStats {
  totalStaked: number;
  totalRewards: number;
  activePositions: number;
  averageApy: number;
}

class SupabaseStakingService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Start reward calculation (for compatibility)
  startRewardCalculation() {
    // TODO: Implement real-time reward calculation
    console.log('Starting reward calculation...');
  }

  // Get staking pools
  async getStakingPools(): Promise<StakingPool[]> {
    try {
      const { data, error } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('status', 'active')
        .order('apy', { ascending: false });

      if (error) {
        console.error('Error fetching staking pools:', error);
        return [];
      }

      return data.map(pool => ({
        id: pool.id,
        name: pool.name,
        token: pool.token,
        apy: pool.apy,
        minStake: pool.min_stake,
        maxStake: pool.max_stake,
        totalStaked: pool.total_staked,
        totalRewards: pool.total_rewards,
        lockPeriod: pool.lock_period,
        status: pool.status,
        createdAt: pool.created_at
      }));
    } catch (error) {
      console.error('Error getting staking pools:', error);
      return [];
    }
  }

  // Get staking positions for a user
  async getStakingPositions(): Promise<StakingPosition[]> {
    if (!this.userId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('staking_positions')
        .select('*')
        .eq('user_id', this.userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching staking positions:', error);
        return [];
      }

      return data.map(position => ({
        id: position.id,
        userId: position.user_id,
        poolId: position.pool_id,
        token: position.token,
        amount: position.amount,
        apy: position.apy,
        startDate: position.start_date,
        endDate: position.end_date,
        rewards: position.rewards,
        status: position.status,
        lockPeriod: position.lock_period
      }));
    } catch (error) {
      console.error('Error getting staking positions:', error);
      return [];
    }
  }

  // Get staking statistics
  async getStakingStats(): Promise<StakingStats> {
    try {
      const { data: pools, error: poolsError } = await supabase
        .from('staking_pools')
        .select('total_staked, total_rewards, apy')
        .eq('status', 'active');

      if (poolsError) {
        console.error('Error fetching staking stats:', poolsError);
        return {
          totalStaked: 0,
          totalRewards: 0,
          activePositions: 0,
          averageApy: 0
        };
      }

      const { data: positions, error: positionsError } = await supabase
        .from('staking_positions')
        .select('id')
        .eq('status', 'active');

      if (positionsError) {
        console.error('Error fetching active positions:', positionsError);
      }

      const totalStaked = pools.reduce((sum, pool) => sum + (pool.total_staked || 0), 0);
      const totalRewards = pools.reduce((sum, pool) => sum + (pool.total_rewards || 0), 0);
      const averageApy = pools.length > 0 ? pools.reduce((sum, pool) => sum + (pool.apy || 0), 0) / pools.length : 0;
      const activePositions = positions?.length || 0;

      return {
        totalStaked,
        totalRewards,
        activePositions,
        averageApy
      };
    } catch (error) {
      console.error('Error getting staking stats:', error);
      return {
        totalStaked: 0,
        totalRewards: 0,
        activePositions: 0,
        averageApy: 0
      };
    }
  }

  // Claim rewards
  async claimRewards(positionId: string): Promise<{ success: boolean; message?: string }> {
    if (!this.userId) {
      return { success: false, message: 'User ID not set' };
    }

    try {
      // Get the position
      const { data: position, error: positionError } = await supabase
        .from('staking_positions')
        .select('*')
        .eq('id', positionId)
        .eq('user_id', this.userId)
        .single();

      if (positionError || !position) {
        return { success: false, message: 'Position not found' };
      }

      if (position.status !== 'active') {
        return { success: false, message: 'Position is not active' };
      }

      // Calculate rewards
      const startDate = new Date(position.start_date);
      const now = new Date();
      const timeDiff = now.getTime() - startDate.getTime();
      const daysStaked = timeDiff / (1000 * 3600 * 24);
      const rewards = (position.amount * position.apy * daysStaked) / 365;

      // Update position with claimed rewards
      const { error: updateError } = await supabase
        .from('staking_positions')
        .update({
          rewards: position.rewards + rewards,
          last_claim_date: new Date().toISOString()
        })
        .eq('id', positionId);

      if (updateError) {
        console.error('Error claiming rewards:', updateError);
        return { success: false, message: updateError.message };
      }

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: this.userId,
          action: 'staking_reward',
          wallet_type: 'trading',
          amount: rewards,
          asset: position.token,
          performed_by: this.userId,
          remarks: `Staking reward claimed for position ${positionId}`,
          status: 'completed'
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return { success: false, message: 'Failed to claim rewards' };
    }
  }

  // Unstake tokens
  async unstakeTokens(positionId: string): Promise<{ success: boolean; message?: string }> {
    if (!this.userId) {
      return { success: false, message: 'User ID not set' };
    }

    try {
      // Get the position
      const { data: position, error: positionError } = await supabase
        .from('staking_positions')
        .select('*')
        .eq('id', positionId)
        .eq('user_id', this.userId)
        .single();

      if (positionError || !position) {
        return { success: false, message: 'Position not found' };
      }

      if (position.status !== 'active') {
        return { success: false, message: 'Position is not active' };
      }

      // Check if lock period has passed
      const startDate = new Date(position.start_date);
      const now = new Date();
      const timeDiff = now.getTime() - startDate.getTime();
      const daysStaked = timeDiff / (1000 * 3600 * 24);

      if (daysStaked < position.lock_period) {
        return { success: false, message: 'Lock period has not passed yet' };
      }

      // Calculate final rewards
      const rewards = (position.amount * position.apy * daysStaked) / 365;
      const totalAmount = position.amount + rewards;

      // Update position status
      const { error: updateError } = await supabase
        .from('staking_positions')
        .update({
          status: 'completed',
          end_date: new Date().toISOString(),
          rewards: rewards
        })
        .eq('id', positionId);

      if (updateError) {
        console.error('Error updating position:', updateError);
        return { success: false, message: updateError.message };
      }

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: this.userId,
          action: 'staking_unstake',
          wallet_type: 'trading',
          amount: totalAmount,
          asset: position.token,
          performed_by: this.userId,
          remarks: `Unstaked ${position.amount} ${position.token} + ${rewards} rewards`,
          status: 'completed'
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      return { success: false, message: 'Failed to unstake tokens' };
    }
  }

  // Stake tokens
  async stakeTokens(poolId: string, amount: number, token: string): Promise<{ success: boolean; message?: string }> {
    if (!this.userId) {
      return { success: false, message: 'User ID not set' };
    }

    try {
      // Get the pool
      const { data: pool, error: poolError } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('id', poolId)
        .eq('status', 'active')
        .single();

      if (poolError || !pool) {
        return { success: false, message: 'Pool not found or inactive' };
      }

      if (amount < pool.min_stake) {
        return { success: false, message: `Minimum stake is ${pool.min_stake} ${token}` };
      }

      if (amount > pool.max_stake) {
        return { success: false, message: `Maximum stake is ${pool.max_stake} ${token}` };
      }

      // Create staking position
      const { error: positionError } = await supabase
        .from('staking_positions')
        .insert({
          user_id: this.userId,
          pool_id: poolId,
          token: token,
          amount: amount,
          apy: pool.apy,
          start_date: new Date().toISOString(),
          status: 'active',
          lock_period: pool.lock_period,
          rewards: 0
        });

      if (positionError) {
        console.error('Error creating staking position:', positionError);
        return { success: false, message: positionError.message };
      }

      // Update pool total staked
      const { error: poolUpdateError } = await supabase
        .from('staking_pools')
        .update({
          total_staked: pool.total_staked + amount
        })
        .eq('id', poolId);

      if (poolUpdateError) {
        console.error('Error updating pool:', poolUpdateError);
      }

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: this.userId,
          action: 'staking_stake',
          wallet_type: 'trading',
          amount: amount,
          asset: token,
          performed_by: this.userId,
          remarks: `Staked ${amount} ${token} in pool ${pool.name}`,
          status: 'completed'
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error staking tokens:', error);
      return { success: false, message: 'Failed to stake tokens' };
    }
  }
}

const supabaseStakingService = new SupabaseStakingService();
export default supabaseStakingService; 
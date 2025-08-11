// Database Test Utility
// Use this to verify database state and troubleshoot profile issues

import supabase from '@/lib/supabaseClient';

export const testDatabaseState = async () => {
  console.log('🧪 DATABASE STATE TEST');
  console.log('========================');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔍 Test 1: Supabase Connection');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError);
      return { success: false, error: connectionError.message };
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check current user
    console.log('\n🔍 Test 2: Current User');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
      return { success: false, error: userError.message };
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return { success: false, error: 'No authenticated user' };
    }
    
    console.log('✅ Current user:', user.email);
    console.log('✅ User ID:', user.id);
    
    // Test 3: Check if profile exists
    console.log('\n🔍 Test 3: User Profile');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      console.log('💡 This means the profile is missing. Run the database migration to fix this.');
      return { success: false, error: profileError.message };
    }
    
    console.log('✅ Profile found:', profile);
    
    // Test 4: Check user role
    console.log('\n🔍 Test 4: User Role');
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleError) {
      console.error('❌ Role error:', roleError);
      console.log('💡 This means the user role is missing. Run the database migration to fix this.');
    } else {
      console.log('✅ User role:', role.role);
    }
    
    // Test 5: Check table counts
    console.log('\n🔍 Test 5: Table Counts');
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: roleCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Total profiles:', profileCount);
    console.log('✅ Total user roles:', roleCount);
    
    console.log('\n✅ All database tests completed successfully!');
    return { 
      success: true, 
      user: user.email,
      profile: profile,
      role: role?.role,
      counts: { profiles: profileCount, roles: roleCount }
    };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return { success: false, error: error.message };
  }
};

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testDatabase = testDatabaseState;
}

// Supabase connection test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not found');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection test error:', err.message);
    return false;
  }
}

async function testAuth() {
  try {
    console.log('\n🔐 Testing auth service...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth service error:', error.message);
      return false;
    }
    
    console.log('✅ Auth service accessible');
    console.log('Current session:', data.session ? 'Active' : 'None');
    return true;
  } catch (err) {
    console.error('❌ Auth test error:', err.message);
    return false;
  }
}

async function runTests() {
  const dbTest = await testConnection();
  const authTest = await testAuth();
  
  console.log('\n📊 Test Results:');
  console.log('Database:', dbTest ? '✅ PASS' : '❌ FAIL');
  console.log('Auth:', authTest ? '✅ PASS' : '❌ FAIL');
  
  if (dbTest && authTest) {
    console.log('\n🎉 All tests passed! Supabase is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Check your configuration.');
  }
}

runTests().catch(console.error);
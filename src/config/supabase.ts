import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 개발 환경에서 유효하지 않은 URL 처리
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 환경 변수 검증 및 클라이언트 생성
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url' || !isValidUrl(supabaseUrl)) {
    console.warn('⚠️  Supabase 환경 변수가 설정되지 않았습니다. 로컬 개발용 더미 클라이언트를 사용합니다.');
    console.warn('   실제 Supabase를 사용하려면 .env 파일을 설정하세요.');
    
    // 더미 URL로 클라이언트 생성 (개발 환경에서만 사용)
    return createClient<Database>(
      'https://dummy.supabase.co',
      'dummy-anon-key'
    );
  } else {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
};

export const supabase = createSupabaseClient();
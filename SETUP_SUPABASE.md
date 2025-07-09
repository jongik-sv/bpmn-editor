# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase 웹사이트](https://supabase.com)에서 계정을 만들고 로그인합니다.
2. "New project" 버튼을 클릭하여 새 프로젝트를 생성합니다.
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전을 설정합니다.

## 2. 프로젝트 설정 정보 확인

프로젝트 생성 후 다음 정보를 확인하세요:

1. **Project URL**: `https://[your-project-id].supabase.co`
2. **API Key (anon/public)**: Project Settings > API > anon public 키

## 3. 환경 변수 설정

`.env` 파일을 열고 다음과 같이 설정하세요:

```bash
# 실제 Supabase 프로젝트 정보로 변경
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 4. 데이터베이스 스키마 설정

Supabase SQL Editor에서 다음 스크립트를 실행하여 필요한 테이블을 생성하세요:

```sql
-- 사용자 프로필 테이블
create table public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 프로젝트 테이블
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 다이어그램 테이블
create table public.diagrams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  bpmn_xml text,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 폴더 테이블
create table public.folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- 실시간 협업을 위한 BPMN 문서 테이블
create table public.bpmn_documents (
  diagram_id uuid references public.diagrams(id) on delete cascade primary key,
  content integer[],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) 설정
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.diagrams enable row level security;
alter table public.folders enable row level security;
alter table public.bpmn_documents enable row level security;

-- 프로필 정책
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 프로젝트 정책
create policy "Users can view own projects" on public.projects for select using (auth.uid() = owner_id);
create policy "Users can insert own projects" on public.projects for insert with check (auth.uid() = owner_id);
create policy "Users can update own projects" on public.projects for update using (auth.uid() = owner_id);
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = owner_id);

-- 다이어그램 정책
create policy "Users can view diagrams in own projects" on public.diagrams for select using (
  project_id in (select id from public.projects where owner_id = auth.uid())
);
create policy "Users can insert diagrams in own projects" on public.diagrams for insert with check (
  project_id in (select id from public.projects where owner_id = auth.uid())
);
create policy "Users can update diagrams in own projects" on public.diagrams for update using (
  project_id in (select id from public.projects where owner_id = auth.uid())
);
create policy "Users can delete diagrams in own projects" on public.diagrams for delete using (
  project_id in (select id from public.projects where owner_id = auth.uid())
);

-- 폴더 정책
create policy "Users can view folders in own projects" on public.folders for select using (
  project_id in (select id from public.projects where owner_id = auth.uid())
);
create policy "Users can insert folders in own projects" on public.folders for insert with check (
  project_id in (select id from public.projects where owner_id = auth.uid())
);
create policy "Users can update folders in own projects" on public.folders for update using (
  project_id in (select id from public.projects where owner_id = auth.uid())
);
create policy "Users can delete folders in own projects" on public.folders for delete using (
  project_id in (select id from public.projects where owner_id = auth.uid())
);

-- BPMN 문서 정책
create policy "Users can view bpmn documents in own projects" on public.bpmn_documents for select using (
  diagram_id in (
    select d.id from public.diagrams d
    join public.projects p on d.project_id = p.id
    where p.owner_id = auth.uid()
  )
);
create policy "Users can insert bpmn documents in own projects" on public.bpmn_documents for insert with check (
  diagram_id in (
    select d.id from public.diagrams d
    join public.projects p on d.project_id = p.id
    where p.owner_id = auth.uid()
  )
);
create policy "Users can update bpmn documents in own projects" on public.bpmn_documents for update using (
  diagram_id in (
    select d.id from public.diagrams d
    join public.projects p on d.project_id = p.id
    where p.owner_id = auth.uid()
  )
);
```

## 5. 인증 설정 (선택사항)

Google OAuth를 사용하려면:

1. Supabase 대시보드에서 Authentication > Providers로 이동
2. Google 제공자를 활성화
3. Google Cloud Console에서 OAuth 클라이언트 ID 설정
4. 리다이렉트 URL 설정: `https://[your-project-id].supabase.co/auth/v1/callback`

## 6. 실시간 기능 활성화

1. Supabase 대시보드에서 Settings > API로 이동
2. Realtime이 활성화되어 있는지 확인
3. 필요한 테이블에 대해 Realtime을 활성화

## 7. 개발 서버 재시작

설정 완료 후 개발 서버를 재시작하세요:

```bash
npm run dev
```

## 문제 해결

### 일반적인 오류들:

1. **Invalid URL 오류**: VITE_SUPABASE_URL이 올바른 형식인지 확인
2. **API Key 오류**: anon public 키가 올바른지 확인
3. **RLS 오류**: 행 수준 보안 정책이 올바르게 설정되었는지 확인

### 로그 확인:

- 브라우저 콘솔에서 Supabase 관련 오류 메시지 확인
- Supabase 대시보드의 Logs 섹션에서 데이터베이스 오류 확인
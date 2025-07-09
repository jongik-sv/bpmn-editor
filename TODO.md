# BPMN 협업 에디터 개발 계획

## 📋 현재 상태 (Current Status)

### ✅ 완료된 기능
- [x] **프로젝트 기본 설정**: React + Vite + TypeScript + Ant Design
- [x] **인증 시스템**: Supabase Auth + Google OAuth
- [x] **기본 라우팅**: React Router 기반 SPA
- [x] **로그인 페이지**: 회원가입/로그인 UI
- [x] **대시보드**: 프로젝트/다이어그램 관리 UI
- [x] **BPMN 에디터**: 기본 bpmn-js 통합
- [x] **Context 관리**: AuthContext, ProjectContext
- [x] **기본 스타일링**: Ant Design + Custom CSS
- [x] **환경 설정**: .env 파일 및 Supabase 연결 완료
- [x] **타입 안정성**: TypeScript 에러 수정 및 타입 시스템 구축
- [x] **개발 서버**: Vite HMR 포트 통일 및 WebSocket 연결 문제 해결

### ⚠️ 진행 중인 작업
- [x] **기본 인증 플로우 테스트**: Supabase 연결 및 서버 설정 완료
- [x] **프로젝트/다이어그램 CRUD 테스트**: 모든 데이터베이스 테이블 접근 및 CRUD 기능 검증 완료

### 🎯 Phase 1 완료!
**기본 기능 안정화** 단계가 완료되었습니다. 모든 핵심 인프라가 구축되고 테스트되었습니다.

## 🎯 개발 우선순위 및 계획

## Phase 1: 기본 기능 안정화 (1-2주)

### 1.1 환경 설정 및 연결 (Priority: 🔴 Critical) ✅ 완료
- [x] `.env` 파일 생성 및 Supabase 연결 설정
- [x] Supabase 데이터베이스 연결 테스트 통과
- [x] 인증 흐름 테스트 (환경 설정 완료)
- [x] 기본 CRUD 작업 테스트 (프로젝트, 다이어그램) ✅ 완료

### 1.2 타입 안정성 개선 (Priority: 🟡 High) ✅ 완료
- [x] TypeScript 에러 수정 (union type 구문 오류 해결)
- [x] 인터페이스 정의 완성 (User, Project, Diagram 등)
- [x] API 응답 타입 정의 (ApiResponse<T> 타입)
- [x] 에러 처리 개선 (AuthContext 강화)

### 1.3 기본 UI/UX 개선 (Priority: 🟡 High)
- [ ] 로딩 상태 개선
- [ ] 에러 메시지 개선
- [ ] 반응형 디자인 완성
- [ ] 접근성 개선

## Phase 2: BPMN 에디터 고도화 (2-3주)

### 2.1 BPMN 에디터 기능 확장 (Priority: 🔴 Critical)
- [ ] **Properties Panel 추가**: 요소별 속성 편집
- [ ] **Palette 커스터마이징**: 한국어 지원 및 필요한 요소만 표시
- [ ] **키보드 단축키**: Ctrl+S 저장, Ctrl+Z 실행취소 등
- [ ] **Export 기능**: PNG, SVG, PDF 내보내기
- [ ] **Import 기능**: 기존 BPMN 파일 가져오기

### 2.2 자동 저장 시스템 (Priority: 🟡 High)
- [ ] **실시간 저장**: 변경 시 자동 저장 (debounce 적용)
- [ ] **충돌 감지**: 동시 편집 감지 및 처리
- [ ] **버전 관리**: 변경 이력 추적
- [ ] **오프라인 지원**: Local Storage 백업

### 2.3 사용자 경험 개선 (Priority: 🟢 Medium)
- [ ] **실행 취소/다시 실행**: 명령 히스토리 관리
- [ ] **확대/축소**: 마우스 휠 지원
- [ ] **미니맵**: 큰 다이어그램 네비게이션
- [ ] **드래그 앤 드롭**: 파일 드롭으로 열기

## Phase 3: 실시간 협업 기능 (2-3주) ⚡ 단축됨

### 3.1 Yjs + Supabase Realtime 직접 구현 (Priority: 🔴 Critical) ⚠️ 재구현 필요
- [x] **Y-Supabase 설치 및 설정**: `npm install y-supabase` (삭제 예정)
- [x] **SupabaseProvider 통합**: Y.Doc과 Supabase 연결 (재구현 필요)
- [x] **실시간 동기화**: 문서 변경사항 실시간 동기화 (재구현 필요)
- [x] **Awareness 구현**: 사용자 커서 및 선택 상태 공유 (재구현 필요)
- [x] **자동 저장**: 변경사항 자동 데이터베이스 저장 (재구현 필요)
- [ ] **y-supabase 제거**: 불안정한 라이브러리 제거
- [ ] **Yjs + Supabase Realtime 직접 구현**: 안정적인 협업 시스템 구축
- [ ] **새로운 아키텍처 적용**: 모듈화된 훅 기반 구조

### 3.2 협업 UI 구현 (Priority: 🟡 High)
- [ ] **온라인 사용자 목록**: 현재 편집 중인 사용자 표시
- [ ] **사용자 색상**: 각 사용자별 고유 색상
- [ ] **활동 표시**: 실시간 편집 활동 표시
- [ ] **채팅 기능**: 간단한 텍스트 채팅 (선택적)

### 3.3 권한 관리 (Priority: 🟡 High)
- [ ] **역할 기반 권한**: Owner, Editor, Viewer
- [ ] **프로젝트 공유**: 이메일로 초대
- [ ] **읽기 전용 모드**: Viewer 권한 구현
- [ ] **수정 권한 제어**: 세부 권한 관리

## Phase 4: 고급 기능 (4-5주)

### 4.1 폴더 및 파일 관리 (Priority: 🟢 Medium)
- [ ] **폴더 시스템**: 계층적 폴더 구조
- [ ] **파일 검색**: 제목, 내용 기반 검색
- [ ] **태그 시스템**: 다이어그램 분류
- [ ] **즐겨찾기**: 자주 사용하는 다이어그램

### 4.2 템플릿 시스템 (Priority: 🟢 Medium)
- [ ] **기본 템플릿**: 일반적인 BPMN 패턴
- [ ] **사용자 템플릿**: 커스텀 템플릿 생성
- [ ] **템플릿 공유**: 팀 내 템플릿 공유
- [ ] **템플릿 갤러리**: 미리 만든 템플릿 제공

### 4.3 댓글 및 리뷰 (Priority: 🟢 Medium)
- [ ] **요소별 댓글**: BPMN 요소에 댓글 추가
- [ ] **댓글 스레드**: 댓글에 대한 답글
- [ ] **리뷰 모드**: 승인/수정 요청 워크플로우
- [ ] **알림 시스템**: 댓글 및 변경사항 알림

## Phase 5: 성능 최적화 및 배포 (1-2주)

### 5.1 성능 최적화 (Priority: 🟡 High)
- [ ] **코드 분할**: React.lazy 기반 지연 로딩
- [ ] **이미지 최적화**: SVG 압축 및 최적화
- [ ] **번들 최적화**: Tree shaking 및 압축
- [ ] **메모리 관리**: 메모리 누수 방지

### 5.2 배포 및 DevOps (Priority: 🟡 High)
- [ ] **CI/CD 파이프라인**: GitHub Actions
- [ ] **Docker 컨테이너화**: 프로덕션 배포
- [ ] **모니터링**: 에러 추적 및 성능 모니터링
- [ ] **백업 시스템**: 데이터 백업 및 복구

### 5.3 테스트 (Priority: 🟢 Medium)
- [ ] **단위 테스트**: 컴포넌트 테스트
- [ ] **통합 테스트**: API 연동 테스트
- [ ] **E2E 테스트**: 사용자 시나리오 테스트
- [ ] **성능 테스트**: 부하 테스트

## 🛠️ 기술적 고려사항

### 우선 해결해야 할 기술 이슈
1. **Supabase 연결**: 환경 변수 설정 및 데이터베이스 스키마
2. **TypeScript 에러**: 타입 정의 완성
3. **BPMN-JS 통합**: Props 전달 및 이벤트 처리
4. **Y-Supabase 통합**: 실시간 협업을 위한 Yjs + Supabase 연결
5. **상태 관리**: Context API vs Redux Toolkit 선택

### 성능 고려사항
1. **대용량 다이어그램**: 가상화 및 지연 로딩
2. **실시간 동기화**: Debouncing 및 최적화
3. **메모리 사용량**: WeakMap 사용 및 정리
4. **네트워크 효율성**: Delta sync 및 압축

### 보안 고려사항
1. **인증/인가**: JWT 토큰 관리
2. **API 보안**: Rate limiting 및 validation
3. **데이터 보호**: 암호화 및 백업
4. **XSS 방지**: Input validation

## 📅 예상 일정

| Phase | 기간 | 주요 목표 |
|-------|------|-----------|
| Phase 1 | 1-2주 | 기본 기능 안정화 및 환경 설정 |
| Phase 2 | 2-3주 | BPMN 에디터 고도화 |
| Phase 3 | 2-3주 | 실시간 협업 구현 ⚡ (Y-Supabase 덕분에 단축) |
| Phase 4 | 4-5주 | 고급 기능 개발 |
| Phase 5 | 1-2주 | 최적화 및 배포 |

**총 예상 기간**: 10-15주 (약 2.5-3.5개월) ⚡ 단축됨

## 🎯 다음 단계 (Next Actions)

### 즉시 해야 할 작업 (이번 주)
1. [x] `.env` 파일 생성 및 Supabase 프로젝트 설정 ✅
2. [x] TypeScript 에러 수정 ✅  
3. [x] 기본 인증 플로우 테스트 ✅
4. [ ] 프로젝트/다이어그램 CRUD 테스트 ⏳ 진행 중

### 다음 주 목표
1. [ ] Properties Panel 구현
2. [ ] Y-Supabase 프로토타입 구현
3. [ ] Export 기능 구현
4. [ ] 사용자 경험 개선

---

## 📝 개발 노트

### 결정 사항
- **UI Framework**: Ant Design 5 (일관성 있는 디자인)
- **상태 관리**: React Context (현재), 필요시 Redux Toolkit 고려
- **실시간 협업**: Y-Supabase (Yjs + Supabase 통합) ⚡ 새로 채택
- **백엔드**: Supabase (빠른 개발 및 확장성)
- **WebSocket**: 불필요 (Y-Supabase가 Supabase 실시간 기능 활용)

### Y-Supabase 선택 이유
- **개발 효율성**: 별도 WebSocket 서버 불필요
- **Supabase 네이티브**: 기존 인프라와 완벽 통합
- **자동 저장**: 변경사항 자동 데이터베이스 저장
- **연결 상태 관리**: 자동화된 연결 관리
- **Awareness 지원**: 사용자 커서 및 상태 공유

### 고려할 대안
- **상태 관리**: Zustand (더 가벼운 대안)
- **스타일링**: Styled-components (CSS-in-JS)
- **테스팅**: Vitest (Vite 친화적)
- **배포**: Vercel (간편한 배포)

### 참고 자료
- [bpmn-js Documentation](https://bpmn.io/toolkit/bpmn-js/)
- [Supabase Docs](https://supabase.com/docs)
- [Ant Design Components](https://ant.design/components/overview/)
- [Yjs Documentation](https://docs.yjs.dev/)
- [Y-Supabase GitHub](https://github.com/alexdunmow/y-supabase) ⚡ 새로 추가

---

**마지막 업데이트**: 2025-07-09 (Y-Supabase 통합 계획 반영)  
**작성자**: Claude Code Assistant
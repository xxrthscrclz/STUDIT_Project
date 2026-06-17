# StudIt — Agent Guide

이 파일은 **AI 에이전트(Cursor 등)**가 StudIt 저장소에서 작업할 때 먼저 읽는 가이드입니다.  
사용자는 CRiT Frontend와 유사한 **페이지·라우트·API·MSW·Zustand** 구조로 개발합니다.

## 저장소 개요

| 경로 | 설명 |
|------|------|
| `backend/` | Spring Boot 3 REST API (Java 17, H2, JWT, Gemini) |
| `frontend/` | React 19 + Vite + Tailwind + Axios + Zustand + MSW |
| `pnpm-workspace.yaml` | 프론트만 워크스페이스 (`frontend`) |

## 프론트엔드 — 반드시 지킬 규칙

1. **경로 별칭**: `@/*` → `frontend/src/*`
2. **API 호출**: 페이지/스토어에서 `fetch` 직접 사용 금지 → `@/api/command` 함수 사용
3. **HTTP 클라이언트**: `@/api/axios` (Axios 인스턴스 + 인터셉터)
4. **인증 토큰**: `@/utils/auth` (`getToken`, `setToken`, `hasAuth`)
5. **전역 인증 상태**: `@/stores/authStore` (Zustand)
6. **라우트 보호**: `@/routes/privateRoute` (`PrivateRoute`)
7. **페이지 파일명**: `pages/<도메인>/index.tsx` (default export)
8. **MSW 목**: `VITE_USE_MOCK=true` → `src/mocks/handlers.ts` + `src/mocks/data/`
9. **환경 변수**: `VITE_SERVER_URL`, `VITE_USE_MOCK` (`.env`는 `frontend/.env`)

## 환경 변수 (`frontend/.env`)

```env
VITE_SERVER_URL=http://127.0.0.1:8080
VITE_USE_MOCK=true
```

- 목 모드: 백엔드 없이 UI 개발. **아이디·비밀번호 아무 값이나 입력 시 로그인 성공** (기본 시간표 5과목 표시)
- 실 API: `VITE_USE_MOCK=false` + `backend` `./gradlew bootRun`

## 라우팅 (`frontend/src/routes/routes.tsx`)

| 경로 | 페이지 | 접근 |
|------|--------|------|
| `/` | `pages/main` | 공개 |
| `/login` | `pages/login` | 공개 |
| `/signup` | `pages/signup` | 공개 |
| `/rooms` | `pages/rooms` | 공개 |
| `/rooms/:roomId` | `pages/rooms/detail` | 공개 |
| `/reservations` | `pages/reservations` | `PrivateRoute` |
| `/reservations/create/:seatId` | `pages/reservations/create` | `PrivateRoute` |
| `/timetable` | `pages/timetable` | `PrivateRoute` |
| `/timetable/add` | `pages/timetable/add` | `PrivateRoute` |
| `/timetable/recommend` | `pages/timetable/recommend` | `PrivateRoute` |

## 프로젝트 구조 (`frontend/src`)

```
src/
├── index.tsx              # 엔트리: MSW → auth refresh → AppRouter
├── index.css
├── vite-env.d.ts
│
├── api/
│   ├── axios.ts           # Axios 인스턴스, JWT 헤더, 에러 변환
│   ├── command.ts         # REST API 함수 (getRooms, postLogin, …)
│   ├── config.ts          # VITE_SERVER_URL, apiUrl
│   ├── errors.ts          # ApiRequestError
│   └── types.ts           # 요청/응답 타입
│
├── assets/                # 이미지, 폰트, 아이콘
│
├── components/            # 재사용 UI (페이지 조립 블록)
│   ├── header/            # GNB
│   ├── layout/            # Layout (Outlet + Header)
│   ├── timetable/         # WeeklyGrid
│   └── ui/                # Card, Button, Input, Alert
│
├── constants/             # (필요 시) 상수
│
├── mocks/
│   ├── browser.ts         # MSW worker
│   ├── enableMocking.ts   # DEV + VITE_USE_MOCK 시 worker.start
│   ├── handlers.ts        # http.get/post … 핸들러
│   └── data/              # 인메모리 목 데이터 (index.ts)
│
├── pages/                 # 라우트 단위 (default export)
│   ├── main/
│   ├── login/
│   ├── signup/
│   ├── rooms/ + rooms/detail/
│   ├── reservations/ + reservations/create/
│   └── timetable/ + add/ + recommend/
│
├── routes/
│   ├── routes.tsx         # BrowserRouter, Route 정의
│   └── privateRoute.tsx   # 로그인 필요 라우트 래퍼
│
├── stores/
│   └── authStore.ts       # Zustand 인증
│
└── utils/
    └── auth.ts            # localStorage 토큰
```

## API 추가 시 체크리스트

1. `api/types.ts`에 타입 추가
2. `api/command.ts`에 함수 추가 (`api.get` / `api.post`)
3. MSW 목 사용 시 `mocks/handlers.ts` + 필요하면 `mocks/data/` 수정
4. 페이지에서는 `command`만 import

## MSW

- 워커 파일: `frontend/public/mockServiceWorker.js` (**수정 금지**, `pnpm msw:init`으로 재생성)
- 핸들러 수정: `mocks/handlers.ts`
- 목 데이터: `mocks/data/index.ts`

## 백엔드 (간단 참고)

- 포트: `8080`, API prefix: `/api`
- 실행: `cd backend && ./gradlew bootRun`
- env: `backend/.env` (`GEMINI_API_KEY`, `CORS_ALLOWED_ORIGINS` 등)

## 스크립트 (루트)

```bash
pnpm install
pnpm dev:frontend      # Vite :5173
pnpm dev:backend       # Spring Boot :8080
pnpm build:frontend
pnpm lint
pnpm format
```

## 작업 시 하지 말 것

- `mockServiceWorker.js` 수동 편집
- 페이지에서 `api/axios` 직접 import (command 경유)
- `context/AuthContext` 사용 (제거됨 → `authStore`)
- 프로덕션 번들에 MSW 포함 (`enableMocking`은 DEV + MOCK 일 때만)

## 관련 문서

- 사용자용: 루트 `README.md`
- Cursor 규칙: `.cursor/rules/studit-project.mdc`

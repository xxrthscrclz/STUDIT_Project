# StudIt — Study It, 공부 환경을 위한 스터디룸 좌석 예약

> **웹서버컴퓨팅 AD 프로젝트**  
> 팀명: StudIt | 학번: 20211882 | 이름: 박주호  
> **주제:** 수업 시간표 + 좌석 현황 기반 스터디룸 예약 + AI 학습 시간 추천  
> **스택:** Spring Boot 3 + React 19 + Tailwind CSS + H2 + Google Gemini API

---

## 1. 프로젝트 개요

**StudIt**(Study It)은 캠퍼스 스터디룸 좌석을 **날짜·시간대** 기준으로 예약하는 풀스택 웹 서비스입니다.  
단순 예약을 넘어 **수업 시간표 충돌 검사**, **중복 예약 방지**, **Gemini API 기반 AI 학습 시간 추천**을 제공합니다.

### 차별화 포인트

| 항목 | 설명 |
| --- | --- |
| 시간표 연동 | 등록한 수업 시간과 겹치는 예약 자동 차단 |
| 중복 예약 방지 | 동일 좌석·동일 사용자 시간대 중복 예약 불가 |
| AI 학습 추천 | Gemini API로 공백 시간 분석 + 공부 방법 코멘트 |
| 서비스 계층 분리 | `ReservationService`에서 비즈니스 로직·예외 처리 |
| 날짜별 좌석 현황 | 스터디룸 상세·예약 페이지에서 시간대별 예약 현황 확인 |

---

## 2. 모노레포 구조

```
STUDIT_Project/
├── backend/                 # Spring Boot REST API (port 8080)
├── frontend/                # React + Vite + Tailwind (port 5173)
├── package.json             # pnpm 루트 스크립트
├── pnpm-workspace.yaml
├── eslint.config.mjs        # @frontend/eslint-config
├── prettier.config.mjs      # @frontend/prettier-config
└── README.md
```

### 프론트엔드 (`frontend/src`)

```
src/
├── api/              # API 설정(config) · 요청(client) · 타입(types)
├── assets/           # 정적 리소스 (이미지, 아이콘)
├── components/
│   ├── layout/       # Layout, ProtectedRoute
│   ├── timetable/    # WeeklyGrid
│   └── ui/           # Button, Card, Input 등
├── mocks/            # MSW (handlers, db, browser)
├── pages/
│   ├── main/         # 홈
│   ├── login/        # 로그인 · 회원가입
│   ├── rooms/        # 스터디룸
│   ├── reservations/ # 예약
│   └── timetable/    # 시간표 · AI 추천
├── routes/           # react-router 설정
├── stores/           # Zustand (authStore)
├── index.css
└── index.tsx         # 엔트리
```

### 아키텍처

```
[React SPA]  → REST /api (JWT)
            → Spring Controllers
            → Service Layer (예약·추천·Gemini)
            → JPA / H2
            → Google Gemini API
```

---

## 3. 환경 변수

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

```env
SERVER_URL=http://000.00.0.00:8080
SERVER_PORT=8080
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://000.00.0.00:5173
JWT_SECRET=studit-dev-jwt-secret-key-change-in-production-min-32-chars
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_SERVER_URL=http://000.00.0.00:8080
VITE_USE_MOCK=true
```

- `VITE_USE_MOCK=true`: MSW 목 API (백엔드 불필요)
- `VITE_USE_MOCK=false`: Vite가 `/api`를 `VITE_SERVER_URL`로 프록시 (로컬은 `http://127.0.0.1:8080` 권장)

---

## 4. 실행 방법

### 사전 요구사항

- Java 17+
- Node.js 20+ & [pnpm](https://pnpm.io/)
- (선택) Google AI Studio API 키 — AI 추천 사용 시

### 설치

```bash
pnpm install
```

### 백엔드

```bash
cd backend
cp .env.example .env   # GEMINI_API_KEY 등 설정
./gradlew bootRun
```

- API: http://localhost:8080/api  
- H2 콘솔: http://localhost:8080/h2-console  

### 프론트엔드

```bash
cp frontend/.env.example frontend/.env
pnpm dev:frontend
```

브라우저: http://localhost:5173

#### MSW 목 모드 (백엔드 없이 UI만 개발)

`frontend/.env`에 아래처럼 설정하면 **MSW**가 `/api/*` 요청을 가로채 목 데이터를 반환합니다.

```env
VITE_USE_MOCK=true
```

- 데모 계정: `demo` / `demo1234`
- 실제 API 연동 시: `VITE_USE_MOCK=false` + 백엔드 `bootRun`

최초 클론 후 Service Worker 파일이 없으면:

```bash
cd frontend && pnpm msw:init
```

### 루트 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev:frontend` | Vite 개발 서버 |
| `pnpm dev:backend` | Spring Boot 실행 |
| `pnpm lint` | ESLint ([공유 설정](https://github.com/xxrthscrclz/eslint-prettier-configs)) |
| `pnpm format` | Prettier 포맷 |

---

## 5. 주요 API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 (JWT) |
| GET | `/api/rooms` | 스터디룸 목록 |
| GET | `/api/rooms/{id}?date=` | 스터디룸 상세 |
| POST | `/api/reservations` | 좌석 예약 |
| GET | `/api/reservations/me` | 내 예약 |
| POST | `/api/reservations/{id}/cancel` | 예약 취소 |
| GET/POST/DELETE | `/api/timetable` | 시간표 CRUD |
| GET | `/api/timetable/recommendations` | AI 학습 추천 |

---

## 6. 시연용 데이터

백엔드 최초 실행 시 **미래관 1F 스터디룸**(좌석 1~8번)이 자동 생성됩니다.

1. 회원가입 → 로그인  
2. `/timetable` → 수업 등록  
3. `/rooms` → 스터디룸 · 좌석 예약  
4. `/timetable/recommend` → AI 추천 확인  
5. `/reservations` → 내 예약 확인  

---

## 7. GitHub

> 저장소: https://github.com/xxrthscrclz/AD_Project_STUDIT

```bash
git clone https://github.com/xxrthscrclz/AD_Project_STUDIT.git
cd AD_Project_STUDIT
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# 터미널 1
cd backend && ./gradlew bootRun
# 터미널 2
pnpm dev:frontend
```

---

## 8. 참고

- Spring Boot: https://spring.io/projects/spring-boot  
- React: https://react.dev/  
- Tailwind CSS: https://tailwindcss.com/  
- ESLint/Prettier 공유 설정: https://github.com/xxrthscrclz/eslint-prettier-configs  
- Google Gemini API: https://ai.google.dev/

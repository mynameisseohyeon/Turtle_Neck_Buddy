# Turtle Neck Buddy

Turtle Neck Buddy는 오래 앉아 일하거나 공부하는 사용자를 위한 Chrome 확장 프로그램입니다. 브라우저 팝업 안에서 거북이 마스코트가 목과 어깨 스트레칭 시간을 알려주고, 사용자가 짧은 휴식 루틴을 시작할 수 있도록 돕습니다.

이 프로젝트는 의료 앱이 아니며 자세 교정이나 통증 치료를 보장하지 않습니다. 목표는 브라우저를 사용하는 동안 부담 없이 스트레칭 습관을 만들 수 있게 하는 가벼운 로컬 우선 위젯입니다.

## 주요 기능

- Chrome Extension Manifest V3 기반 팝업 UI
- React + TypeScript + Vite 개발 환경
- 도트풍 거북이 PNG 프레임 애니메이션
- 기본, 알림, 스트레칭 진행, 완료 상태 미리보기
- 오늘 완료 횟수와 다음 알림 시간 표시 영역
- 30초 스트레칭 카드 UI
- 알림 간격, 알림 사용 여부, 오늘 기록 초기화 설정 패널

## 아직 구현하지 않은 기능

- `chrome.storage.local` 기반 완료 횟수 저장
- 날짜 변경 시 오늘 기록 리셋
- `chrome.alarms` 기반 주기 알림
- `chrome.notifications` 기반 시스템 알림
- Chrome Web Store 제출용 아이콘과 스크린샷

## 기술 스택

- Chrome Extension Manifest V3
- React
- TypeScript
- Vite
- Vanilla CSS
- pnpm

## 실행 방법

의존성을 설치합니다.

```bash
pnpm install
```

개발 서버를 실행합니다.

```bash
pnpm run dev
```

브라우저에서 팝업 화면을 확인합니다.

```text
http://localhost:5173/popup.html
```

빌드합니다.

```bash
pnpm run build
```

Chrome 확장 프로그램으로 확인하려면 Chrome에서 `chrome://extensions`를 열고 Developer Mode를 켠 뒤, `dist/` 폴더를 Load unpacked로 불러옵니다.

## 프로젝트 구조

```text
public/
  assets/
    turtle/
      frames/
        idle/
        alert/
        stretch/
        success/
  icons/
src/
  popup/
    components/
    App.tsx
    Popup.css
    main.tsx
  shared/
    messages.ts
    stretchCards.ts
    types.ts
  styles/
    global.css
manifest.json
popup.html
vite.config.ts
```

## 개발 원칙

- 백엔드, 로그인, 카메라, 외부 API 없이 시작합니다.
- 웹페이지에 content script를 주입하지 않고 팝업 안에서만 동작합니다.
- 실제 원본 작업 자료인 `AGENTS.md`, `agents_docs/`, `artifacts/`, root `assets/`는 GitHub에 올리지 않습니다.
- 확장 프로그램에서 사용하는 최종 정적 자산만 `public/assets/`에 포함합니다.

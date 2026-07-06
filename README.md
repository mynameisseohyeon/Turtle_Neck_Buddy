# 🐢 Turtle Neck Buddy

> **"거북이 마스코트와 함께하는 건강한 브라우징 습관"** <br />
> Turtle Neck Buddy는 장시간 모니터를 보는 현대인들을 위한 **Chrome 확장 프로그램(Manifest V3)** 기반의 가벼운 로컬 우선(Local-first) 스트레칭 위젯입니다.

<p align="center">
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=google-chrome&logoColor=white" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
</p>
<br/>

---

## 주요 기능

* **도트풍 애니메이션 인터랙션**
  * 거북이 마스코트 PNG 프레임 애니메이션 적용
  * 상태별(기본, 알림, 스트레칭 진행, 완료) 동적 UI 전환
* **대시보드 및 리마인더**
  * 오늘 누적 스트레칭 완료 횟수 트래킹
  * 다음 스트레칭 알림까지 남은 시간 실시간 표시
* **인터랙티브 가이드**
  * 30초 단위의 직관적인 스트레칭 카드 UI 제공
* **사용자 맞춤형 설정 (Local Storage 기반)**
  * 알림 간격 설정 (타이머 커스텀)
  * 알림 On/Off 토글 기능
  * 일일 기록 초기화 기능
<br/>

---

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

Chrome 확장 프로그램으로 확인하려면<br/>
Chrome에서 `chrome://extensions`를 열고 Developer Mode를 켠 뒤,<br/>
`dist/` 폴더를 Load unpacked로 불러옵니다.
<br/>
<br/>

---

>본 프로젝트는 **의료용 애플리케이션이 아닙니다.** 자세 교정이나 통증 치료를 보장하지 않으며,<br/>
>브라우저를 사용하는 동안 부담 없이 스트레칭 습관을 형성할 수 있도록 돕는 **단순 리마인더 위젯**입니다.



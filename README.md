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

<table> <tr> <td align="center"> <img src="https://github.com/user-attachments/assets/63d59e9c-192a-4aaa-bec2-762e72aac177" alt="온보딩 화면 1" width="100%" /> </td> <td align="center"> <img src="https://github.com/user-attachments/assets/94364f62-c2f4-4756-9b02-a33892ca2496" alt="온보딩 화면 2" width="100%" /> </td> </tr> <tr> <td align="center"> <img src="https://github.com/user-attachments/assets/d9053151-ee54-44af-90cc-280f0d111555" alt="온보딩 화면 3" width="100%" /> </td> <td align="center"> <img src="https://github.com/user-attachments/assets/9dc99fe6-8fc1-43e5-a193-1771fb94a3bf" alt="온보딩 화면 4" width="100%" /> </td> </tr> </table>


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

확장 프로그램을 로드한 뒤에는 일반 `http` 또는 `https` 페이지에서 Turtle Neck Buddy 아이콘을 눌러
팝업을 열고, `현재 사이트 켜기`를 선택해야 해당 사이트에 거북이 오버레이를 띄울 수 있습니다.
`chrome://extensions`, Chrome Web Store, 새 탭 같은 Chrome 내부 페이지에는 오버레이를 주입할 수 없습니다.

배포용 ZIP 파일은 빌드 후 `dist/` 폴더의 내부 파일들을 압축해서 만듭니다.

```bash
pnpm run build
cd dist
zip -r ../turtle-neck-buddy-chrome.zip . -x "*.DS_Store"
```

Chrome Web Store 제출 전에는 다음 항목을 준비합니다.

* 확장 프로그램 아이콘 및 스토어 스크린샷
* 한 줄 설명과 상세 설명
* 권한 사용 사유: 저장소, 알림, 알람, 현재 사이트 오버레이 주입
* 개인정보 처리방침: 서버 전송 없이 로컬 저장만 사용한다는 내용
<br/>
<br/>

---

>본 프로젝트는 **의료용 애플리케이션이 아닙니다.** 자세 교정이나 통증 치료를 보장하지 않으며,<br/>
>브라우저를 사용하는 동안 부담 없이 스트레칭 습관을 형성할 수 있도록 돕는 **단순 리마인더 위젯**입니다.

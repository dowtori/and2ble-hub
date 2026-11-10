# SIRIAI AND2BLE 운영 허브

ChatGPT Sites에서 GitHub + Vercel로 이전한 캠페인 운영 허브입니다. 별도 빌드나 런타임 의존성 없이 `dist/`를 배포합니다.

- 운영 허브: https://and2ble-hub.vercel.app/ — 운영 맵, DM, 한·일 메일 26종, 체크리스트, 일정, 자료 다운로드
- 간편 모집 메일 도구: https://and2ble-hub.vercel.app/mail-desk/ — 플랫폼별 모집·재참여 메일 준비
- 공개 GitHub 저장소: https://github.com/dowtori/and2ble-hub

## 수정과 배포

어느 GPT/Codex 계정에서든 이 저장소를 연결해 수정할 수 있습니다. 실제 푸시에는 `dowtori/and2ble-hub` 쓰기 권한이 있는 GitHub 계정이 필요합니다. 공개 열람과 쓰기 권한은 별개입니다.

1. 저장소를 클론하고 `dist/`의 해당 파일을 수정합니다.
2. `npm test`로 기존 선정 안내 6종을 확인합니다.
3. `main`에 커밋·푸시하면 연결된 Vercel 프로젝트가 자동 배포합니다.

로컬 확인은 Node.js 22 이상에서 `npm start`를 실행하고 http://127.0.0.1:4173 에 접속합니다. 설치할 패키지는 없습니다.

## 파일

| 경로 | 역할 |
| --- | --- |
| `dist/index.html` | 허브 화면과 메뉴 |
| `dist/data.js` | 운영 기준, 자료 링크, 점검 항목, DM |
| `dist/app.js` | 화면 전환, 점검, 메모, 복사, 내보내기 |
| `dist/mail-data.js` | 한·일 메일 템플릿 |
| `dist/mail.js` | 메일 개인화, 미리보기, HTML/EML/TXT 다운로드 |
| `dist/downloads/` | 운영 자료, 가이드 사본, 전체 ZIP |
| `dist/mail-desk/index.html` | 간편 모집 메일 도구 전체 소스 |
| `vercel.json` | Vercel 정적 배포 설정 |

## 데이터와 이전 범위

기존 허브 전체와 로컬 최신 플랫폼별 모집 문안을 보존했습니다. 기존 ChatGPT 사이트와 원본 폴더는 유지합니다.

체크·메모는 각 사이트 주소의 브라우저 localStorage에 저장됩니다. 기존 ChatGPT 주소의 개인 기록은 새 주소로 자동 이전되지 않습니다. 시트·운영 어드민·외부 가이드는 기존 원본으로 연결되며, 실시간 동기화나 자동 메일 발송 기능은 없습니다. 메일 입력값은 서버에 전송하지 않습니다.

개인 수신자 명단·지급 코드·인증정보와 원본 비공개 첨부 파일은 포함하지 않습니다. 가이드 사본의 외부 이미지·기능은 인터넷 연결이 필요합니다.

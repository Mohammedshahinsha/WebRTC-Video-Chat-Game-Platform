# ChatForYou Desktop - Electron 데스크톱 애플리케이션

[![License](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F.svg?logo=electron)](https://electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933.svg?logo=node.js)](https://nodejs.org/)

**ChatForYou Desktop** - 데스크톱에서 만나는 새로운 소통의 경험 🚀

ChatForYou Desktop은 WebRTC 기반 화상채팅 및 게임 플랫폼의 Electron 데스크톱 버전입니다. 
Node.js 웹 애플리케이션을 기반으로 자동 변환되어 네이티브 데스크톱 경험을 제공합니다.

## 📋 프로젝트 개요

ChatForYou Desktop은 웹 버전의 모든 기능을 데스크톱 환경에 최적화하여 제공하며, 자동 업데이트 시스템을 통해 항상 최신 버전을 유지할 수 있습니다.

### 🏗️ 아키텍처

```
ChatForYou_v2/
├── nodejs-frontend/           # 웹 버전 소스
└── chatforyou-desktop/        # 데스크톱 버전 (이 프로젝트)
    ├── src/
    │   ├── main/              # Electron Main Process
    │   │   ├── electron-main.js   # 메인 프로세스 (창 관리, 업데이트)
    │   │   └── preload.js         # 보안 브리지 스크립트
    │   ├── static/            # 정적 파일 (동기화됨)
    │   ├── templates/         # HTML 템플릿 (동기화됨)
    │   └── config/            # 환경별 설정 (동기화됨)
    ├── scripts/               # 빌드 자동화 스크립트
    ├── dist/                  # 빌드 출력
    └── app-update.yml         # 자동 업데이트 설정
```

## ✨ 주요 기능

### 🎯 웹 기반 기능 (완전 호환)
- **N:M 화상채팅**: WebRTC 기반 멀티미디어 통신
- **실시간 채팅**: DataChannel 기반 메시징
- **CatchMind 게임**: 그림 맞추기 게임
- **화면 공유**: 실시간 스크린 공유
- **파일 전송**: 이미지 파일 공유 (최대 10MB)
- **텍스트 오버레이**: 비디오 위 문자 표시
- **실시간 자막**: 음성 → 텍스트 변환
- **동적 주제 생성**: ChatGPT 기반 게임 주제

### 🖥️ 데스크톱 전용 기능
- **네이티브 창 관리**: 최소화, 최대화, 닫기
- **시스템 트레이 지원**: 백그라운드 실행
- **자동 업데이트**: GitHub Releases 기반 자동 업데이트
- **오프라인 지원**: 로컬 파일 시스템 접근
- **시스템 알림**: 네이티브 데스크톱 알림
- **글로벌 단축키**: 개발자 도구 등 (개발 모드)

### 🔄 자동 업데이트 시스템
- **백그라운드 체크**: 앱 시작 시 자동 업데이트 확인
- **웹 기반 UI**: 우아한 업데이트 알림 팝업
- **실시간 진행률**: 다운로드 진행 상황 표시
- **원클릭 설치**: 사용자 승인 후 자동 설치 및 재시작
- **롤백 지원**: 업데이트 실패 시 이전 버전 복원

## 🛠️ 기술 스택

### Core Technologies
- **Electron 28.0.0**: 크로스플랫폼 데스크톱 앱 프레임워크
- **Node.js 16+**: JavaScript 런타임
- **electron-builder**: 멀티플랫폼 빌드 도구
- **electron-updater**: 자동 업데이트 시스템

### Frontend (Synchronized)
- **jQuery**: DOM 조작 및 이벤트 처리
- **Bootstrap 5**: 반응형 UI 프레임워크
- **SCSS**: CSS 전처리기
- **WebRTC**: 실시간 미디어 통신
- **Canvas API**: 그림 그리기 및 게임

### Build & DevOps
- **GitHub Actions**: CI/CD 파이프라인
- **Sass**: SCSS 컴파일러
- **Rimraf**: 크로스플랫폼 파일 삭제

## 🚀 설치 및 실행

### 1. 사전 요구사항
```bash
# Node.js 16+ 설치 확인
node --version

# npm 설치 확인  
npm --version

# Sass 설치 (SCSS 컴파일용)
npm install -g sass
```

### 2. 개발 환경 설정
```bash
# 프로젝트 클론
git clone https://github.com/SeJonJ/ChatForYou.git
cd ChatForYou_v2/chatforyou-desktop

# 의존성 설치
npm install
```

### 3. 개발 모드 실행
```bash
# 로컬 환경으로 앱 실행
npm start

# 개발 모드 (DevTools 자동 열림)
npm run dev

# 실시간 개발 모드 (파일 변경 감지)
npm run dev:watch
```

## 🏗️ 빌드 및 배포

### 빌드 명령어
```bash
# 현재 플랫폼용 빌드
npm run build

# 특정 플랫폼 빌드
npm run build:mac     # macOS (.dmg)
npm run build:win     # Windows (.exe)
npm run build:linux   # Linux (.AppImage)

# 모든 플랫폼 빌드
npm run build:all
```

### 빌드 결과물
- **macOS**: `dist/ChatForYou-1.0.0-arm64.dmg`
- **Windows**: `dist/ChatForYou-Setup-1.0.0.exe`  

### 자동 배포 (GitHub Actions)
```bash
# 릴리스 태그 생성 및 푸시
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions가 자동으로:
# 1. 멀티플랫폼 빌드 실행
# 2. GitHub Releases 생성
# 3. 업데이트 메타데이터 생성
```

## 🔧 개발 가이드

### 파일 구조
```
src/
├── main/
│   ├── electron-main.js      # 메인 프로세스
│   └── preload.js            # 렌더러-메인 브리지
├── static/                   # 웹 앱 정적 파일 (자동 동기화)
├── templates/                # HTML 템플릿 (자동 동기화)
└── config/                   # 환경별 설정 (자동 동기화)
```

### 동기화 시스템
데스크톱 앱은 `nodejs-frontend`에서 자동으로 파일을 동기화합니다:

```bash
# 수동 동기화 실행
npm run sync              # 로컬 환경
npm run sync:prod         # 프로덕션 환경
npm run sync:watch        # 실시간 동기화
npm run sync:verbose      # 상세 로그
```

**동기화 과정:**
1. 파일 백업 생성
2. Static 파일 복사 (JS, CSS, 이미지)
3. Template 파일 복사 및 경로 변환
4. Config 파일 환경별 변환
5. SCSS → CSS 컴파일
6. 무결성 검증

### 환경 설정

#### 로컬 개발 환경
```javascript
// src/config/config.local.js (자동 생성됨)
window.__CONFIG__ = {
  API_BASE_URL: 'http://localhost:8080/chatforyou/api',
  PLATFORM: 'electron',
  DEV_MODE: true,
  AUTO_UPDATER: false
};
```

#### 프로덕션 환경
```javascript
// src/config/config.prod.js (자동 생성됨)
window.__CONFIG__ = {
  API_BASE_URL: 'https://hjproject.kro.kr/chatforyou/api',
  PLATFORM: 'electron', 
  DEV_MODE: false,
  AUTO_UPDATER: true
};
```

## 🔄 자동 업데이트 시스템

### 업데이트 설정
```yaml
# app-update.yml
provider: github
owner: sejon
repo: ChatForYou
updaterCacheDirName: chatforyou-updater
```

### 업데이트 API (Renderer Process)
```javascript
// 업데이트 확인
const result = await window.electronAPI.update.checkForUpdates();

// 업데이트 정보 조회
const info = await window.electronAPI.update.getInfo();

// 다운로드 시작
await window.electronAPI.update.startDownload();

// 업데이트 설치
await window.electronAPI.update.install();

// 이벤트 리스너
window.electronAPI.update.onProgress((event, data) => {
  console.log(`진행률: ${data.percent}%`);
});

window.electronAPI.update.onDownloaded((event, version) => {
  console.log(`다운로드 완료: ${version}`);
});
```

### 업데이트 테스트 도구
```bash
# 현재 버전 확인
npm run update:version

# 테스트용 빌드 생성 (버전 지정)
npm run update:build 1.0.1

# 강제 업데이트 체크
npm run update:check

# 버전 복원
npm run update:restore
```

## 🛡️ 보안

### Context Isolation
Electron의 보안 모범 사례를 준수합니다:
- **Node.js Integration**: 비활성화
- **Context Isolation**: 활성화
- **Preload Scripts**: 안전한 API 노출
- **CSP**: Content Security Policy 적용

## 📦 배포 패키지

### macOS (.dmg)
- **Apple Silicon**: M1/M2 Mac 전용 빌드
- **Intel**: x86_64 Mac 호환
- **설치**: 드래그 앤 드롭으로 Applications 폴더에 설치

#### ⚠️ macOS "손상된 파일" 에러 해결

macOS에서 "손상된 파일" 또는 "확인되지 않은 개발자" 에러가 발생할 경우:

**방법 1: 우클릭으로 열기 (가장 쉬움)**
1. ChatForYou 앱을 우클릭 → "열기" 선택
2. 경고 대화상자에서 "열기" 클릭
3. 한 번 허용하면 이후 정상 실행됩니다

**방법 2: 터미널 명령어 (권장)**
```bash
# 다운로드한 DMG 파일의 quarantine 속성 제거
xattr -r -d com.apple.quarantine ~/Downloads/ChatForYou-*.dmg

# 또는 설치된 앱의 quarantine 속성 제거  
xattr -r -d com.apple.quarantine /Applications/ChatForYou.app
```

**왜 이런 에러가 발생하나요?**
- macOS Gatekeeper는 Apple 개발자 인증서로 서명되지 않은 앱을 자동으로 차단합니다
- ChatForYou는 개인 프로젝트로 Apple Developer Program에 등록되지 않았습니다
- 이는 macOS만의 보안 정책으로, Windows에서는 발생하지 않는 문제입니다

### Windows (.exe)
- **NSIS 설치관리자**: GUI 기반 설치 과정
- **아키텍처**: x64, ia32 지원
- **바탕화면 바로가기**: 자동 생성
- **시작 메뉴**: 자동 등록

Windows Defender SmartScreen에서 경고가 나타날 수 있지만, "추가 정보" → "실행"을 클릭하여 진행할 수 있습니다.

## 🔍 문제 해결

### 일반적인 문제

#### 빌드 실패
```bash
# 의존성 재설치
npm run clean:all
npm install

# 동기화 문제 해결
npm run clean
npm run sync:verbose
```

#### 업데이트 실패
```bash
# 설정 검증
npm run validate

# 수동 업데이트 체크
npm run update:check
```

#### SCSS 컴파일 오류
```bash
# SCSS 수동 빌드
npm run scss:build

# 실시간 컴파일 (디버깅)
npm run scss:watch
```

### 로그 확인
```bash
# 애플리케이션 로그 (runtime)
# macOS: ~/Library/Logs/ChatForYou/main.log
# Windows: %USERPROFILE%\AppData\Roaming\ChatForYou\logs\main.log
# Linux: ~/.config/ChatForYou/logs/main.log

# 빌드 로그 (development)
tail -f scripts/.logs/main.log
```

## 🌐 지원 플랫폼

| 플랫폼 | 버전 | 아키텍처 | 상태 |
|--------|------|----------|------|
| **macOS** | 10.12+ | x64, arm64 | ✅ 지원 |
| **Windows** | 10, 11 | x64, ia32 | ✅ 지원 |

## 📚 추가 문서

- **[빌드 가이드](BUILD-README.md)**: 상세한 빌드 프로세스 설명
- **[웹 버전 README](../README.md)**: 전체 프로젝트 개요

## 🤝 기여하기

### 개발 환경 설정
1. Fork 및 Clone
2. 의존성 설치: `npm install`
3. 개발 모드 실행: `npm run dev`
4. 변경사항 테스트: `npm run build`

### Pull Request
1. 새 기능은 별도 브랜치에서 개발
2. 코드 스타일 준수
3. 테스트 코드 작성
4. 문서 업데이트

## 📞 지원 및 피드백

- **Issues**: [GitHub Issues](https://github.com/SeJonJ/ChatForYou/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SeJonJ/ChatForYou/discussions)
- **Email**: wkdtpwhs@gmail.com

## 📄 라이선스

Copyright 2024 SejonJang (wkdtpwhs@gmail.com)

이 프로젝트는 GNU Affero General Public License v3.0 하에 라이선스됩니다.
자세한 내용은 [LICENSE](https://www.gnu.org/licenses/agpl-3.0.html) 파일을 참조하세요.

## 👥 개발팀

| 역할 | 이름 | 담당 업무 |
|------|------|-----------|
| 🚀 **프로젝트 리더** | 장세존 | Electron 앱 개발, 자동 업데이트 시스템, DevOps |
| ⚙️ **백엔드 개발** | 김동현 | WebRTC 서버, API 개발 |
| 💻 **풀스택 개발** | 박태식 | 웹 프론트엔드, 게임 기능 |
| 🎨 **UI/UX 디자인** | 임가현 | 디자인 시스템, 웹 퍼블리싱 |



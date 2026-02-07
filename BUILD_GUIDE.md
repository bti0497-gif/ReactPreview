# 진단 협업 스튜디오 빌드 및 배포 가이드

## 1. 사전 준비 (필수)
패키징을 위해 필요한 라이브러리가 모두 설치되어야 합니다.
터미널에서 아래 명령어가 성공적으로 완료되었는지 확인하세요.

```powershell
npm install
```

## 2. 개발 모드 실행
앱을 패키징하기 전에 로컬에서 작동을 확인합니다.

```powershell
npm run electron:dev
```
- Vite 서버와 Electron 창이 동시에 실행됩니다.
- 기능이 정상 작동하는지 테스트하세요.

## 3. 프로덕션 빌드 (패키징)
Windows용 설치 파일(.exe)을 생성합니다.

```powershell
npm run electron:build
```
- **생성 위치**: `release/` 폴더
- **결과물**: `JindanStudio-Setup-0.9.0.exe`

## 4. 자동 업데이트 배포 (GitHub Releases)
새 버전을 배포하여 사용자들의 앱을 자동 업데이트하려면 GitHub 토큰 설정이 필요합니다.

1. **GitHub 토큰 발급**:
   - GitHub Settings -> Developer settings -> Personal access tokens
   - `repo` 권한 체크 후 토큰 생성

2. **환경 변수 설정**:
   - 프로젝트 루트에 `.env` 파일 (없으면 생성)
   - `GH_TOKEN=your_token_here` 추가

3. **배포 명령어 실행**:
```powershell
npm run publish
```
- 자동으로 빌드 후 GitHub Releases에 새 버전을 업로드합니다.
- 사용자들은 앱 재시작 시 자동으로 업데이트됩니다.

## 5. 버전 올리기
업데이트를 배포할 때는 반드시 `package.json`의 버전을 올려야 합니다.

```json
{
  "version": "0.9.1" 
}
```

## 6. 문제 해결
- **아이콘 오류**: `build/icon.ico` 파일이 올바른지 확인하세요. (현재는 SVG만 존재하므로 ICO 변환 필요)
- **서명 오류**: 코드 서명이 없으므로 Windows SmartScreen 경고가 뜰 수 있습니다. (무시하고 실행 가능)

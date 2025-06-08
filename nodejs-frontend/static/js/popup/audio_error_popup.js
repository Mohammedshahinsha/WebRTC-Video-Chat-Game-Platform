/*
 * Copyright 2023 SejonJang (wkdtpwhs@gmail.com)
 *
 * Licensed under the  GNU General Public License v3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.gnu.org/licenses/gpl-3.0.html
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// 오디오 권한 체크 함수
async function checkAudioPermission() {
    try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 테스트 후 즉시 스트림 해제
        audioStream.getTracks().forEach(track => track.stop());
        return { success: true, errorType: null };
    } catch (error) {
        console.error('오디오 권한 확인 실패:', error);
        
        // 에러 유형 분류
        let errorType = 'unknown';
        if (error.name === 'NotAllowedError') {
            errorType = 'permission_denied';
        } else if (error.name === 'NotFoundError') {
            errorType = 'no_device';
        } else if (error.name === 'NotReadableError') {
            errorType = 'device_busy';
        } else if (error.name === 'ConstraintNotSatisfiedError') {
            errorType = 'constraint_error';
        }
        
        return { success: false, errorType: errorType, error: error };
    }
}

// 에러 분류 헬퍼 함수
function classifyMediaError(error) {
    let errorType = 'unknown';
    if (error.name === 'NotAllowedError') {
        errorType = 'permission_denied';
    } else if (error.name === 'NotFoundError') {
        errorType = 'no_device';
    } else if (error.name === 'NotReadableError') {
        errorType = 'device_busy';
    } else if (error.name === 'ConstraintNotSatisfiedError') {
        errorType = 'constraint_error';
    }
    return errorType;
}

// 브라우저 감지 함수
function detectBrowser() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
}

// 오디오 에러 모달 표시 함수
async function showAudioErrorModal(errorType = 'unknown', error = null) {
    // PopupLoader를 사용해서 HTML 템플릿 로드
    await PopupLoader.loadPopup('audio_error');

    const browser = detectBrowser();
    
    // 에러 유형별 메시지 설정
    let title, message, icon, helpText, browserGuide;
    
    switch (errorType) {
        case 'permission_denied':
            title = '마이크 권한이 필요합니다';
            message = '음성 채팅을 위해 마이크 사용 권한을 허용해주세요.';
            icon = '🚫';
            helpText = '브라우저에서 마이크 권한을 차단하셨습니다.';
            browserGuide = getBrowserPermissionGuide(browser);
            break;
        case 'no_device':
            title = '마이크를 찾을 수 없습니다';
            message = '마이크가 연결되어 있지 않거나 인식되지 않습니다.';
            icon = '❌';
            helpText = '마이크가 제대로 연결되어 있는지 확인해주세요.';
            browserGuide = '1. 마이크가 컴퓨터에 제대로 연결되었는지 확인<br>2. 다른 프로그램에서 마이크를 사용 중인지 확인<br>3. 시스템 설정에서 마이크가 활성화되어 있는지 확인';
            break;
        case 'device_busy':
            title = '마이크가 사용 중입니다';
            message = '다른 애플리케이션에서 마이크를 사용하고 있습니다.';
            icon = '⚠️';
            helpText = '마이크를 사용 중인 다른 프로그램을 종료해주세요.';
            browserGuide = '1. 화상회의 프로그램(Zoom, Teams 등) 종료<br>2. 음성녹음 프로그램 종료<br>3. 브라우저의 다른 탭에서 마이크 사용 중단';
            break;
        default:
            title = '오디오 설정 문제';
            message = '오디오 장치에 문제가 발생했습니다.';
            icon = '❓';
            helpText = '마이크 설정을 확인하고 다시 시도해주세요.';
            browserGuide = getBrowserPermissionGuide(browser);
    }

    // HTML 템플릿의 요소들을 업데이트
    document.getElementById('audioErrorIcon').textContent = icon;
    document.getElementById('audioErrorTitle').textContent = title;
    document.getElementById('audioErrorHelpText').textContent = helpText;
    document.getElementById('audioErrorMessage').textContent = message;
    document.getElementById('audioErrorBrowserGuide').innerHTML = browserGuide;

    // 모달 표시
    $('#audioErrorModal').modal({
        backdrop: 'static',
        keyboard: false
    }).modal('show');

    // 버튼 이벤트 설정
    setupModalEvents();
}

// 브라우저별 권한 설정 가이드
function getBrowserPermissionGuide(browser) {
    switch (browser) {
        case 'chrome':
            return `
                <strong>Chrome에서 마이크 권한 허용하기:</strong><br>
                1. 주소창 왼쪽의 자물쇠 아이콘(🔒) 클릭<br>
                2. "마이크" 옆의 드롭다운에서 "허용" 선택<br>
                3. 페이지 새로고침<br>
                <br>
                <strong>또는:</strong><br>
                1. Chrome 설정(⚙️) → 개인정보 및 보안 → 사이트 설정<br>
                2. 마이크 → 차단된 사이트에서 이 사이트 제거
            `;
        case 'firefox':
            return `
                <strong>Firefox에서 마이크 권한 허용하기:</strong><br>
                1. 주소창 왼쪽의 방패 아이콘(🛡️) 클릭<br>
                2. "마이크 차단됨" 옆의 "X" 클릭하여 차단 해제<br>
                3. 페이지 새로고침<br>
                <br>
                <strong>또는:</strong><br>
                1. Firefox 설정 → 개인 정보 & 보안<br>
                2. 권한 → 마이크 → 설정에서 이 사이트 허용
            `;
        case 'safari':
            return `
                <strong>Safari에서 마이크 권한 허용하기:</strong><br>
                1. Safari 메뉴 → 환경설정<br>
                2. 웹사이트 탭 → 마이크<br>
                3. 이 웹사이트에 대해 "허용" 선택<br>
                4. 페이지 새로고침
            `;
        case 'edge':
            return `
                <strong>Edge에서 마이크 권한 허용하기:</strong><br>
                1. 주소창 왼쪽의 자물쇠 아이콘(🔒) 클릭<br>
                2. "마이크" 권한을 "허용"으로 변경<br>
                3. 페이지 새로고침<br>
                <br>
                <strong>또는:</strong><br>
                1. Edge 설정 → 사이트 권한 → 마이크<br>
                2. 차단된 사이트에서 이 사이트 제거
            `;
        default:
            return `
                <strong>일반적인 해결 방법:</strong><br>
                1. 브라우저 주소창 근처의 마이크 아이콘 확인<br>
                2. 마이크 권한을 "허용"으로 설정<br>
                3. 페이지 새로고침<br>
                4. 브라우저 설정에서 마이크 권한 확인
            `;
    }
}

// 모달 이벤트 설정
function setupModalEvents() {
    // 다시 시도 버튼
    $('#audioRetryButton').click(async function() {
        $('#audioErrorModal').modal('hide');
        
        // 잠시 대기 후 다시 권한 체크
        setTimeout(async () => {
            const result = await checkAudioPermission();
            if (result.success) {
                // 권한이 허용되었다면 페이지 새로고침
                location.reload();
            } else {
                // 여전히 문제가 있다면 다시 모달 표시
                showAudioErrorModal(result.errorType, result.error);
            }
        }, 500);
    });

    // 도움말 버튼
    $('#audioHelpButton').click(function() {
        const helpWindow = window.open('', '_blank', 'width=600,height=400');
        helpWindow.document.write(`
            <html>
                <head>
                    <title>마이크 권한 도움말</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2 { color: #333; }
                        .step { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h2>🎤 마이크 권한 설정 도움말</h2>
                    <div class="step">
                        <strong>1단계:</strong> 브라우저 주소창 근처의 마이크 아이콘을 찾아 클릭하세요.
                    </div>
                    <div class="step">
                        <strong>2단계:</strong> 마이크 권한을 "허용"으로 설정하세요.
                    </div>
                    <div class="step">
                        <strong>3단계:</strong> 페이지를 새로고침하세요.
                    </div>
                    <div class="step">
                        <strong>문제가 계속되면:</strong> 브라우저 설정에서 사이트별 권한을 확인하세요.
                    </div>
                </body>
            </html>
        `);
    });

    // 메인으로 돌아가기 버튼
    $('#audioErrorConfirmButton').click(function() {
        $('#audioErrorModal').modal('hide');
        // 메인 페이지로 이동
        window.location.href = window.__CONFIG__.BASE_URL + '/roomlist.html';
    });
} 
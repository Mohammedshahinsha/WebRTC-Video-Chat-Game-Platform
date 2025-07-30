const { app, BrowserWindow, Menu, ipcMain, globalShortcut, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// 개발 모드 감지
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

let mainWindow;
let updateInfo = null; // 업데이트 정보를 저장하는 변수

const log = {
    info: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [INFO] ${message}`);
    },
    warn: (message) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] ${message}`);
    },
    error: (message) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] ${message}`);
    },
    debug: (message) => {
        if (isDev) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [DEBUG] ${message}`);
        }
    }
};

// 자동 업데이트 설정 - 개선된 버전
function setupAutoUpdater() {
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false; // 수동으로 다운로드 확인하도록 변경
    
    autoUpdater.on('checking-for-update', () => {
        log.info('업데이트 확인 중...');
        if (mainWindow) mainWindow.webContents.send('update:checking');
    });

    autoUpdater.on('update-available', async (info) => {
        log.info(`업데이트 있음. 최신버전: ${info.version}`);
        updateInfo = info;
        if (mainWindow) mainWindow.webContents.send('update:available', info.version);
        
        // 사용자에게 다운로드 확인 다이얼로그 표시
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '업데이트 알림',
            message: '새로운 업데이트가 있습니다!',
            detail: `현재 버전: ${app.getVersion()}\n최신 버전: ${info.version}\n\n업데이트를 다운로드하시겠습니까?`,
            buttons: ['지금 다운로드', '나중에'],
            defaultId: 0,
            cancelId: 1
        });

        if (result.response === 0) {
            log.info('사용자가 업데이트 다운로드를 승인했습니다.');
            autoUpdater.downloadUpdate();
        } else {
            log.info('사용자가 업데이트를 나중으로 연기했습니다.');
        }
    });

    autoUpdater.on('update-not-available', async (info) => {
        log.info('현재 최신버전입니다.');
        if (mainWindow) mainWindow.webContents.send('update:not-available');
        
        // 수동 업데이트 확인 시에만 다이얼로그 표시
        if (updateInfo === 'manual-check') {
            await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '업데이트 확인',
                message: '현재 최신 버전을 사용 중입니다.',
                detail: `현재 버전: ${app.getVersion()}`,
                buttons: ['확인']
            });
            updateInfo = null;
        }
    });

    autoUpdater.on('error', async (err) => {
        log.error('업데이트 오류: ' + err);
        if (mainWindow) mainWindow.webContents.send('update:error', String(err));
        
        // 오류 다이얼로그 표시
        await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: '업데이트 오류',
            message: '업데이트 중 오류가 발생했습니다.',
            detail: String(err),
            buttons: ['확인']
        });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        log.info(`업데이트 다운로드 중... ${progressObj.percent.toFixed(1)}%`);
        if (mainWindow) {
            mainWindow.webContents.send('update:progress', {
                percent: progressObj.percent,
                bytesPerSecond: progressObj.bytesPerSecond,
                transferred: progressObj.transferred,
                total: progressObj.total
            });
        }
    });

    autoUpdater.on('update-downloaded', async (info) => {
        log.info('업데이트 다운로드 완료. 설치 확인 대기 중');
        if (mainWindow) mainWindow.webContents.send('update:downloaded', info.version);
        
        // 설치 확인 다이얼로그 표시
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '업데이트 설치',
            message: '업데이트 다운로드가 완료되었습니다!',
            detail: `버전 ${info.version} 업데이트가 준비되었습니다.\n지금 설치하고 앱을 재시작하시겠습니까?`,
            buttons: ['지금 설치', '나중에 설치'],
            defaultId: 0,
            cancelId: 1
        });

        if (result.response === 0) {
            log.info('사용자가 업데이트 설치를 승인했습니다. 재시작 중...');
            setTimeout(() => {
                autoUpdater.quitAndInstall();
            }, 1000);
        } else {
            log.info('사용자가 업데이트 설치를 나중으로 연기했습니다.');
        }
    });
}

function registerGlobalShortcuts() {
    if (!isDev) return;
    try {
        // F12: DevTools 토글
        globalShortcut.register('F12', () => {
            if (mainWindow) {
                if (mainWindow.webContents.isDevToolsOpened()) {
                    mainWindow.webContents.closeDevTools();
                    log.debug('개발자 도구 닫기 (F12)');
                } else {
                    mainWindow.webContents.openDevTools();
                    log.debug('개발자 도구 열기 (F12)');
                }
            }
        });
        const devToolsShortcut = process.platform === 'darwin' ? 'CommandOrControl+Option+I' : 'CommandOrControl+Shift+I';
        globalShortcut.register(devToolsShortcut, () => {
            if (mainWindow) {
                if (mainWindow.webContents.isDevToolsOpened()) {
                    mainWindow.webContents.closeDevTools();
                    log.debug('개발자 도구 닫기 (단축키)');
                } else {
                    mainWindow.webContents.openDevTools();
                    log.debug('개발자 도구 열기 (단축키)');
                }
            }
        });
        log.debug('전역 단축키 등록 완료');
    } catch (error) {
        log.error(`전역 단축키 등록 실패: ${error.message}`);
    }
}

function createMainWindow() {
    log.info('메인 윈도우 생성 중...');
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'ChatForYou',
        icon: path.join(__dirname, '../static/images/logo/chatforyou_logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        show: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    mainWindow.loadFile(path.join(__dirname, '../templates/roomlist.html'));
    log.info('로컬 파일 로드: roomlist.html');

    if (isDev) {
        mainWindow.webContents.openDevTools();
        log.debug('개발자 도구 자동 열기');
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        log.info('메인 윈도우 표시');
    });
    mainWindow.on('closed', () => {
        log.info('메인 윈도우 닫힘');
        mainWindow = null;
    });
    mainWindow.webContents.on('did-finish-load', () => {
        log.info('페이지 로드 완료');
    });
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        log.error(`페이지 로드 실패: ${errorCode} - ${errorDescription}`);
    });
    return mainWindow;
}

function createMenu() {
    const template = [
        {
            label: '파일',
            submenu: [
                {
                    label: '새 창',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        createMainWindow();
                        log.info('새 창 생성');
                    }
                },
                { type: 'separator' },
                {
                    label: '종료',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '편집',
            submenu: [
                { label: '실행 취소', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '다시 실행', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: '잘라내기', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '복사', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '붙여넣기', accelerator: 'CmdOrCtrl+V', role: 'paste' }
            ]
        },
        {
            label: '보기',
            submenu: [
                { label: '새로고침', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: '강제새로고침', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                ...(isDev ? [
                    { type: 'separator' },
                    {
                        label: '개발자 도구 열기',
                        accelerator: 'F12',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.openDevTools();
                                log.debug('개발자 도구 열기 (메뉴)');
                            }
                        }
                    },
                    {
                        label: '개발자 도구 닫기',
                        click: () => {
                            if (mainWindow) {
                                mainWindow.webContents.closeDevTools();
                                log.debug('개발자 도구 닫기 (메뉴)');
                            }
                        }
                    },
                    {
                        label: '개발자 도구 토글',
                        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                        click: () => {
                            if (mainWindow) {
                                if (mainWindow.webContents.isDevToolsOpened()) {
                                    mainWindow.webContents.closeDevTools();
                                    log.debug('개발자 도구 닫기 (토글)');
                                } else {
                                    mainWindow.webContents.openDevTools();
                                    log.debug('개발자 도구 열기 (토글)');
                                }
                            }
                        }
                    }
                ] : [
                    { label: '개발자도구', accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I', role: 'toggleDevTools' }
                ]),
                { type: 'separator' },
                { label: '실제 크기', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: '확대', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: '축소', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: '전체화면', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: '창',
            submenu: [
                { label: '최소화', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
                { label: '닫기', accelerator: 'CmdOrCtrl+W', role: 'close' }
            ]
        },
        {
            label: '도움말',
            submenu: [
                {
                    label: 'ChatForYou 개발 정보',
                    click: () => {
                        const infoMsg = 'Developed by ChatForYou Team';
                        const detail = 'Copyright 2025 ChatForYou Team && SeJonJ';
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '개발 정보',
                            message: infoMsg,
                            detail,
                            buttons: ['확인', 'GitHub 이동'],
                            defaultId: 0,
                            cancelId: 0
                        }).then(result => {
                            if (result.response === 1) {
                                shell.openExternal('https://github.com/SeJonJ/ChatForYou');
                            }
                        });
                    }
                },
                {
                    label: 'ChatForYou 버전정보',
                    click: async () => {
                        let appVersion = 'N/A';
                        let electronVersion = process.versions.electron || 'N/A';
                        try {
                            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
                            appVersion = pkg.version || 'N/A';
                        } catch (e) {}
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '버전 정보',
                            message: `ChatForYou 버전: v${appVersion}\nElectron 버전: v${electronVersion}`,
                            buttons: ['확인']
                        });
                    }
                },
                {
                    label: '이슈 등록',
                    click: () => {
                        shell.openExternal('https://github.com/SeJonJ/ChatForYou/issues');
                    }
                },
                { type: 'separator' },
                {
                    label: '업데이트 확인',
                    click: async () => {
                        if (!isDev) {
                            log.info('수동 업데이트 확인 요청');
                            updateInfo = 'manual-check'; // 수동 확인 표시
                            
                            // 업데이트 확인 중 다이얼로그 표시
                            const checkingDialog = dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: '업데이트 확인 중',
                                message: '업데이트를 확인하고 있습니다...',
                                buttons: [],
                                defaultId: -1
                            });
                            
                            try {
                                await autoUpdater.checkForUpdatesAndNotify();
                            } catch (error) {
                                log.error('업데이트 확인 중 오류:', error);
                                dialog.showMessageBox(mainWindow, {
                                    type: 'error',
                                    title: '업데이트 확인 오류',
                                    message: '업데이트 확인 중 오류가 발생했습니다.',
                                    detail: String(error),
                                    buttons: ['확인']
                                });
                            }
                        } else {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: '개발 모드',
                                message: '개발 모드에서는 업데이트를 확인할 수 없습니다.',
                                buttons: ['확인']
                            });
                        }
                    }
                }
            ]
        }
    ];

    if (isDev) {
        template.push({
            label: '개발',
            submenu: [
                {
                    label: '개발자 도구 열기',
                    accelerator: 'F12',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.openDevTools();
                            log.debug('개발자 도구 열기 (개발 메뉴)');
                        }
                    }
                },
                {
                    label: '개발자 도구 분리',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.openDevTools({ mode: 'detach' });
                            log.debug('개발자 도구 분리');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '콘솔 로그 레벨',
                    submenu: [
                        {
                            label: 'INFO',
                            type: 'radio',
                            checked: true,
                            click: () => {
                                log.info('로그 레벨: INFO');
                            }
                        },
                        {
                            label: 'DEBUG',
                            type: 'radio',
                            click: () => {
                                log.debug('로그 레벨: DEBUG');
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: '캐시 지우기',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.session.clearCache();
                            log.debug('캐시 지우기 완료');
                        }
                    }
                }
            ]
        });
    }
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { label: 'ChatForYou 정보', role: 'about' },
                { type: 'separator' },
                { label: '서비스', role: 'services', submenu: [] },
                { type: 'separator' },
                { label: 'ChatForYou 숨기기', accelerator: 'Command+H', role: 'hide' },
                { label: '다른 항목 숨기기', accelerator: 'Command+Shift+H', role: 'hideothers' },
                { label: '모두 표시', role: 'unhide' },
                { type: 'separator' },
                { label: 'ChatForYou 종료', accelerator: 'Command+Q', click: () => app.quit() }
            ]
        });
    }
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    log.debug('메뉴 생성 완료');
}

// IPC 핸들러 설정 - 개선된 버전
function setupIpcHandlers() {
    // 기존 핸들러들
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });
    
    ipcMain.handle('get-platform', () => {
        return process.platform;
    });
    
    ipcMain.handle('get-is-dev', () => {
        return isDev;
    });
    
    ipcMain.handle('minimize-window', () => {
        if (mainWindow) {
            mainWindow.minimize();
            log.debug('윈도우 최소화');
        }
    });
    
    ipcMain.handle('maximize-window', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
                log.debug('윈도우 최대화 해제');
            } else {
                mainWindow.maximize();
                log.debug('윈도우 최대화');
            }
        }
    });
    
    ipcMain.handle('close-window', () => {
        if (mainWindow) {
            mainWindow.close();
            log.debug('윈도우 닫기');
        }
    });

    // === 새로 추가된 업데이트 관련 IPC 핸들러들 ===
    
    // 수동 업데이트 확인 (개선된 버전)
    ipcMain.handle('manual-update-check', async () => {
        if (!isDev) {
            log.info('렌더러에서 수동 업데이트 확인 요청');
            updateInfo = 'manual-check';
            try {
                await autoUpdater.checkForUpdatesAndNotify();
                return { success: true };
            } catch (error) {
                log.error('수동 업데이트 확인 오류:', error);
                return { success: false, error: String(error) };
            }
        } else {
            return { success: false, error: '개발 모드에서는 업데이트를 확인할 수 없습니다.' };
        }
    });

    // 업데이트 정보 조회
    ipcMain.handle('get-update-info', () => {
        return {
            currentVersion: app.getVersion(),
            updateInfo: updateInfo,
            isDev: isDev
        };
    });

    // 업데이트 다운로드 시작
    ipcMain.handle('start-update-download', () => {
        if (updateInfo && typeof updateInfo === 'object') {
            log.info('렌더러에서 업데이트 다운로드 시작 요청');
            autoUpdater.downloadUpdate();
            return { success: true };
        } else {
            return { success: false, error: '사용 가능한 업데이트가 없습니다.' };
        }
    });

    // 업데이트 설치
    ipcMain.handle('install-update', () => {
        log.info('렌더러에서 업데이트 설치 요청');
        setTimeout(() => {
            autoUpdater.quitAndInstall();
        }, 1000);
        return { success: true };
    });

    // 업데이트 상태 조회
    ipcMain.handle('get-update-status', () => {
        return {
            hasUpdate: updateInfo && typeof updateInfo === 'object',
            isChecking: updateInfo === 'checking',
            isManualCheck: updateInfo === 'manual-check',
            updateVersion: updateInfo && typeof updateInfo === 'object' ? updateInfo.version : null
        };
    });

    log.debug('IPC 핸들러 설정 완료 (업데이트 관련 핸들러 포함)');
}

app.whenReady().then(() => {
    log.info(`ChatForYou Desktop 시작 (${isDev ? '개발' : '운영'} 모드)`);
    createMainWindow();
    createMenu();
    setupIpcHandlers();
    setupAutoUpdater();
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
    if (isDev) {
        registerGlobalShortcuts();
    }
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    log.info('ChatForYou Desktop 종료');
});

// 보안 관련 이벤트
app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('file://')) {
            log.debug(`로컬 파일 네비게이션 허용: ${url}`);
            return { action: 'allow' };
        }
        shell.openExternal(url);
        log.debug(`외부 링크를 기본 브라우저에서 열기: ${url}`);
        return { action: 'deny' };
    });
    contents.on('will-navigate', (event, url) => {
        if (url.startsWith('file://')) {
            // 로컬 파일 네비게이션 처리
            const urlPath = url.replace('file://', '');
            
            // HTML 파일로의 네비게이션인지 확인
            if (urlPath.includes('.html')) {
                event.preventDefault();
                
                // URL에서 쿼리 파라미터 추출
                const urlObj = new URL(url);
                const queryString = urlObj.search;
                
                // 파일명만 추출
                const fileName = path.basename(urlPath.split('?')[0]);
                
                // 올바른 경로로 로드
                const correctPath = path.join(__dirname, '../templates', fileName);
                const correctUrl = `file://${correctPath}${queryString}`;
                
                log.debug(`HTML 네비게이션 수정: ${url} -> ${correctUrl}`);
                contents.loadURL(correctUrl);
                return;
            }
            
            log.debug(`로컬 네비게이션 허용: ${url}`);
            return;
        }
        if (!url.startsWith('file://')) {
            event.preventDefault();
            shell.openExternal(url);
            log.warn(`외부 네비게이션 차단 후 브라우저에서 열기: ${url}`);
        }
    });
});

// 예외 처리
process.on('uncaughtException', (error) => {
    log.error(`처리되지 않은 예외: ${error.message}`);
    log.error(error.stack);
});
process.on('unhandledRejection', (reason, promise) => {
    log.error(`처리되지 않은 Promise 거부: ${reason}`);
});
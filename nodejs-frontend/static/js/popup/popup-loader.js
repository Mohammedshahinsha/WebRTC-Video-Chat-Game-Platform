/**
 * Popup Loader - 동적으로 popup HTML과 JavaScript를 로드하는 유틸리티
 */

const PopupLoader = {
    loadedPopups: new Set(),
    
    /**
     * popup HTML과 JavaScript를 동적으로 로드
     * @param {string} popupName - popup 이름 (예: 'room', 'room_settings', 'announcement')
     * @returns {Promise} 로드 완료 Promise
     */
    async loadPopup(popupName) {
        if (this.loadedPopups.has(popupName)) {
            return Promise.resolve();
        }
        
        try {
            // HTML 템플릿 로드
            const htmlResponse = await fetch(`templates/popup/${popupName}_popup.html`);
            if (!htmlResponse.ok) {
                throw new Error(`HTML 로드 실패: ${popupName}_popup.html`);
            }
            const htmlContent = await htmlResponse.text();
            
            // HTML을 body에 추가
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            document.body.appendChild(tempDiv);
            
            // JavaScript 파일 로드
            await this.loadScript(`js/popup/${popupName}_popup.js`);
            
            this.loadedPopups.add(popupName);
            console.log(`Popup loaded successfully: ${popupName}`);
            
        } catch (error) {
            console.error(`Popup 로드 실패: ${popupName}`, error);
            throw error;
        }
    },
    
    /**
     * JavaScript 파일을 동적으로 로드
     * @param {string} src - 스크립트 파일 경로
     * @returns {Promise} 로드 완료 Promise
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Script 로드 실패: ${src}`));
            document.head.appendChild(script);
        });
    },
    
    /**
     * 모든 필요한 popup들을 미리 로드
     */
    async preloadAllPopups() {
        const popups = ['room', 'room_settings', 'announcement'];
        const promises = popups.map(popup => this.loadPopup(popup));
        
        try {
            await Promise.all(promises);
            console.log('모든 popup이 성공적으로 로드되었습니다.');
        } catch (error) {
            console.error('일부 popup 로드에 실패했습니다:', error);
        }
    }
};

// 전역으로 노출
window.PopupLoader = PopupLoader;
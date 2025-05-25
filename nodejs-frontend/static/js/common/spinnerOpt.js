/**
 * spinner 사용 시 옵션 정의
 */

const spinnerOpt = {
    spinner : null,
    animationOptions : {
        'default' : 'spinner-line-fade-default',
        'quick' : 'spinner-line-fade-quick',
        'more' : 'spinner-line-fade-more',
        'shrink' : 'spinner-line-shrink'
    },
    init : function(){
        this.spinner = new Spinner().spin();
    },
    /**
     * 옵션을 사용한 spinner
     * @param {number} length : 길이
     * @param {number} width : 너비
     * @param {number} scale : 스케일 (크기 비율)
     * @param {String} animation : 애니메이션 종류
     * @param {string} color : 색상
     * @param {String} : 상단 위치 (% 단위)
     * @param {String} : 좌측 위치 (% 단위)
     */
    initByOption : function(length, width, scale, animation, color, top, left){
        this.spinner = new Spinner({
            lines: 12, // 선의 개수
            length: length, // 각 선의 길이
            width: width, // 선의 너비
            radius: 10, // 회전 반경
            scale: scale, // 스피너의 크기 비율
            corners: 1, // 선의 모서리 둥글기 (0에서 1 사이의 값)
            color: color, // 스피너 색상
            fadeColor: 'transparent', // 사라지는 색상 (페이드 효과에 사용)
            animation: !animation ? this.animationOptions['default'] : this.animationOptions[animation], // 애니메이션 종류. 제공되지 않으면 기본값 사용
            rotate: 0, // 회전 시작 각도
            direction: 1, // 회전 방향 (1은 시계 방향, -1은 반시계 방향)
            speed: 1, // 회전 속도
            zIndex: 2e9, // CSS z-index 값
            className: 'spinner', // 스피너에 추가할 CSS 클래스 이름
            top: top, // 스피너 위치의 상단 값 (% 또는 px 단위)
            left: left, // 스피너 위치의 좌측 값 (% 또는 px 단위)
            shadow: '0 0 1px transparent', // 스피너의 그림자 스타일
            position: 'absolute', // 스피너의 CSS 위치 속성 값
        }).spin();
    },
    /**
     * spinner 동작 시작
     * @param {element} element
     */
    start : function(element){
        element.append(this.spinner.el);
    },
    /**
     * spinner 동작 중지
     */
    stop : function(){
        this.spinner.stop();
    }
}
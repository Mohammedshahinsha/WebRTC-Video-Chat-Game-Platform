/*
* Catch Mind 게임을 구현하기 위한 js
* 1. 게임 준비(마스터) : 게임 시작 시 주제 선택 후 선택된 주제 전체 인원에게 전달
* 2. 게임 준비(참여자) : 게임 마스터가 아닌 경우 게임 준비 상태 필요
* 3. 게임 시작 : 마스터는 캔버스화면, 참여자도 캔버스화면
* 4. 캔버스 초기화 : 캔버스 초기화 및 30 초 추가, 전체에게 해당 이벤트 전달
* 5. 정답 이벤트 : 정답 맞췄을 때 캔버스 초기화 및 다른 사람에게 참여자 이벤트
* 6. 게임 종료 이벤트 : 총 5번의 게임 후 전체 게임 종료
* */

const catchMind = {
    isInit: false,
    canvas: null,
    ctx: null,
    subject: '', // 선택된 주제
    isGameLeader: false, // 게임 진행자 여부
    isGameParticipant: false, // 게임 참여자 여부
    isGameStart: false, // 게임 시작 여부
    isGameReady: false, // 게임 준비 여부
    gameReadyUser: 0, // 게임준비를 누른 유저 수
    gameParticipants: 1, // 게임 참여자 수 : 기본 1명
    drawing: false, // 그리기 상태를 추적하는 변수
    mouseInit: false,
    lastX: 0,
    lastY: 0,
    saveX : 0,
    saveY : 0,
    timeLeft: 60, // 그림 시간 제한
    recognition : null, // 음성 인식 객체
    synth : null,
    init: function () {
        this.canvas = document.getElementById('mycanvas');
        this.ctx = this.canvas.getContext('2d');
        if (!this.isInit) {
            this.initCanvasEvent();
            this.initClickEvent();

            // SpeechRecognition 인터페이스 확인
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition()
            this.synth = window.speechSynthesis;

            this.isInit = true;
        }
    },
    initCanvasEvent: function () {
        let self = this;
        // 마우스 움직일 때
        self.canvas.addEventListener('mousemove', function (e) {
            if (self.drawing && self.isGameStart) {
                self.ctx.beginPath();
                self.ctx.moveTo(self.lastX, self.lastY);
                self.setMousePosition(e);
                self.ctx.lineTo(self.lastX, self.lastY);
                self.ctx.stroke();

                // console.log("x pos : ", lastX + " ::::: " + "y pos : ", lastY);

                const pos = {
                    "gameEvent": "mouseEvent",
                    "mouseX": self.lastX,
                    "mouseY": self.lastY
                }

                dataChannel.sendMessage(pos, 'gameEvent');
            }
        });

        // 마우스 누를 때
        self.canvas.addEventListener('mousedown', function (e) {
            self.setMousePosition(e);
            self.drawing = true;
            const pos = {
                "gameEvent": "mouseEvent",
                "mouseInit": true
            }

            dataChannel.sendMessage(pos, 'gameEvent');
        });

        // 마우스 뗄 때와 캔버스 밖으로 나갈 때
        self.canvas.addEventListener('mouseup', function () {
            self.drawing = false;
        });
        self.canvas.addEventListener('mouseout', function () {
            self.drawing = false;
        });

    },
    initClickEvent: function () {
        let self = this;

        // game start btn
        $('#readyBtn').on('click', function () {

            if (!self.isGameParticipant && !self.isGameReady && !self.isGameStart) {
                self.isGameLeader = true;
                self.isGameReady = true;
            }

            if (self.isGameLeader) {
                // self.addGameParticipant();
                // dataChannel.sendMessage("addParticipant", "gameEvent");
                const newGame = {
                    "gameEvent": "newGame",
                    "newSubject": self.subject
                }
                dataChannel.sendMessage(newGame, 'gameEvent');
                self.addGameReady();
                dataChannel.sendMessage("addReadyUser", 'gameEvent');
                self.sendGameRequest();
                self.gameReadyToast('leader');

                $('#readyBtn').hide();
                $('#exitBtn').hide();
                $('#startBtn').removeAttr('hidden');

            } else if (self.isGameParticipant) {
                self.addGameReady();
                dataChannel.sendMessage("addReadyUser", 'gameEvent');

                // 'GAME READY' 버튼 숨기기
                $("#readyBtn").hide();
                // 로딩 인디케이터 표시
                $("#loadingIndicator").show();
            }

        });

        $(".topic-btn").click(function () {
            var topic = $(this).text();
            self.subject = topic;
            $('#selectedTopic').html('선택된 주제는 <b>' + topic + '</b>입니다.');
            $('#readyBtn').prop('disabled', false);
        });

        // '예' 버튼 클릭 이벤트 핸들러
        $('#acceptGameRequest').click(function () {
            // 게임 참여 수락 처리 로직
            self.isGameParticipant = true;
            // self.addGameParticipant();
            // dataChannel.sendMessage("addParticipant", "gameEvent");

            $('#gameSubject-tab').hide(); // 주제 선택 탭 숨김
            $('#gameTiptab').tab('show'); // 게임 방법 & 팁 탭을 활성화

            // 게임 방법 & 팁 탭을 기본적으로 표시
            $('#gameSubject').removeClass('show active');
            $('#gameTip').addClass('show active'); // 주제 선택 탭 내용 숨김

            $('#gameRequestModal').modal('hide');
            $('#subjectModal').modal('show');

            $('#readyBtn').prop('disabled', false);
            $('#exitBtn').hide();

        });

        $('#rejectGameRequest').on('click', function () {
            dataChannel.sendMessage("rejectGame", 'gameEvent');
        });

        // game start btn
        $('#startBtn').on('click', function () {
            $('#subjectModal').modal('hide');
            $('#catchMindCanvas').modal('show');

            // self.timeLeft = 60; // N초로 설정
            self.isGameStart = true;
            self.isGameLeader = true;

            // 게임 시작 이벤트 send
            dataChannel.sendMessage('gameStart', 'gameEvent')

            $('#answerBtn').attr('disabled', true);

            // 타이머 표시 업데이트
            var timerId = setInterval(function () {
                var $timer = $('#timer');

                if (self.timeLeft <= 0) {
                    clearInterval(timerId);
                    self.gameStart = false;
                    $timer.text('00:00');
                    return;
                }

                var minutes = Math.floor(self.timeLeft / 60);
                var seconds = self.timeLeft % 60;

                // 분과 초가 10보다 작으면 앞에 0을 붙여서 표시
                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;

                $timer.text(minutes + ":" + seconds);
                self.timeLeft--;
            }, 1000);
        });

        $('#answerBtn').on('click', function(){
            // 영어 이외의 언어를 사용할 경우 언어 코드 설정
            // 예를 들어, 한국어를 사용할 경우 'ko-KR'
            self.recognition.lang = 'ko-KR';

            // 결과를 실시간으로 반환하도록 설정
            self.recognition.interimResults = false;

            console.log("음성 인식 시작");

            // 음성 인식 시작
            self.recognition.start();

            // 결과 처리를 위한 이벤트 리스너
            self.recognition.addEventListener('result', e => {
                // SpeechRecognitionResultList 객체에서 결과 추출
                const transcript = Array.from(e.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');

                // 결과 출력 (예: 페이지에 표시)
                console.log(transcript);
                self.recognition.stop();
                console.log("음성 인식 종료");
                // TTStest();

                debugger
                self.checkAnswer(transcript);
            });
        });
    },
    setMousePosition: function (e) {
        var rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    },
    gameReadyToast: function (type) {
        let text = "게임에 참여하셨습니다. 게임 규칙을 숙지한 후 ready 를 클릭해주세요.";

        if (type === 'leader') {
            text = "게임에 참여하셨습니다. 모든 유저가 준비를 마치면 start 버튼을 눌러주세요.";
        }

        Toastify({
            text: text,
            duration: 3000,
            // destination: "https://github.com/apvarun/toastify-js",
            newWindow: true,
            close: true,
            gravity: "bottom", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
        }).showToast();
    },
    sendGameRequest: function () {
        // TODO 게임 참여 요청 이벤트 보내기
        dataChannel.sendMessage('gameRequest', 'gameEvent');
    },
    // addGameParticipant: function () {
    //     this.gameParticipants += 1;
    // },
    addGameReady: function () {
        this.gameReadyUser += 1;
        if (!this.isGameLeader) { //
            $('#loadingUser').text(this.gameReadyUser + "/" + this.gameParticipants);
        } else {
            if (this.isAllUserReady()) {
                $('#readyUser').text("모든 유저가 준비를 완료했습니다. 게임을 시작해주세요!");
                $('#startBtn').attr('disabled', false);
            } else {
                $('#readyUser').text(this.gameReadyUser + "/" + this.gameParticipants);
            }

        }
    },
    rejectGame: function () {
        this.gameParticipants -= 1;
        $('#loadingUser').text(this.gameReadyUser + "/" + this.gameParticipants)
    },
    isAllUserReady: function () {
        return this.gameReadyUser === this.gameParticipants;
    },
    participantGameStartEvent: function () {
        $('#subjectModal').modal('hide');
        $('#catchMindCanvas').modal('show');

        $('#clearCanvasBtn').hide();
    },
    canvasDrawingEvent : function(event){

        let mouseX = event.mouseX;
        let mouseY = event.mouseY;

        if (event.mouseInit) {
            this.saveX = 0;
            this.saveY = 0;
            return;
        }

        if (this.saveX === 0 && this.saveY === 0) {
            this.saveX = mouseX;
            this.saveY = mouseY;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.saveX, this.saveY); // 시작점 설정

        this.lastX = mouseX;
        this.lastY = mouseY;
        // console.log("x pos : ", this.lastX + " ::::: "+"y pos : ", this.lastY);

        this.ctx.lineTo(this.lastX, this.lastY); // 끝점 설정 (여기서는 시작점에서 조금 떨어진 위치로 설정)
        this.ctx.stroke(); // 선 그리기

        this.saveX = this.lastX;
        this.saveY = this.lastY;
    },
    checkAnswer : function(answer){
        if(answer === this.subject){
            let gameWiner = {
                "gameEvent" : "newWiner",
                "winer" : name
            }

            dataChannel.sendMessage(gameWiner, 'gameEvent');

            $('#answerBtn').attr('disabled', true);
            this.speakWiner(name)
        }
    },
    speakWiner : function(winerName){

        if (winerName !== '') {
            speakText = winerName + "님이 정답을 맞췄습니다"
            // SpeechSynthesisUtterance 객체 생성
            var utterThis = new SpeechSynthesisUtterance(speakText);

            // 음성이 끝났을 때 실행할 콜백 함수
            utterThis.onend = function(event) {
                console.log('음성 합성이 끝났습니다.');
            };

            // 오류가 발생했을 때 실행할 콜백 함수
            utterThis.onerror = function(event) {
                console.error('음성 합성 중 오류가 발생했습니다.');
            };

            // 사용할 수 있는 음성 중 하나를 선택 (예: 첫 번째 음성)
            var voices = this.synth.getVoices();
            utterThis.voice = voices[0];

            // 음성 속도와 피치 설정 (선택 사항)
            utterThis.pitch = 1; // 기본값은 1
            utterThis.rate = 1; // 기본값은 1

            // 음성 합성 시작
            this.synth.speak(utterThis);
        }
    }

}
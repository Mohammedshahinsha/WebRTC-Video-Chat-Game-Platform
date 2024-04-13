/*
* Catch Mind 게임을 구현하기 위한 js
* 1. 게임 준비(마스터) : 게임 시작 시 주제 선택 후 선택된 주제 전체 인원에게 전달
* 2. 게임 준비(참여자) : 게임 마스터가 아닌 경우 게임 준비 상태 필요
* 3. 게임 시작 : 마스터는 캔버스화면, 참여자도 캔버스화면
* 4. 캔버스 초기화 : 캔버스 초기화 및 30 초 추가, 전체에게 해당 이벤트 전달
* 5. 정답 이벤트 : 정답 맞췄을 때 캔버스 초기화 및 다른 사람에게 참여자 이벤트
* 6. 게임 종료 이벤트 : 총 N번의 게임 후 전체 게임 종료
* */

const catchMind = {
    isInit: false,
    canvas: null,
    ctx: null,
    subject: '', // 선택된 주제
    nickName: '', // 게임 닉네임
    isGameLeader: false, // 게임 진행자 여부
    isGameParticipant: false, // 게임 참여자 여부
    isGameStart: false, // 게임 시작 여부
    isGameReady: false, // 게임 준비 여부
    gameReadyUser: 0, // 게임준비를 누른 유저 수
    gameUserCount: 1, // 게임 참여자 수
    gameUserList: [], // 게임 유저 정보(리스트)
    totalGameRound: 1, // 게임 라운드 min 1, max 5 로 고정
    gameRound: 1,
    timerBar: null,
    timerId : null,
    drawing: false, // 그리기 상태를 추적하는 변수
    mouseInit: false,
    lastX: 0,
    lastY: 0,
    saveX: 0,
    saveY: 0,
    totalTime: 60, // 라운드 그림 시간 제한
    isTimeRemain : false, // 라운드 남은 시간
    maxClearCount: 3, // 캔버스 클리어 최대 횟수
    recognition: null, // 음성 인식 객체
    synth: null,
    init: function () {
        let self = this;
        this.canvas = document.getElementById('mycanvas');
        this.ctx = this.canvas.getContext('2d');
        if (!this.isInit) {
            this.initCanvasEvent();
            this.initClickEvent();

            // SpeechRecognition 인터페이스 확인
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.synth = window.speechSynthesis;

            // 게임 관련 변수 초기화
            this.gameReadyUser = 0 // 게임준비를 누른 유저 수
            this.gameUserList = [] // 게임 유저 정보(리스트)

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
            if (self.isTimeRemain) { // 게임 시간이 남아있다면
                self.drawing = true;
                self.setMousePosition(e);
                const pos = {
                    "gameEvent": "mouseEvent",
                    "mouseInit": true
                }

                dataChannel.sendMessage(pos, 'gameEvent');
            }
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

        $('#clearCanvasBtn').on('click', function () {
            if (self.maxClearCount <= 0) {
                self.showToast("더 이상 캔버스 초기화가 불가능해요!!");
            }

            self.clearCanvas();
            if (self.isGameLeader) { // 게임 리더면 maxclearCanvas -=1
                if (self.maxClearCount -= 1 > 0) {
                    $('#maxClearCount').text("캔버스 초기화 기회 : " + self.maxClearCount);
                } else {
                    $('#clearCanvasBtn').prop('disabled', true);
                    $('#maxClearCount').text("이제 캔버스 초기화는 할 수 없어요!!");
                }
            }

            const clearCanvasEvent = {
                "gameEvent": "clearCanvas"
            };
            dataChannel.sendMessage(clearCanvasEvent, 'gameEvent');
        });

        $('#subjectModal').on('show.bs.modal', function () {
            let $body =  $('body');
            spinnerOpt.initByOption(20, 15, 4.0, 'shrink', '#ffffff', '50%' ,'50%');
            spinnerOpt.start($body);

            let $titleButtonContainer = $('#titleButtonContainer');
            let $subjectButtonContainer = $('#subjectButtonContainer');

            $titleButtonContainer.empty(); // 버튼 넣기 전 한번 비우기
            $subjectButtonContainer.empty();
            $titleButtonContainer.removeClass('d-none');

            let url = "/catchmind/titles";

            let successCallback = function (data) {
                let titles = data.titles;
                // 배열 순회
                $.each(titles, function (index, title) {
                    // 버튼 생성
                    let button = $('<button>', {
                        class: 'btn btn-outline-primary title-btn',
                        text: title, // 버튼 내용으로 title 사용
                        'data-title': title, // data-title 속성 설정
                        value: title // value 속성 설정
                    });

                    // 스피너 중지
                    spinnerOpt.stop();

                    // 생성된 버튼을 컨테이너에 추가
                    $titleButtonContainer.append(button);
                });
            };

            let errorCallback = function (data) {
                console.error("error :: ", data);
                spinnerOpt.stop();
            };

            ajax(url, "GET", true, '', successCallback, errorCallback);

        });

        $('#titleButtonContainer').on('click', '.title-btn', function () {

            let $subjectButtonContainer = $('#subjectButtonContainer');
            let $titleButtonContainer = $('#titleButtonContainer');
            $titleButtonContainer.addClass('d-none');
            $subjectButtonContainer.removeClass('d-none');

            spinnerOpt.init();
            spinnerOpt.start($subjectButtonContainer);

            let topic = $(this).attr('data-title');

            let url = "/catchmind/subjects";
            const data = {
                "title": topic
            }

            let successCallback = function (data) {
                $subjectButtonContainer.empty();
                let subjects = data.subjects;
                // 배열 순회
                $.each(subjects, function (index, subject) {
                    // 버튼 생성
                    let button = $('<button>', {
                        class: 'btn btn-outline-primary subject-btn',
                        text: subject, // 버튼 내용으로 title 사용
                        'data-subject': subject, // data-title 속성 설정
                        value: subject // value 속성 설정
                    });

                    // 스피너 중지
                    spinnerOpt.stop();

                    // 생성된 버튼을 컨테이너에 추가
                    $subjectButtonContainer.append(button);
                });
            };

            let errorCallback = function () {
                // 스피너 중지
                spinnerOpt.stop();
            };

            ajaxToJson(url, 'POST', true, data, successCallback, errorCallback);

            $('#readyBtn').prop('disabled', false);
        });

        $('#subjectButtonContainer').on('click', '.subject-btn', function () {
            console.log('data ::: ', $(this).attr('data-subject'));

            $('.subject-btn').removeClass('active');
            $(this).addClass('active');
            self.subject = $(this).attr('data-subject');
        });

        // game start btn
        $('#readyBtn').on('click', function () {
            self.setGameUser(); // 게임 참여 가능 인원 세팅
            if (!self.isGameParticipant && !self.isGameReady && !self.isGameStart) {
                self.isGameLeader = true;
                self.isGameReady = true;
            }

            if (self.isGameLeader) {

                let $nickName = $('#nickName_ld').val();
                if (!$nickName) {
                    alert("게임 닉네임은 필수값입니다!");
                    return;
                }

                self.nickName = $nickName;
                // self.addGameParticipant();
                // dataChannel.sendMessage("addParticipant", "gameEvent");
                const newGame = {
                    "gameEvent": "newGame",
                    "newSubject": self.subject
                }
                dataChannel.sendMessage(newGame, 'gameEvent');

                self.addGameReady('self');

                const addReadyUser = {
                    "gameEvent": "addReadyUser",
                    "gameUser": userId,
                    "nickName": self.nickName
                }
                dataChannel.sendMessage(addReadyUser, 'gameEvent');
                self.sendGameRequest();
                self.gameReadyToast('leader');

                $('#readyBtn').hide();
                $('#exitBtn').hide();
                $('#startBtn').removeAttr('hidden');

            } else if (self.isGameParticipant) {
                self.addGameReady('self');
                const addReadyUser = {
                    "gameEvent": "addReadyUser",
                    "gameUser": userId,
                    "nickName": self.nickName
                }
                dataChannel.sendMessage(addReadyUser, 'gameEvent');

                // 'GAME READY' 버튼 숨기기
                $("#readyBtn").hide();
                // 로딩 인디케이터 표시
                $("#loadingIndicator").show();
            }

        });

        // '예' 버튼 클릭 이벤트 핸들러
        $('#acceptGameRequest').click(function () {

            let $nickName = $('#nickName_pt').val();
            if (!$nickName) {
                alert("게임 닉네임은 필수값입니다!");
                return;
            }
            self.nickName = $nickName;
            // 게임 참여 수락 처리 로직
            self.isGameParticipant = true;
            // 게임 참여 가능한 총 인원 세팅(현재 방 인원과 동일)
            self.setGameUser();
            // dataChannel.sendMessage("addParticipant", "gameEvent");

            // 게임 방법 & 팁 탭을 기본적으로 표시
            $('#gameSubject').removeClass('show active'); // 주제 선택 탭 내용 숨김
            $('#gameTip').addClass('show active');

            $('#gameSubject-tab').hide(); // 주제 선택 탭 숨김
            $('#gameTip-tab').tab('show'); // 게임 방법 & 팁 탭을 활성화

            $('#gameRequestModal').modal('hide');
            $('#subjectModal').modal('show');

            $('#readyBtn').prop('disabled', false);
            $('#exitBtn').hide();

        });

        $('#rejectGameRequest').on('click', function () {
            const rejectGame = {
                "gameEvent": "rejectGame"
            }
            dataChannel.sendMessage(rejectGame, 'gameEvent');
        });

        // game start btn
        $('#startBtn').on('click', function () {
            $('#subjectModal').modal('hide');
            $('#answerBtn').attr('disabled', true);

            if (self.gameRound === 1) { // 1라운드 일때만 서버로 게임 정보 전달
                let url = '/catchmind/participants';
                let data = {
                    "roomId": roomId,
                    "gameUserList": self.gameUserList
                };

                let successCallback = function (data) {

                };

                let errorCallback = function (error) {
                    // TODO 실패한 경우 모든 이벤트 초기화 필요
                };

                ajaxToJson(url, 'POST', '', data);

            }

            // self.timeLeft = 60; // N초로 설정
            self.isGameStart = true;
            self.isGameLeader = true;
            self.isTimeRemain = true;

            // 게임 진행자만 캔버스 초기화 기회
            // 캔버스 초기화
            $('#maxClearCount').text("캔버스 초기화 기회 : " + self.maxClearCount);
            self.showRoundSubject();

            if (self.gameRound > 1) {
                // 새로운 라운드에 맞는 새로운 주제 선택 이벤트
                const newRoundSubject = {
                    'gameEvent': 'newRoundSubject',
                    'subject': self.subject
                }
                dataChannel.sendMessage(newRoundSubject, 'gameEvent');
            }

            dataChannel.sendMessage('gameStart', 'gameEvent');

            $('#catchMindCanvas').modal('show');
            $('#clearCanvasBtn').show();

            self.startTimer();

        });

        $('#answerBtn').on('click', function () {
            $('#answerBtn').attr('disabled', true);
            let text = "이제 정답을 외쳐주세요!";
            self.showToast(text);
            // 영어 이외의 언어를 사용할 경우 언어 코드 설정
            // 예를 들어, 한국어를 사용할 경우 'ko-KR'
            self.recognition.lang = 'ko-KR';

            // 결과를 실시간으로 반환하도록 설정
            self.recognition.interimResults = false;

            console.log("음성 인식 시작");

            // // 음성 인식 시작
            self.recognition.start();

            // 이벤트 리스너 설정
            self.recognition.onresult = function (event) {
                // 결과 처리
                let transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                // 띄어쓰기 제거
                transcript = transcript.replace(' ', '');
                console.log(transcript);

                // 결과 처리 후 음성 인식 종료
                self.recognition.stop();

                self.checkAnswer(transcript);
            };

            // 결과 처리를 위한 이벤트 리스너
            // self.recognition.addEventListener('result', e => {
            //     // SpeechRecognitionResultList 객체에서 결과 추출
            //     const transcript = Array.from(e.results)
            //         .map(result => result[0])
            //         .map(result => result.transcript)
            //         .join('');
            //
            //     // 결과 출력 (예: 페이지에 표시)
            //     console.log(transcript);
            //     self.recognition.stop();
            //     console.log("음성 인식 종료");
            //     // TTStest();
            //
            //     self.checkAnswer(transcript);
            // });
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

        this.showToast(text);
    },
    sendGameRequest: function () {
        const gameRequest = {
            "gameEvent": "gameRequest"
        }
        dataChannel.sendMessage(gameRequest, 'gameEvent');
    },
    addGameReady: function (type, userName, nickName) {
        this.gameReadyUser += 1;
        if (type === 'self') {
            let gameUser = {
                "roomId": roomId,
                "userId": userId,
                "nickName": this.nickName
            }
            this.gameUserList.push(gameUser);
        } else {
            let gameUser = {
                "roomId": roomId,
                "userId": userName,
                "nickName": nickName
            }
            this.gameUserList.push(gameUser);
        }

        if (!this.isGameLeader) {
            $('#loadingUser').text('다른 참여자를 기다리는 중입니다. : ' + this.gameReadyUser + "/" + this.gameUserCount);
        } else {
            if (this.isAllUserReady()) {
                $('#readyUser').text("모든 유저가 준비를 완료했습니다. 게임을 시작해주세요!");
                $('#startBtn').attr('disabled', false);
            } else {
                $('#readyUser').text(this.gameReadyUser + "/" + this.gameUserCount);
            }
        }
    },
    rejectGame: function () {
        this.gameUserCount -= 1;
        if (this.isGameLeader) {
            $('#readyUser').text(this.gameReadyUser + "/" + this.gameUserCount);
        } else {
            $('#loadingUser').text(this.gameReadyUser + "/" + this.gameUserCount);
        }
    },
    isAllUserReady: function () {
        return this.gameReadyUser === this.gameUserCount;
    },
    participantGameStartEvent: function () { // 참여자의 게임 시작 이벤트
        $('#subjectModal').modal('hide');
        $('#catchMindCanvas').modal('show');

        this.showRoundSubject();

        $('#clearCanvasBtn').hide();
        $('#answerBtn').attr('disabled', false);
    },
    canvasDrawingEvent: function (event) {

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
    checkAnswer: function (answer) {
        let self = this;
        if (answer !== this.subject) {
            $('#answerBtn').attr('disabled', false);
            let text = "아쉽지만 " + answer + " 는(은) 정답이 아니에요";
            this.showToast(text);
            return;
        }

        const gameData = {
            gameStatus: "WINNER",
            "roomId": roomId,
            "userId": userId
        };

        let successCallback = function (data) {
            let gameWiner = {
                "gameEvent": "newWiner",
                "winer": data.nickName
            }

            dataChannel.sendMessage(gameWiner, 'gameEvent');

            $('#answerBtn').attr('disabled', true);
            self.speakWiner(data.nickName);
            self.resetGameRound(data.nickName);
        };

        let errorCallback = function (data) {

        };

        ajaxToJson('/catchmind/updateGameStatus', 'POST', '', gameData, successCallback, errorCallback);
    },
    speakWiner: function (winerName) {

        if (winerName !== '') {
            var speakText = winerName + "님이 정답을 맞췄습니다";

            this.showToast(speakText);

            // SpeechSynthesisUtterance 객체 생성
            var utterThis = new SpeechSynthesisUtterance(speakText);

            // 음성이 끝났을 때 실행할 콜백 함수
            utterThis.onend = function (event) {
                console.log('음성 합성이 끝났습니다.');
            };

            // 오류가 발생했을 때 실행할 콜백 함수
            utterThis.onerror = function (event) {
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
    },
    showRoundSubject : function(resetFlag){
        if(resetFlag){
            $('#roundSubject').text('');
        } else {
            let text = '주제 : '+this.subject;
            $('#roundSubject').text(text);
        }
    },
    // leftGameParticipants: function () {
    //     this.gameUserCount -= 1;
    // },
    // addGameParticipants : function(){
    //     this.gameUserCount +=1;
    // },
    setGameUser : function(){
        this.gameUserCount = Object.keys(participants).length;
    },
    clearCanvas: function () {
        if (this.isGameParticipant && (this.maxClearCount -= 1 > 0)) {
            $('#maxClearCount').text("진행자의 캔버스 초기화 기회 : " + this.maxClearCount);
            this.showToast("진행자가 캔버스를 초기화 했습니다!")
        }

        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    showToast: function (text) {
        Toastify({
            text: text,
            duration: 3000,
            // destination: "",
            newWindow: true,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
        }).showToast();
    },
    resetGameRound: function (winner) {
        let self = this;

        // 게임 상태 초기화
        self.isGameStart = false;
        self.isGameReady = false;
        self.drawing = false;
        self.isTimeRemain = false;
        // self.gameReadyUser = 0; // 게임 준비 상태인 유저 수 초기화
        self.showRoundSubject(true);

        // 캔버스 초기화
        self.clearCanvas();

        $('#catchMindCanvas').modal('hide');

        // 최대 캔버스 클리어 횟수 재설정
        self.maxClearCount = 3;
        // TODO 타이머 이벤트 초기화

        $('#progress-container').empty();
        self.resetTimer();

        if (winner === self.nickName) {
            self.isGameLeader = true;
            self.isGameParticipant = false;

            $('#gameSubject').addClass('show active');  // 주제 선택 탭 내용 숨김
            $('#gameTip').removeClass('show active')

            $('#gameSubject-tab').show();
            $('#gameSubject-tab').tab('show');

            $('#nickName_ld').val(self.nickName);
            $('#nickName_ld').attr('disabled', true);

            $('#startBtn').removeAttr('hidden');
            $('#startBtn').attr('disabled', false);

            $("#loadingIndicator").hide();
            $('#startBtn').show();

        } else {
            self.isGameLeader = false;
            self.isGameParticipant = true;

            $('#gameSubject-tab').hide(); // 주제 선택 탭 숨김
            $('#gameTip-tab').tab('show'); // 게임 방법 & 팁 탭을 활성화

            // 게임 방법 & 팁 탭을 기본적으로 표시
            $('#gameSubject').removeClass('show active');  // 주제 선택 탭 내용 숨김
            $('#gameTip').addClass('show active');

            $('#startBtn').hide();
            $('#readyUser').hide();

            $("#loadingIndicator").show();
            $('#loadingUser').removeAttr('hidden');
            $('#loadingUser').text('승리자의 주제 선택을 기다리는 중...!! : ' + this.gameReadyUser + "/" + this.gameUserCount);
        }

        $('#subjectModal').modal('show');
        self.gameRound += 1; // 게임 라운드 추가
    },
    newRoundSubject: function (subject) {
        // 모든 띄어쓰기 제거
        this.subject = subject.replace(' ', '');
    },
    /**
     * 타이머 시작
     */
    startTimer: function () {
        let self = this;
        let totalTime = self.totalTime;
        let timeLeft = self.totalTime;
        // ProgressBar.js를 사용한 타이머 표시 업데이트
        self.timerBar = new ProgressBar.Line('#progress-container', {
            strokeWidth: 2,
            color: '#FFEA82',
            trailColor: '#eee',
            trailWidth: 1,
            easing: 'easeInOut',
            duration: 1000, // 각 갱신에 걸리는 시간을 1초로 설정하여 더 자연스러운 전환을 만듭니다.
            svgStyle: null,
            // from: {color: '#0408f8'}, // 시작 색상
            // to: {color: '#5153c4'}, // 종료 색상
            step: function (state, bar, attachment) {
                // 남은 시간에 따라 색상을 동적으로 계산
                let progress = (totalTime - timeLeft) / totalTime;
                let red = Math.round(4 + progress * (248 - 4)); // 4에서 248로 변화
                let green = Math.round(8 + progress * (4 - 8)); // 8에서 4로 변화
                let blue = Math.round(248 + progress * (4 - 248)); // 248에서 4로 변화

                let color = `rgb(${red}, ${green}, ${blue})`;
                bar.path.setAttribute('stroke', color);
            }
        });

        self.timerId = setInterval(function () {
            timeLeft--;
            let timeFraction = timeLeft / self.totalTime;

            // 매 초마다 프로그레스 바 업데이트
            self.timerBar.animate(timeFraction, {duration: 1000});

            if (timeLeft <= 0) {
                clearInterval(self.timerId);
                self.isTimeRemain = false;
                console.log("타이머 종료");
            }
        }, 1000);
    },
    /**
     * 타이머 초기화
     */
    resetTimer : function(){
        let self = this;
        // 타이머 중지
        clearInterval(self.timerId);

        if (self.timerBar) {
            // 프로그레스 바를 원래 상태로 재설정
            self.timerBar.set(1);
        }
    }
}
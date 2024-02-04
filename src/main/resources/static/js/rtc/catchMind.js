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
    subject: '',
    isGameLeader: false,
    isGameParticipant : false,
    isGameStart : false,
    isGameReady : false,
    gameReadyUser: 0,
    gameParticipants: 0,
    canvas: null,
    ctx: null,
    drawing: false, // 그리기 상태를 추적하는 변수
    lastX: 0,
    lastY: 0,
    init: function () {
        canvas = document.getElementById('mycanvas');
        ctx = canvas.getContext('2d');
        if (!this.isInit) {
            this.initCanvasEvent();
            this.initClickEvent();

            this.isInit = true;
        }
    },
    initCanvasEvent: function () {
        let self = this;
        // 마우스 움직일 때
        canvas.addEventListener('mousemove', function (e) {
            if (self.drawing && self.isGameStart) {
                ctx.beginPath();
                ctx.moveTo(self.lastX, self.lastY);
                self.setMousePosition(e);
                ctx.lineTo(self.lastX, self.lastY);
                ctx.stroke();

                // console.log("x pos : ", lastX + " ::::: " + "y pos : ", lastY);

                const pos = {
                    "mouseX": self.lastX,
                    "mouseY": self.lastY
                }

                dataChannel.sendMessage(pos, 'gameMouseEvent');
            }
        });

        // 마우스 뗄 때와 캔버스 밖으로 나갈 때
        canvas.addEventListener('mouseup', function () {
            self.drawing = false;
        });
        canvas.addEventListener('mouseout', function () {
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
                self.addGameParticipant();
                self.addGameReady();
                self.sendGameRequest();
                self.gameReadyToast('leader');

                $('#readyBtn').attr('hide', true);
                $('#startBtn').attr('hide', false);
            } else if (self.isGameParticipant) {
                self.addGameReady();

                // 'GAME READY' 버튼 숨기기
                $("#readyBtn").hide();
                // 로딩 인디케이터 표시
                $("#loadingIndicator").show();
            }

        });

        $(".topic-btn").click(function(){
            var topic = $(this).text();
            self.subject = topic;
            $('#selectedTopic').html('선택된 주제는 <b>' + topic + '</b>입니다.');
            $('#readyBtn').prop('disabled', false);
        });

        // '예' 버튼 클릭 이벤트 핸들러
        $('#acceptGameRequest').click(function () {
            // 게임 참여 수락 처리 로직
            self.isGameParticipant = true;
            self.addGameParticipant();

            $('#gameSubject-tab').hide(); // 주제 선택 탭 숨김
            $('#gameTiptab').tab('show'); // 게임 방법 & 팁 탭을 활성화

            // 게임 방법 & 팁 탭을 기본적으로 표시
            $('#gameSubject').removeClass('show active');
            $('#gameTip').addClass('show active'); // 주제 선택 탭 내용 숨김

            $('#gameRequestModal').modal('hide');
            $('#subjectModal').modal('show');

            $('#readyBtn').prop('disabled', false);
            $('#exitBtn').addClass('hidden');

        });
    },
    setMousePosition: function (e) {
        var rect = canvas.getBoundingClientRect();
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
        dataChannel.sendMessage("gameRequest", "game");

    },
    addGameParticipant: function () {
        this.gameParticipants += 1;
        dataChannel.sendMessage("addParticipant", "game");
    },
    addGameReady : function(){
        this.gameReadyUser += 1;
        $('#loadingUser').text(this.gameReadyUser +"/"+this.gameParticipants)
    },
    isAllUserReady : function(){
        return this.gameReadyUser === this.gameParticipants;
    }

}
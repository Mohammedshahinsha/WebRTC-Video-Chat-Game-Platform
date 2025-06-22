const roomList = {
  roomId: null,
  originPwd: '',
  init: function() {
    const self = this;
    self.loadRoomList();
    self.checkVisitor();
    self.initModals();
    self.initInputLimits();
    self.initAnnouncement();
    self.initUpdateButton();
    window.loadRoomList = self.loadRoomList.bind(self); // 외부 노출
  },
  loadRoomList: function() {
    const self = this;
    ajax(window.__CONFIG__.API_BASE_URL + '/chat/room/list', 'GET', true, '', function(list) {
      const $tbody = $('#roomTableBody');
      $tbody.empty();
      list.forEach(function(room) {
        const isSecret = room.secretChk;
        const roomType = room.chatType === 'MSG' ? '일반 채팅' : '화상 채팅';
        const lockIcon = isSecret ? '🔒︎' : '';
        const btnSetting = `<button class='btn btn-primary btn-sm configRoomBtn' data-id='${room.roomId}'>채팅방 설정</button>`;
        const roomNameHtml = isSecret
          ? `<a href="#enterRoomModal" data-bs-toggle="modal" class="enterRoomBtn" data-id="${room.roomId}">${room.roomName}</a>`
          : `<a href="#" class="directEnterBtn" data-roomid="${room.roomId}">${room.roomName}</a>`;
        $tbody.append(`
          <tr>
            <td>${roomNameHtml}</td>
            <td>${lockIcon}</td>
            <td><span class="badge bg-primary rounded-pill">${room.userCount}/${room.maxUserCnt}</span></td>
            <td>${roomType}</td>
            <td>${btnSetting}</td>
          </tr>
        `);
      });
    }, function(err) {
      $('#roomTableBody').html('<tr><td colspan="5">방 목록을 불러오지 못했습니다.</td></tr>');
    });
  },
  numberChk: function() {
    let check = /^[0-9]+$/;
    if (!check.test($("#modalMaxUserCnt").val())) {
      Toastify({
        text: '채팅 인원에는 숫자만 입력 가능합니다!',
        duration: 2000,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
      return false;
    }
    return true;
  },
  // 방문자 수 조회
  checkVisitor: function() {
    let url = window.__CONFIG__.API_BASE_URL + "/visitor";
    let data = {
      "isVisitedToday": sessionStorage.getItem("isVisitedToday") === 'true' ? 'true' : 'false'
    };
    let successCallback = function(res){
      if(res.result === 'success'){
        $('#visitorCount').text('방문자 수 : ' + res.data);
      } else {
        console.error("Error ajax data: ", res.message);
      }
    };
    let errorCallback = function(error){
      console.error("Error ajax data: ", error);
    };
    let completeCallback = function (result) {
      if (!sessionStorage.getItem('isVisitedToday') || sessionStorage.getItem('isVisitedToday') === false) {
        sessionStorage.setItem('isVisitedToday', 'true');
      }
    };
    ajax(url, 'GET', '', data, successCallback, errorCallback, completeCallback);
  },
  initModals: function() {
    const self = this;
    // 모달창 열릴 때 이벤트 처리 => roomId 가져오기
    $("#enterRoomModal").on("show.bs.modal", function (event) {
      self.roomId = $(event.relatedTarget).data('id');
    });
    // 방 설정 모달 열릴 때 roomId 세팅 보강 및 기존 비밀번호 저장
    $(document).on('show.bs.modal', '#validatePwdModal', function (e) {
      let id = $(e.relatedTarget).data('id');
      if (id) {
        self.roomId = id;
      }
    });
    // roomConfigModal 열릴 때 현재 방 정보로 input 초기화 및 기존 비밀번호 저장
    $('#roomConfigModal').on('show.bs.modal', function () {
      if (!self.roomId) return;
      $.ajax({
        url: window.__CONFIG__.API_BASE_URL + '/chat/room/' + self.roomId,
        type: 'GET',
        success: function(res) {
          if (res && res.data) {
            $('#configRoomName').val(res.data.roomName);
            $('#configMaxUserCnt').val(res.data.maxUserCnt);
            $('#configRoomPwd').val(res.data.roomPwd).prop('readonly', true);
            $('#changePwdCheckbox').prop('checked', false);
            self.originPwd = res.data.roomPwd || '';
          }
        }
      });
    });
    // 비밀번호 확인 모달 닫힐 때 입력값 및 안내 초기화
    $('#validatePwdModal').on('hidden.bs.modal', function () {
      $('#validatePwd').val('');
      $('#confirmLabel').text('비밀번호 확인');
      $('#confirm').remove();
    });
  },
  initInputLimits: function() {
    // 문자 채팅 누를 시 disabled 풀림
    let $maxUserCnt = $("#modalMaxUserCnt");
    let $msgType = $("#modalMsgType");
    $msgType.change(function () {
      if ($msgType.is(':checked')) {
        $maxUserCnt.attr('disabled', false);
      }
    });
  },
  initAnnouncement: function() {
    const self = this;
    if (!sessionStorage.getItem('hideAnnouncement') || sessionStorage.getItem('hideAnnouncement') === 'false') {
      $('#announcementModal').modal('show');
    } else {
      $('#announcementModal').modal('hide');
    }
    $('#announcementModal').on('hide.bs.modal', function (event) {
      if (document.getElementById('dontShowAgain').checked) {
        sessionStorage.setItem('hideAnnouncement', 'true');
      }
    });
    $("#agreeBtn").click(function(){
      self.checkVisitor();
      fetch(window.__CONFIG__.API_BASE_URL + "/user_agree", { method: 'GET' })
        .then(response => { console.info("user agree!!") });
      $('#announcementModal').modal('hide');
    });
  },
  initUpdateButton: function() {
    $('#showUpdatesButton').on('click', function() {
      const updateHistoryModal = new bootstrap.Modal($('#updateHistoryModal'));
      updateHistoryModal.show();
    });
  }
};

$(function() {
  roomList.init();
});
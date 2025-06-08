const roomList = {
  roomId: null,
  originPwd: '',
  init: function() {
    const self = this;
    self.loadRoomList();
    self.checkVisitor();
    self.bindRoomEvents();
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
      self.bindRoomEvents();
    }, function(err) {
      $('#roomTableBody').html('<tr><td colspan="5">방 목록을 불러오지 못했습니다.</td></tr>');
    });
  },
  bindRoomEvents: function() {
    const self = this;
    // 비밀방 입장 - RoomPopup으로 위임
    $(document).off('click', '.enterRoomBtn').on('click', '.enterRoomBtn', function(e) {
      e.preventDefault();
      const roomId = $(this).data('id');
      if (window.RoomPopup) {
        window.RoomPopup.setRoomId(roomId);
        $('#enterRoomModal').modal('show');
      }
    });
    // 일반방 바로 입장 - RoomPopup으로 위임
    $(document).off('click', '.directEnterBtn').on('click', '.directEnterBtn', function(e) {
      e.preventDefault();
      const id = $(this).data('roomid');
      if (window.RoomPopup) {
        window.RoomPopup.chkRoomUserCnt(id);
      }
    });
    // 방 설정 모달 - RoomSettingsPopup으로 위임
    $(document).off('click', '.configRoomBtn').on('click', '.configRoomBtn', function() {
      const roomId = $(this).data('id');
      if (window.RoomSettingsPopup) {
        window.RoomSettingsPopup.setRoomId(roomId);
        $('#validatePwdModal').modal('show');
      }
    });
    // 방 생성 - RoomPopup으로 위임 (이벤트는 RoomPopup에서 처리됨)
    // 방 생성 관련 모든 이벤트 처리는 js/popup/room_popup.js에서 담당
    // 방 수정 모달 최대 인원 입력 제한 (2~6)
    $(document).on('input', '#configMaxUserCnt', function() {
      let val = parseInt($(this).val(), 10);
      if (isNaN(val) || val < 2) {
        $(this).val(2);
      } else if (val > 6) {
        $(this).val(6);
      }
    });
    // 방 삭제 버튼
    $(document).off('click', '#deleteRoomBtn').on('click', '#deleteRoomBtn', function() {
      self.delRoom();
    });
    // 채팅방 설정하기 버튼
    $(document).off('click', '#configRoomBtn').on('click', '#configRoomBtn', function() {
      if ($(this).hasClass('disabled') || $(this).attr('aria-disabled') === 'true') return;
      if (!self.roomId) {
        Toastify({
          text: '방 정보가 올바르지 않습니다. 다시 시도해 주세요.', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
        }).showToast();
        return;
      }
      Toastify({
        text: '설정 진입 성공', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#51cf66', close: true
      }).showToast();
      $('#validatePwdModal').modal('hide');
      setTimeout(function() {
        $('#roomConfigModal').modal('show');
      }, 500);
    });
    // 방 수정 저장
    $(document).off('click', '#saveRoomConfigBtn').on('click', '#saveRoomConfigBtn', function() {
      self.saveRoomConfig();
    });
    // 비밀번호 변경 체크박스
    $(document).off('change', '#changePwdCheckbox').on('change', '#changePwdCheckbox', function() {
      if ($(this).is(':checked')) {
        $('#configRoomPwd').prop('readonly', false).val('');
      } else {
        $('#configRoomPwd').prop('readonly', true);
      }
    });
    // 비밀번호 입력란 눈 아이콘 토글
    $(document).on('click', '#roomModal .input-group-text', function() {
      const $input = $(this).siblings('input[data-toggle="password"]');
      const $icon = $(this).find('i');
      if ($input.attr('type') === 'password') {
        $input.attr('type', 'text');
        $icon.removeClass('fa-eye').addClass('fa-eye-slash');
      } else {
        $input.attr('type', 'password');
        $icon.removeClass('fa-eye-slash').addClass('fa-eye');
      }
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
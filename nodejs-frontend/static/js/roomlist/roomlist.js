const roomList = {
  roomId: null,
  originPwd: '',
  init: function() {
    const self = this;
    self.loadRoomList();
    self.getVisitorCount();
    self.bindRoomEvents();
    self.initModals();
    self.initInputLimits();
    self.initAnnouncement();
    self.initUpdateButton();
    window.loadRoomList = self.loadRoomList.bind(self); // 외부 노출
  },
  loadRoomList: function() {
    const self = this;
    ajax(window.__CONFIG__.API_BASE_URL + '/chat/roomlist', 'GET', true, '', function(list) {
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
    // 비밀방 입장
    $(document).off('click', '.enterRoomBtn').on('click', '.enterRoomBtn', function(e) {
      e.preventDefault();
      self.roomId = $(this).data('id');
      $('#enterRoomModal').modal('show');
    });
    // 일반방 바로 입장
    $(document).off('click', '.directEnterBtn').on('click', '.directEnterBtn', function(e) {
      e.preventDefault();
      const id = $(this).data('roomid');
      self.chkRoomUserCnt(id);
    });
    // 방 설정 모달
    $(document).off('click', '.configRoomBtn').on('click', '.configRoomBtn', function() {
      self.roomId = $(this).data('id');
      $('#confirmPwdModal').modal('show');
    });
    // 비밀방 모달에서 '입장하기' 버튼 클릭
    $(document).off('click', '#enterRoomBtn').on('click', '#enterRoomBtn', function(e) {
      e.preventDefault();
      self.enterRoom();
    });
    // 방 생성
    $('#modalCreateRoomForm').off('submit').on('submit', function(e) {
      e.preventDefault();
      if (self.createRoom()) {
        $.ajax({
          url: window.__CONFIG__.API_BASE_URL + '/chat/room',
          type: 'POST',
          data: {
            roomName: $('#modalRoomName').val(),
            roomPwd: $('#modalRoomPwd').val(),
            secretChk: $('#modalSecret').is(':checked'),
            maxUserCnt: $('#modalMaxUserCnt').val(),
            chatType: $('input[name="modalChatType"]:checked').val()
          },
          xhrFields: { withCredentials: true },
          success: function(res) {
            Toastify({
              text: '방 생성이 완료되었습니다!',
              duration: 2000,
              gravity: 'top',
              position: 'center',
              backgroundColor: '#51cf66',
              close: true
            }).showToast();
            $('#roomModal').modal('hide');
            self.loadRoomList();
          },
          error: function(err) {
            Toastify({
              text: '방 생성에 실패했습니다: ' + (err.responseText || ''),
              duration: 2500,
              gravity: 'top',
              position: 'center',
              backgroundColor: '#fa5252',
              close: true
            }).showToast();
          }
        });
      }
    });
    // 방 생성 모달 닫힐 때 input 값 초기화
    $('#roomModal').on('hidden.bs.modal', function () {
      $('#modalRoomName').val('');
      $('#modalRoomPwd').val('');
      $('#modalMaxUserCnt').val('2');
    });
    // 방 생성 최대 인원 입력 제한 (2~6)
    $(document).on('input', '#modalMaxUserCnt', function() {
      let val = parseInt($(this).val(), 10);
      if (isNaN(val) || val < 2) {
        $(this).val(2);
      } else if (val > 6) {
        $(this).val(6);
      }
    });
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
      $('#confirmPwdModal').modal('hide');
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
  createRoom: function() {
    $('#loadingIndicator').show();
    $('#roomConfigBtn').hide();
    function resetEvent() {
      $('#loadingIndicator').hide();
      $('#roomConfigBtn').show();
    };
    let name = $("#modalRoomName").val();
    let pwd = $("#modalRoomPwd").val();
    let secret = $("#modalSecret").is(':checked');
    let $chatType = $('input[name="modalChatType"]:checked').val();
    let $maxUserCnt = $("#modalMaxUserCnt").val();
    if (name === "") {
      Toastify({
        text: '방 이름은 필수입니다',
        duration: 2000,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
      resetEvent();
      return false;
    }
    if ($("#" + name).length > 0) {
      Toastify({
        text: '이미 존재하는 방입니다',
        duration: 2000,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
      resetEvent();
      return false;
    }
    if (pwd === "") {
      Toastify({
        text: '비밀번호는 필수입니다',
        duration: 2000,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
      resetEvent();
      return false;
    }
    if ($('input[name=modalChatType]:checked').val() == null) {
      Toastify({
        text: '채팅 타입은 필수입니다',
        duration: 2000,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
      resetEvent();
      return false;
    }
    if ($maxUserCnt <= 1) {
      Toastify({
        text: '채팅은 최소 2명 이상이어야 합니다!',
        duration: 2000,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
      resetEvent();
      return false;
    } else {
      if ($chatType === 'msgChat' && $maxUserCnt > 100) {
        Toastify({
          text: '일반 채팅은 최대 100명입니다!',
          duration: 2000,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#fa5252',
          close: true
        }).showToast();
        resetEvent();
        return false;
      } else if ($chatType === 'rtcChat' && $maxUserCnt > 6) {
        Toastify({
          text: '화상 채팅은 최대 6명입니다!',
          duration: 2000,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#fa5252',
          close: true
        }).showToast();
        resetEvent();
        return false;
      }
    }
    if (!this.numberChk()) {
      resetEvent();
      return false;
    }
    return true;
  },
  delRoom: function() {
    const self = this;
    let url = window.__CONFIG__.API_BASE_URL + "/chat/room/" + self.roomId;
    let successCallback = function (result) {
      if (result && result.data) {
        Toastify({ text: '방 삭제를 완료했습니다', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#51cf66', close: true }).showToast();
        $('#roomConfigModal').modal('hide');
        location.reload();
      } else {
        Toastify({ text: '방 삭제에 실패했습니다.', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true }).showToast();
      }
    };
    let errorCallback = function(error){
      let result = error.responseJSON;
      let errorMessage = '방 삭제 중 오류가 발생했습니다.';
      if (result && result.code === '40041') {
        errorMessage = result.message;
      }
      Toastify({ text: errorMessage, duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true }).showToast();
    }
    ajax(url, 'DELETE', false, '', successCallback, errorCallback);
  },
  saveRoomConfig: function() {
    const self = this;
    const name = $('#configRoomName').val().trim();
    const maxUserCnt = parseInt($('#configMaxUserCnt').val(), 10);
    const pwd = $('#configRoomPwd').val();
    const changePwd = $('#changePwdCheckbox').is(':checked');
    if (!name) {
      Toastify({ text: '방 이름을 입력하세요.', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true }).showToast();
      return;
    }
    if (isNaN(maxUserCnt) || maxUserCnt < 2 || maxUserCnt > 6) {
      Toastify({ text: '최대 인원은 2~6명만 가능합니다.', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true }).showToast();
      return;
    }
    if (changePwd && !pwd) {
      Toastify({ text: '비밀번호를 입력하세요.', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true }).showToast();
      return;
    }
    $.ajax({
      url: window.__CONFIG__.API_BASE_URL + '/chat/room/modify/' + self.roomId,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        roomId: self.roomId,
        roomName: name,
        maxUserCnt: maxUserCnt,
        roomPwd: changePwd ? pwd : self.originPwd
      }),
      success: function(res) {
        Toastify({ text: '설정이 저장되었습니다.', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#51cf66', close: true }).showToast();
        $('#roomConfigModal').modal('hide');
        location.reload();
      },
      error: function(err) {
        Toastify({ text: '설정 저장 실패', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true }).showToast();
      }
    });
    // input 값 초기화
    $('#configRoomName').val('');
    $('#configMaxUserCnt').val('2');
    $('#configRoomPwd').val('').prop('readonly', true);
    $('#changePwdCheckbox').prop('checked', false);
  },
  confirmPWD: function() {
    const self = this;
    $("#confirmPwd").off('keyup').on("keyup", function () {
      let $confirmPwd = $("#confirmPwd").val();
      const $configRoomBtn = $("#configRoomBtn");
      let $confirmLabel = $("#confirmLabel");
      if (!self.roomId) {
        Toastify({
          text: '방 정보가 올바르지 않습니다. 다시 시도해 주세요.', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
        }).showToast();
        $configRoomBtn.attr("class", "btn btn-primary disabled");
        $configRoomBtn.attr("aria-disabled", true);
        $confirmLabel.html("<span id='confirm'>방 정보 오류</span>");
        $("#confirm").css({ "color": "#FA3E3E", "font-weight": "bold" });
        return;
      }
      let url = window.__CONFIG__.API_BASE_URL + '/chat/confirmPwd/' + self.roomId;
      let data = {
        "roomPwd": $confirmPwd
      };
      let successCallback = function(result){
        if (result && result.data) {
          $configRoomBtn.attr("class", "btn btn-primary");
          $configRoomBtn.attr("aria-disabled", false);
          $confirmLabel.html("<span id='confirm'>비밀번호 확인 완료</span>");
          $("#confirm").css({
            "color": "#0D6EFD",
            "font-weight": "bold",
          });
        } else {
          $configRoomBtn.attr("class", "btn btn-primary disabled");
          $configRoomBtn.attr("aria-disabled", true);
          $confirmLabel.html("<span id='confirm'>비밀번호가 틀립니다</span>");
          $("#confirm").css({
            "color": "#FA3E3E",
            "font-weight": "bold",
          });
        }
      };
      let errorCallback = function (error) {
        console.error(error)
      };
      ajax(url, 'POST', '', data, successCallback, errorCallback);
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
  enterRoom: function() {
    const self = this;
    let $enterPwd = $('#enterPwd').val();
    let url = window.__CONFIG__.API_BASE_URL + '/chat/confirmPwd/' + self.roomId;
    let data = {
      'roomPwd': $enterPwd
    };
    let successCallback = function (result) {
      if (result && result.data) {
        $('#enterRoomModal').modal('hide');
        self.chkRoomUserCnt(self.roomId);
      } else {
        Toastify({
          text: '비밀번호가 틀립니다. 비밀번호를 확인해주세요',
          duration: 2500,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#fa5252',
          close: true
        }).showToast();
      }
    };
    let errorCallback = function (error) {
      console.error(error);
      Toastify({
        text: '방 입장 중 오류가 발생했습니다',
        duration: 2500,
        gravity: 'top',
        position: 'center',
        backgroundColor: '#fa5252',
        close: true
      }).showToast();
    }
    ajax(url, 'POST', false, data, successCallback, errorCallback);
  },
  chkRoomUserCnt: function(roomId) {
    let url = window.__CONFIG__.API_BASE_URL + '/chat/chkUserCnt/' + roomId;
    let successCallback = function (result) {
      if (!result || !result.data) {
        Toastify({
          text: '채팅방이 꽉 차서 입장 할 수 없습니다', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
        }).showToast();
        return;
      }
      location.href = window.__CONFIG__.BASE_URL + '/kurentoroom.html?roomId=' + roomId;
    };
    let errorCallback = function (error) {
      console.error(error);
    }
    ajax(url, 'GET', 'false', '', successCallback, errorCallback);
  },
  getVisitorCount: function() {
    let url = window.__CONFIG__.API_BASE_URL + "/visitor";
    let data = {
      "isVisitedToday": 'true'
    };
    let successCallback = function(data){
      dailyVisitor = data;
      $('#visitorCount').text('방문자 수 : ' + dailyVisitor);
    };
    let errorCallback = function(error){
      console.error("Error getting visitor count: ", error);
    };
    ajax(url, 'GET', true, data, successCallback, errorCallback);
  },
  checkVisitor: function() {
    let url = window.__CONFIG__.API_BASE_URL + "/visitor";
    let data = {
      "isVisitedToday": sessionStorage.getItem("isVisitedToday") === 'true'
    };
    let successCallback = function(data){
      dailyVisitor = data;
      $('#visitorCount').text('방문자 수 : ' + dailyVisitor);
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
    $(document).on('show.bs.modal', '#confirmPwdModal', function (e) {
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
    $('#confirmPwdModal').on('hidden.bs.modal', function () {
      $('#confirmPwd').val('');
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
      var myModal = new bootstrap.Modal($('#updateHistoryModal'));
      myModal.show();
    });
  }
};

$(function() {
  roomList.init();
  roomList.confirmPWD();
});
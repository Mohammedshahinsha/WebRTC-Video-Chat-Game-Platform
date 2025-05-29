let roomId;

$(function () {
  // 1. 방 리스트 동적 렌더링
  function loadRoomList() {
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
      bindRoomEvents();
    }, function(err) {
      $('#roomTableBody').html('<tr><td colspan="5">방 목록을 불러오지 못했습니다.</td></tr>');
    });
  }

  // 2. 각 방 이벤트 동적 바인딩
  function bindRoomEvents() {
    // 비밀방 입장
    $('.enterRoomBtn').off('click').on('click', function() {
      roomId = $(this).data('id');
      $('#enterRoomModal').modal('show');
    });
    // 일반방 바로 입장
    $('.directEnterBtn').off('click').on('click', function() {
      const id = $(this).data('roomid');
      chkRoomUserCnt(id);
    });
    // 방 설정 모달
    $('.configRoomBtn').off('click').on('click', function() {
      roomId = $(this).data('id');
      $('#confirmPwdModal').modal('show');
    });
  }

  // 기존 이벤트 및 폼 제출, 방문자수, 공지 등 유지
  $('#createRoomForm').off('submit').on('submit', function(e) {
    e.preventDefault();
    if (createRoom()) {
      $.ajax({
        url: window.__CONFIG__.API_BASE_URL + '/chat/room',
        type: 'POST',
        data: {
          roomName: $('#roomName').val(),
          roomPwd: $('#roomPwd').val(),
          secretChk: $('#secret').is(':checked'),
          maxUserCnt: $('#maxUserCnt').val(),
          chatType: $('input[name="chatType"]:checked').val()
        },
        xhrFields: { withCredentials: true },
        success: function(res) {
          alert('방 생성 성공!');
          loadRoomList();
        },
        error: function(err) {
          alert('방 생성 실패: ' + (err.responseText || ''));
        }
      });
    }
  });

  // 페이지 최초 로드시 방 리스트 불러오기
  loadRoomList();

  // 페이지 로드 시 방문자 수 표시 (증가 없이 조회만)
  getVisitorCount();

  // 방문자수, 공지, 업데이트 모달 등 기존 코드 유지
  let $maxUserCnt = $("#maxUserCnt");
  let $msgType = $("#msgType");

  // 모달창 열릴 때 이벤트 처리 => roomId 가져오기
  $("#enterRoomModal").on("show.bs.modal", function (event) {
    roomId = $(event.relatedTarget).data('id');
    // console.log("roomId: " + roomId);
  });

  // 방 설정 모달 열릴 때 roomId 세팅 보강
  $(document).on('show.bs.modal', '#confirmPwdModal', function (e) {
    // 버튼에서 data-id를 가져오거나, 트리거가 없으면 현재 선택된 방 등에서 가져옴
    let id = $(e.relatedTarget).data('id');
    if (id) {
      roomId = id;
    } else {
      // fallback: 테이블에서 선택된 row 등에서 roomId를 추출하는 로직 추가 가능
      // roomId = ...
    }
  });

  // 채팅방 설정 시 비밀번호 확인 - keyup 펑션 활용
  confirmPWD();

  // 문자 채팅 누를 시 disabled 풀림
  $msgType.change(function () {
    if ($msgType.is(':checked')) {
      $maxUserCnt.attr('disabled', false);
    }
  })

  // 방문자 수 조회만 하는 함수 (증가 없이)
  function getVisitorCount() {
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

    // GET 방식으로 방문자 수만 조회
    ajax(url, 'GET', true, data, successCallback, errorCallback);
  }

  function checkVisitor() {
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
      // 일일 방문자 check
      if (!sessionStorage.getItem('isVisitedToday') || sessionStorage.getItem('isVisitedToday') === false) {
        sessionStorage.setItem('isVisitedToday', 'true');
      }
    };

    ajax(url, 'GET', '', data, successCallback, errorCallback, completeCallback);
  }

  // hideAnnouncement 값이 없거나 false 라면 show 아니면 hide
  if (!sessionStorage.getItem('hideAnnouncement') || sessionStorage.getItem('hideAnnouncement') === 'false') {
    $('#announcementModal').modal('show');
  } else {
    $('#announcementModal').modal('hide');
  }

  // "오늘 하루 안보기" 버튼 누르면 sessionStorage 에 item 생성
  $('#announcementModal').on('hide.bs.modal', function (event) {
    if (document.getElementById('dontShowAgain').checked) {
      sessionStorage.setItem('hideAnnouncement', 'true');
    }
  });

  // "동의합니다" 버튼 클릭 시에만 checkVisitor() API 호출
  $("#agreeBtn").click(function(){
    // checkVisitor() API 호출
    checkVisitor();
    
    // 기존 user_agree API도 유지 (필요시)
    fetch(window.__CONFIG__.API_BASE_URL + "/user_agree", {
      method: 'GET'
    })
      .then(response => {
        console.info("user agree!!")
      })
    
    // modal 닫기
    $('#announcementModal').modal('hide');
  })

  $('#showUpdatesButton').on('click', function() {
    var myModal = new bootstrap.Modal($('#updateHistoryModal'));
    myModal.show();
  });

  // 방 생성 모달 submit 이벤트
  $('#modalCreateRoomForm').off('submit').on('submit', function(e) {
    e.preventDefault();
    const name = $('#modalRoomName').val();
    const pwd = $('#modalRoomPwd').val();
    const maxUserCnt = $('#modalMaxUserCnt').val();
    const secret = $('#modalSecret').is(':checked');
    const chatType = $('input[name="modalChatType"]:checked').val();
    if (!name || !pwd || !maxUserCnt || !chatType) {
      Toastify({
        text: '모든 값을 입력하세요.', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
      }).showToast();
      return;
    }
    // 버튼 비활성화, 로딩 표시
    $('#modalCreateRoomBtn').prop('disabled', true);
    $('#modalCreateRoomLoading').show();
    $.ajax({
      url: window.__CONFIG__.API_BASE_URL + '/chat/room',
      type: 'POST',
      data: {
        roomName: name,
        roomPwd: pwd,
        secretChk: secret,
        maxUserCnt: maxUserCnt,
        chatType: chatType
      },
      xhrFields: { withCredentials: true },
      success: function(res) {
        Toastify({
          text: '방 생성 성공!', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#51cf66', close: true
        }).showToast();
        $('#roomModal').modal('hide');
        loadRoomList();
      },
      error: function(err) {
        Toastify({
          text: '방 생성 실패: ' + (err.responseText || ''), duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
        }).showToast();
      },
      complete: function() {
        $('#modalCreateRoomBtn').prop('disabled', false);
        $('#modalCreateRoomLoading').hide();
      }
    });
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

  // 채팅방 설정하기 버튼 클릭 이벤트 바인딩
  $(document).off('click', '#configRoomBtn').on('click', '#configRoomBtn', function() {
    // 버튼이 비활성화면 동작하지 않음
    if ($(this).hasClass('disabled') || $(this).attr('aria-disabled') === 'true') return;
    if (!roomId) {
      Toastify({
        text: '방 정보가 올바르지 않습니다. 다시 시도해 주세요.', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
      }).showToast();
      return;
    }
    // 실제 설정 페이지가 있다면 아래 주석 해제
    // window.location.href = '/chat/room/config/' + roomId;
    // 별도 설정 페이지가 없다면 아래처럼 토스트만 띄우고 모달 닫기
    Toastify({
      text: '설정 진입 성공', duration: 2000, gravity: 'top', position: 'center', backgroundColor: '#51cf66', close: true
    }).showToast();
    $('#confirmPwdModal').modal('hide');
  });
})

// 채팅방 설정 시 비밀번호 확인 - keyup 펑션 활용
function confirmPWD() {
  $("#confirmPwd").off('keyup').on("keyup", function () {
    let $confirmPwd = $("#confirmPwd").val();
    const $configRoomBtn = $("#configRoomBtn");
    let $confirmLabel = $("#confirmLabel");

    if (!roomId) {
      Toastify({
        text: '방 정보가 올바르지 않습니다. 다시 시도해 주세요.', duration: 2500, gravity: 'top', position: 'center', backgroundColor: '#fa5252', close: true
      }).showToast();
      $configRoomBtn.attr("class", "btn btn-primary disabled");
      $configRoomBtn.attr("aria-disabled", true);
      $confirmLabel.html("<span id='confirm'>방 정보 오류</span>");
      $("#confirm").css({ "color": "#FA3E3E", "font-weight": "bold" });
      return;
    }

    let url = window.__CONFIG__.API_BASE_URL + '/chat/confirmPwd/' + roomId;
    let data = {
      "roomPwd": $confirmPwd
    };
    let successCallback = function(result){
      // result.data의 값(true/false)에 따라 처리
      if (result && result.data) { // true 일때는
        $configRoomBtn.attr("class", "btn btn-primary");
        $configRoomBtn.attr("aria-disabled", false);

        $confirmLabel.html("<span id='confirm'>비밀번호 확인 완료</span>");
        $("#confirm").css({
          "color": "#0D6EFD",
          "font-weight": "bold",
        });

      } else { // false 일때는
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
}

// 채팅 인원 숫자만 정규식 체크
function numberChk() {
  let check = /^[0-9]+$/;
  if (!check.test($("#maxUserCnt").val())) {
    alert("채팅 인원에는 숫자만 입력 가능합니다!!")
    return false;
  }
  return true;
}

// 채팅방 생성
function createRoom() {
  $('#loadingIndicator').show();
  // $('#createRoomBtn').hide().attr('disabled', true);
  $('#roomConfigBtn').hide();

  function resetEvent() {
    $('#loadingIndicator').hide();
    $('#roomConfigBtn').show();
    // $('#createRoomBtn').show().attr('disabled', false);
  };

  let name = $("#roomName").val();
  let pwd = $("#roomPwd").val();
  let secret = $("#secret").is(':checked');
  let secretChk = $("#secretChk");
  let $chatType = $('input[name="chatType"]:checked').val();
  let $maxUserCnt = $("#maxUserCnt").val();

  if (name === "") {
    alert("방 이름은 필수입니다");
    resetEvent();
    return false;
  }
  if ($("#" + name).length > 0) {
    alert("이미 존재하는 방입니다");
    resetEvent();
    return false;
  }
  if (pwd === "") {
    alert("비밀번호는 필수입니다");
    resetEvent();
    return false;
  }

  if ($('input[name=chatType]:checked').val() == null) {
    alert("채팅 타입은 필수입니다");
    resetEvent();
    return false;
  }

  if ($maxUserCnt <= 1) {
    alert("채팅은 최소 2명 이상!!");
    resetEvent();
    return false;
  } else {
    if ($chatType === 'msgChat' && $maxUserCnt > 100) {
      alert("일반 채팅은 최대 100명 입니다!")
      resetEvent();
      return false;
    } else if ($chatType === 'rtcChat' && $maxUserCnt > 6) {
      alert("6명 이상은 서버가 아파해요ㅠ.ㅠ");
      resetEvent();
      return false;
    }
  }

  if (secret) {
    secretChk.attr('value', true);
  } else {
    secretChk.attr('value', false);
  }

  if (!numberChk()) {
    resetEvent();
    return false;
  }

  return true;
}

// 채팅방 입장 시 비밀번호 확인
function enterRoom() {
  let $enterPwd = $('#enterPwd').val();
  let url = window.__CONFIG__.API_BASE_URL + '/chat/confirmPwd/' + roomId;
  let data = {
    'roomPwd': $enterPwd
  };
  let successCallback = function (result) {
    if (result && result.data) {
      chkRoomUserCnt(roomId);
    } else {
      alert("비밀번호가 틀립니다. \n 비밀번호를 확인해주세요");
    }
  };
  let errorCallback = function (error) {
    console.error(error);
  }
  ajax(url, 'POST', false, data, successCallback, errorCallback);
}

// 채팅방 삭제
function delRoom() {
  let url = window.__CONFIG__.API_BASE_URL + "/chat/delRoom/" + roomId;
  let successCallback = function (result) {
    if (result && result.data) {
      alert("방 삭제를 완료했습니다");
      location.href = "/";
    } else {
      alert("방 삭제에 실패했습니다.");
    }
  };
  let errorCallback = function(error){
    let result = error.responseJSON;
    let errorMessage = '방 삭제 중 오류가 발생했습니다.';
    if (result && result.code === '40041') {
      errorMessage = result.message;
    }
    alert(errorMessage);
  }
  ajax(url, 'DELETE', false, '', successCallback, errorCallback);
}

// 채팅방 입장 시 인원 수에 따라서 입장 여부 결정
function chkRoomUserCnt(roomId) {
  let url = window.__CONFIG__.API_BASE_URL + '/chat/chkUserCnt/' + roomId;
  let successCallback = function (result) {
    if (!result || !result.data) {
      alert("채팅방이 꽉 차서 입장 할 수 없습니다");
      return;
    }
    location.href = '/kurentoroom.html?roomId=' + roomId;
  };
  let errorCallback = function (error) {
    console.error(error);
  }
  ajax(url, 'GET', 'false', '', successCallback, errorCallback);
}

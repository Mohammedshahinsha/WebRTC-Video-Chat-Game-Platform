package webChat.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import webChat.model.response.common.ChatForYouResponse;
import webChat.model.room.ChatRoom;
import webChat.model.room.in.ChatRoomInVo;
import webChat.model.room.out.ChatRoomOutVo;
import webChat.model.room.ChatRoomMap;
import webChat.model.chat.ChatType;
import webChat.service.chat.ChatRoomService;
import webChat.service.kurento.KurentoManager;
import webChat.service.social.PrincipalDetails;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/chatforyou/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final KurentoManager kurentoManager;

    @GetMapping("/room/list")
    public ResponseEntity<List<ChatRoomOutVo>> goChatRooms(Model model, @AuthenticationPrincipal PrincipalDetails principalDetails){
        List<ChatRoomOutVo> responses = new ArrayList<>();

        chatRoomService.findAllRoom().forEach(room -> {
            responses.add(ChatRoomOutVo.of(room));
        });

        // TODO 로그인 기능 도입 시 필요
//        // principalDetails 가 null 이 아니라면 로그인 된 상태!!
//        if (principalDetails != null) {
//            // 세션에서 로그인 유저 정보를 가져옴
//            model.addAttribute("user", principalDetails.getUser());
//            log.debug("user [{}] ",principalDetails);
//        }

//        model.addAttribute("user", "hey");
        log.debug("SHOW ALL ChatList {}", chatRoomService.findAllRoom());
        return ResponseEntity.ok(responses);
    }

    // 채팅방 생성
    // 채팅방 생성 후 다시 / 로 return
    @PostMapping("/room")
    public ResponseEntity<ChatForYouResponse> createRoom(
            @RequestBody ChatRoomInVo chatRoomInVo) {

        // 매개변수 : 방 이름, 패스워드, 방 잠금 여부, 방 인원수
        ChatRoom room = kurentoManager.createChatRoom(chatRoomInVo);

        log.info("CREATE Chat Room [{}]", room);

        return ResponseEntity.ok(ChatForYouResponse.ofCreateRoom(room));
    }

    // 채팅방 정보 확인
    @GetMapping("/room/{roomId}")
    public ResponseEntity<ChatForYouResponse> roomDetail(
            Model model,
            @PathVariable String roomId,
            @AuthenticationPrincipal PrincipalDetails principalDetails){

        log.info("roomId {}", roomId);

        // principalDetails 가 null 이 아니라면 로그인 된 상태!!
        if (principalDetails != null) {
            // 세션에서 로그인 유저 정보를 가져옴
            model.addAttribute("user", principalDetails.getUser());
        }

        ChatRoom room = ChatRoomMap.getInstance().getChatRooms().get(roomId);

        model.addAttribute("room", room);

        if (ChatType.MSG.equals(room.getChatType())) {
            return ResponseEntity.ok(null);
        }else{
            return ResponseEntity.ok(ChatForYouResponse.ofJoinRoom(room));
        }
    }

    // 채팅방 비밀번호 확인
    @PostMapping(value = "/room/validatePwd/{roomId}")
    public ResponseEntity<ChatForYouResponse> validatePwd(
            @PathVariable String roomId,
            @RequestParam("roomPwd") String roomPwd){

        // 넘어온 roomId 와 roomPwd 를 이용해서 비밀번호 찾기
        // 찾아서 입력받은 roomPwd 와 room pwd 와 비교해서 맞으면 true, 아니면  false
        // TODO 추후 401 권한 에러로 수정할 것
        return ResponseEntity.ok(ChatForYouResponse.builder()
                .result("success")
                .data(chatRoomService.validatePwd(roomId, roomPwd))
                .build());
    }

    // 채팅방 수정
    @PutMapping(value = "/room/{roomId}")
    public ResponseEntity<ChatForYouResponse> modifyChatRoom(
            @PathVariable String roomId,
            @RequestBody ChatRoomInVo chatRoom){
        return ResponseEntity.ok(ChatForYouResponse.builder()
                .result("success")
                .data(chatRoomService.updateRoom(roomId, chatRoom.getRoomName(), chatRoom.getRoomPwd(), chatRoom.getMaxUserCnt()))
                .build());
    }

    // 채팅방 삭제
    @DeleteMapping("/room/{roomId}")
    public ResponseEntity<ChatForYouResponse> delChatRoom(@PathVariable String roomId){

        // roomId 기준으로 chatRoomMap 에서 삭제, 해당 채팅룸 안에 있는 사진 삭제
        return ResponseEntity.ok(ChatForYouResponse.builder()
                .result("success")
                .data(chatRoomService.delChatRoom(roomId))
                .build());

    }

    // 유저 카운트
    @GetMapping("/room/chkUserCnt/{roomId}")
    public ResponseEntity<ChatForYouResponse> chUserCnt(@PathVariable String roomId){
        return ResponseEntity.ok(ChatForYouResponse.builder()
                .result("success")
                .data(chatRoomService.chkRoomUserCnt(roomId))
                .build());
    }
}

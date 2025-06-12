package webChat.service.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import webChat.controller.ExceptionController;
import webChat.model.room.ChatRoom;
import webChat.model.room.ChatRoomMap;
import webChat.model.room.KurentoRoom;
import webChat.service.file.FileService;

import java.util.*;


@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomService {

    // 채팅방 삭제에 따른 채팅방의 사진 삭제를 위한 fileService 선언
    private final FileService fileService;

    @Value("${chatforyou.room.max_user_count}")
    private int MAX_USER_COUNT;

    private Map<String, ChatRoom> chatRoomMap = ChatRoomMap.getInstance().getChatRooms();

    // 전체 채팅방 조회
    public List<ChatRoom> findAllRoom() {
        // 채팅방 생성 순서를 최근순으로 반환
        List<ChatRoom> chatRooms = new ArrayList<>(chatRoomMap.values());
        Collections.reverse(chatRooms);

        return chatRooms;
    }

    /**
     *
     * @Desc room 정보 가져오기
     * @param roomId room 이름
     * @return 만약에 room 이 있다면 해당 room 객체 return
     */
    public ChatRoom findRoomById(String roomId) {
        return chatRoomMap.get(roomId);
    }

    // 채팅방 비밀번호 조회
    public boolean validatePwd(String roomId, String roomPwd) {
        // TODO 방정보 찾을 수 없는 경우 예외처리
        return roomPwd.equals(ChatRoomMap.getInstance().getChatRooms().get(roomId).getRoomPwd());
    }

    // 채팅방 인원+1
    public void plusUserCnt(String roomId) {
        ChatRoom room = ChatRoomMap.getInstance().getChatRooms().get(roomId);
        room.setUserCount(room.getUserCount() + 1);
    }

    // 채팅방 인원-1
    public void minusUserCnt(String roomId) {
        ChatRoom room = chatRoomMap.get(roomId);
        int roomCnt = Math.max(room.getUserCount() - 1, 0);
        room.setUserCount(roomCnt);
    }

    // maxUserCnt 에 따른 채팅방 입장 여부
    public boolean chkRoomUserCnt(String roomId) {
        ChatRoom room = ChatRoomMap.getInstance().getChatRooms().get(roomId);

        if (room == null || room.getUserCount() + 1 > room.getMaxUserCnt()) {
            return false;
        }

        return true;
    }

    // 채팅방 삭제
    public boolean delChatRoom(String roomId) {
        ChatRoom room = chatRoomMap.get(roomId);

        if (room.getUserCount() <= 0) {
            KurentoRoom kurentoRoom = (KurentoRoom) room;
            kurentoRoom.close();
            chatRoomMap.remove(roomId);

            // 채팅방 안에 있는 파일 삭제
            fileService.deleteFileDir(roomId);

            log.info("Room {} removed and closed", room.getRoomId());
            return true;
        } else {
            throw new ExceptionController.DelRoomException("DelRoom Exception");
        }
    }

    // 채팅방 수정
    public ChatRoom updateRoom(String roomId, String roomName, String roomPwd, int maxUserCnt) {
        ChatRoom room = ChatRoomMap.getInstance().getChatRooms().get(roomId);
        room.setRoomName(roomName);
        room.setRoomPwd(roomPwd);
        room.setMaxUserCnt(maxUserCnt);
        ChatRoomMap.getInstance().getChatRooms().put(roomId, room);
        return room;
    }

    public void validateRoomInfo(String roomName, int maxUserCnt) {
        if(maxUserCnt > MAX_USER_COUNT) {
            throw new ExceptionController.BadRequestException("can not over max user count : " + maxUserCnt);
        }

        if(ChatRoomMap.getInstance().checkExistRoomName(roomName)) {
            throw new ExceptionController.BadRequestException("room name is already exist : " + roomName);
        }

    }
}

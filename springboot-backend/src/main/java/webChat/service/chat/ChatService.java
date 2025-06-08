package webChat.service.chat;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import webChat.controller.ExceptionController;
import webChat.dto.room.ChatRoomDto;
import webChat.dto.room.ChatRoomMap;
import webChat.dto.ChatType;
import webChat.dto.room.KurentoRoomDto;
import webChat.dto.room.in.ChatRoomInVo;
import webChat.service.analysis.AnalysisService;
import webChat.service.file.FileService;

import java.util.*;
import java.util.concurrent.ConcurrentMap;


@Service
@Getter
@Setter
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    private final KurentoManager kurentoManager;
    private final MsgChatService msgChatService;
    private final RtcChatService rtcChatService;

    // 채팅방 삭제에 따른 채팅방의 사진 삭제를 위한 fileService 선언
    private final FileService fileService;

    // 사이트 통계를 위한 서비스
    private final AnalysisService analysisService;

    @Value("${chatforyou.room.max_user_count}")
    private int MAX_USER_COUNT;


    // 전체 채팅방 조회
    public List<ChatRoomDto> findAllRoom() {
        // TODO room userCnt 로직 수정 필요
        // 채팅방 생성 순서를 최근순으로 반환
        List<ChatRoomDto> chatRooms = new ArrayList<>(ChatRoomMap.getInstance().getChatRooms().values());
        Collections.reverse(chatRooms);

        return chatRooms;
    }

    // roomID 기준으로 채팅방 찾기
    public ChatRoomDto findRoomById(String roomId) {
        return ChatRoomMap.getInstance().getChatRooms().get(roomId);
    }

    // roomName 로 채팅방 만들기
    public ChatRoomDto createChatRoom(ChatRoomInVo chatRoomInVo) {
        if(chatRoomInVo.getMaxUserCnt() > MAX_USER_COUNT) {
            throw new ExceptionController.BadRequestException("can not over max user count : " + chatRoomInVo.getMaxUserCnt());
        }

        if(ChatRoomMap.getInstance().checkExistRoomName(chatRoomInVo.getRoomName())) {
            throw new ExceptionController.BadRequestException("room name is already exist : " + chatRoomInVo.getRoomName());
        }

        ChatRoomDto room;

        // 채팅방 타입에 따라서 사용되는 Service 구분
        if (ChatType.MSG.equals(chatRoomInVo.getRoomType())) {
            room = msgChatService.createChatRoom(chatRoomInVo.getRoomName(), chatRoomInVo.getRoomPwd(), chatRoomInVo.isSecretChk(), chatRoomInVo.getMaxUserCnt());
        } else if(ChatType.RTC.equals(chatRoomInVo.getRoomType())) {
            room = rtcChatService.createChatRoom(chatRoomInVo.getRoomName(), chatRoomInVo.getRoomPwd(), chatRoomInVo.isSecretChk(), chatRoomInVo.getMaxUserCnt());
        } else {
            throw new ExceptionController.BadRequestException("room type is not exist : " + chatRoomInVo.getRoomType());
        }

        analysisService.increaseDailyRoomCnt();

        return room;
    }

    // 채팅방 비밀번호 조회
    public boolean validatePwd(String roomId, String roomPwd) {
//        String pwd = chatRoomMap.get(roomId).getRoomPwd();
        // TODO 방정보 찾을 수 없는 경우 예외처리
        return roomPwd.equals(ChatRoomMap.getInstance().getChatRooms().get(roomId).getRoomPwd());

    }

    // 채팅방 인원+1
    public void plusUserCnt(String roomId) {
        log.info("cnt {}", ChatRoomMap.getInstance().getChatRooms().get(roomId).getUserCount());
        ChatRoomDto room = ChatRoomMap.getInstance().getChatRooms().get(roomId);
        room.setUserCount(room.getUserCount() + 1);
    }

    // 채팅방 인원-1
    public void minusUserCnt(String roomId) {
        ChatRoomDto room = ChatRoomMap.getInstance().getChatRooms().get(roomId);
        int roomCnt = room.getUserCount() - 1;
        if (roomCnt < 0) {
            roomCnt = 0;
        }
        room.setUserCount(roomCnt);
    }

    // maxUserCnt 에 따른 채팅방 입장 여부
    public boolean chkRoomUserCnt(String roomId) {
        ChatRoomDto room = ChatRoomMap.getInstance().getChatRooms().get(roomId);

        if (room == null || room.getUserCount() + 1 > room.getMaxUserCnt()) {
            return false;
        }

        return true;
    }

    // 채팅방 삭제
    public boolean delChatRoom(String roomId) {

        ConcurrentMap<String, ChatRoomDto> chatRooms = ChatRoomMap.getInstance().getChatRooms();
        ChatRoomDto room = chatRooms.get(roomId);

        if (room.getUserCount() <= 0) {
            if (room.getChatType().equals(ChatType.RTC)) {
                KurentoRoomDto kurentoRoom = (KurentoRoomDto) room;
                kurentoManager.removeRoom(kurentoRoom);
            } else {
                chatRooms.remove(roomId);
            }

            // 채팅방 안에 있는 파일 삭제
            fileService.deleteFileDir(roomId);

            log.info("삭제 완료 roomId : {}", roomId);
            return true;
        } else {
            throw new ExceptionController.DelRoomException("DelRoom Exception");
        }
    }

    // 채팅방 수정
    public ChatRoomDto updateRoom(String roomId, String roomName, String roomPwd, int maxUserCnt) {
        ChatRoomDto room = ChatRoomMap.getInstance().getChatRooms().get(roomId);
        room.setRoomName(roomName);
        room.setRoomPwd(roomPwd);
        room.setMaxUserCnt(maxUserCnt);
        ChatRoomMap.getInstance().getChatRooms().put(roomId, room);
        return room;
    }
}

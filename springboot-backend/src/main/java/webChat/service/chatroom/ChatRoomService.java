package webChat.service.chatroom;

import com.google.common.collect.Lists;
import io.github.dengliming.redismodule.redisearch.index.Document;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import webChat.controller.ExceptionController;
import webChat.model.chat.ChatType;
import webChat.model.redis.DataType;
import webChat.model.redis.RedisIndex;
import webChat.model.redis.RoomSearchCriteria;
import webChat.model.room.ChatRoom;
import webChat.model.room.KurentoRoom;
import webChat.model.room.RoomState;
import webChat.model.room.in.ChatRoomInVo;
import webChat.service.analysis.AnalysisService;
import webChat.service.file.FileService;
import webChat.service.kurento.KurentoRoomManager;
import webChat.service.redis.RedisService;

import java.util.*;


@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomService {

    // 채팅방 삭제에 따른 채팅방의 사진 삭제를 위한 fileService 선언
    private final FileService fileService;

    private final RedisService redisService;

    private final KurentoRoomManager kurentoRoomManager;

    private final AnalysisService analysisService;

    @Value("${chatforyou.room.max_user_count}")
    private int MAX_USER_COUNT;

    private final List<RoomState> ROOM_STATES = Lists.newArrayList(RoomState.ACTIVE, RoomState.CREATED);

    // roomName 로 채팅방 만들기
    public ChatRoom createChatRoom(ChatRoomInVo chatRoomInVo) {

        this.validateRoomInfo(chatRoomInVo.getRoomName(), chatRoomInVo.getMaxUserCnt());

        if(ChatType.RTC.equals(chatRoomInVo.getRoomType())) {
            analysisService.increaseDailyRoomCnt();
            return kurentoRoomManager.createKurentoRoom(chatRoomInVo);
        } else {
            throw new ExceptionController.BadRequestException("room type is not exist : " + chatRoomInVo.getRoomType());
        }
    }

    // 전체 채팅방 조회
    public List<ChatRoom> findRoomList(String keyword, int pageNum, int pageSize) {
        // 채팅방 생성 순서를 최근순으로 반환
        List<ChatRoom> chatRoomList = new ArrayList<>();
        pageNum = pageNum !=0 ? pageNum - 1 : pageNum;

        RoomSearchCriteria searchCriteria = RoomSearchCriteria.builder()
                .redisIndex(RedisIndex.CHATROOM)
                .keyword(keyword)
                .roomStates(ROOM_STATES)
                .pageNum(pageNum)
                .pageSize(pageSize)
                .build();
        List<Document> roomList = redisService.searchRoomListByOptions(searchCriteria);
        for (Document document : roomList) {
            if (document.getFields().get("roomId") == null) {
                continue;
            }
            String roomId = document.getFields().get("roomId").toString().replace("\"", "");
            Map<Object, Object> allChatRoomData = redisService.getAllChatRoomData(roomId);
            if (allChatRoomData.isEmpty() || allChatRoomData.get(DataType.CHATROOM.getType()) == null) {
                continue;
            }

            ChatRoom chatRoom = (ChatRoom) allChatRoomData.get("chatroom");
            chatRoomList.add(chatRoom);

        }

        return chatRoomList;
    }

    /**
     *
     * @Desc room 정보 가져오기
     * @param roomId room 이름
     * @return 만약에 room 이 있다면 해당 room 객체 return
     */
    public ChatRoom findRoomById(String roomId) throws BadRequestException {
        return redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
    }

    // 채팅방 비밀번호 조회
    public boolean validatePwd(String roomId, String roomPwd) throws BadRequestException {
        // TODO 방정보 찾을 수 없는 경우 예외처리
        ChatRoom chatRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
        return chatRoom.getRoomPwd().equals(roomPwd);
    }

    // maxUserCnt 에 따른 채팅방 입장 여부
    public boolean chkRoomUserCnt(String roomId) throws BadRequestException {
        ChatRoom chatRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);

        if (chatRoom == null || chatRoom.getUserCount() + 1 > chatRoom.getMaxUserCnt()) {
            return false;
        }

        return true;
    }


    /**
     * 방 영구 삭제
     * @param kurentoRoom
     * @return
     * @throws BadRequestException
     */
    public void delChatRoom(KurentoRoom kurentoRoom) throws BadRequestException {
        try {
            kurentoRoomManager.deleteKurentoRoom(kurentoRoom);
            redisService.deleteAllChatRoomData(kurentoRoom.getRoomId());

            // 채팅방 안에 있는 파일 삭제
            fileService.deleteFileDir(kurentoRoom.getRoomId());

            log.info("Room {} deleted permanently", kurentoRoom.getRoomId());
        } catch (Exception e) {
            throw new ExceptionController.DelRoomException("Hard Delete Room Exception");
        }

    }

    /**
     * roomId 만 받아서 방을 inactive 상태로 변경
     * @param roomId
     * @return
     * @throws BadRequestException
     */
    public boolean delChatRoom(String roomId) throws BadRequestException {
        KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);

        if(kurentoRoom.getUserCount() <= 0) {
            kurentoRoom.deactivate();
            redisService.updateChatRoom(kurentoRoom);
        } else {
            throw new ExceptionController.DelRoomException("Soft Delete Room Exception");
        }

        log.info("Room {} state changed {}", kurentoRoom.getRoomId(), RoomState.INACTIVE.getType());
        return true;
    }

    // 채팅방 수정
    public ChatRoom updateRoom(String roomId, String roomName, String roomPwd, int maxUserCnt) throws BadRequestException {
        ChatRoom chatRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
        chatRoom.setRoomName(roomName);
        chatRoom.setRoomPwd(roomPwd);
        chatRoom.setMaxUserCnt(maxUserCnt);
        redisService.updateChatRoom(chatRoom);

        return chatRoom;
    }

    public void validateRoomInfo(String roomName, int maxUserCnt) {
        if(maxUserCnt > MAX_USER_COUNT) {
            throw new ExceptionController.BadRequestException("can not over max user count : " + maxUserCnt);
        }
        RoomSearchCriteria searchCriteria = RoomSearchCriteria.builder()
                .redisIndex(RedisIndex.CHATROOM)
                .keyword(roomName)
                .roomStates(ROOM_STATES)
                .build();
        List<Document> documents = redisService.searchRoomListByOptions(searchCriteria);
        if(!CollectionUtils.isEmpty(documents)) {
            throw new ExceptionController.BadRequestException("room name is already exist : " + roomName);
        }
    }
}

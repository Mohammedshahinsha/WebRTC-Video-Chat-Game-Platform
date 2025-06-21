package webChat.model.room.out;

import lombok.Builder;
import lombok.Getter;
import webChat.model.chat.ChatType;
import webChat.model.room.ChatRoom;

import java.util.Random;
import java.util.UUID;

@Builder
@Getter
public class ChatRoomOutVo {
    private String uuid; // 유저 고유값
    private String userId; // 유저 고유값
    private String nickName; // 유저 닉네임
    private String roomId; // 채팅방 고유번호
    private String roomName; // 채팅방 이름
    private int userCount; // 채팅방 인원수
    private int maxUserCnt; // 채팅방 최대 인원 제한
    private String roomPwd; // 채팅방 삭제시 필요한 pwd
    private boolean secretChk; // 채팅방 잠금 여부
    private ChatType roomType; //  채팅 타입 여부

    public static ChatRoomOutVo of(ChatRoom chatRoom) {
        return ChatRoomOutVo.builder()
                .uuid(UUID.randomUUID().toString().split("-")[0])
                .nickName("guest" + (new Random().nextInt(100)+1))
                .roomId(chatRoom.getRoomId())
                .roomName(chatRoom.getRoomName())
                .userCount(chatRoom.getUserCount())
                .maxUserCnt(chatRoom.getMaxUserCnt())
                .roomPwd(chatRoom.getRoomPwd())
                .secretChk(chatRoom.isSecretChk())
                .roomType(chatRoom.getChatType())
                .build();
    }
}

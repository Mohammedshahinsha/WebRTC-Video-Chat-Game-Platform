package webChat.model.room.in;

import lombok.Builder;
import lombok.Getter;
import webChat.model.chat.ChatType;

@Builder
@Getter
public class ChatRoomInVo {
    private String roomId; // 채팅방 고유번호
    private String roomName; // 채팅방 이름
    private String creator;
    private int userCount; // 채팅방 인원수
    private int maxUserCnt; // 채팅방 최대 인원 제한
    private String roomPwd; // 채팅방 삭제시 필요한 pwd
    private boolean secretChk; // 채팅방 잠금 여부
    private ChatType roomType; //  채팅 타입 여부
}

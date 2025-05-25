package webChat.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.jetbrains.annotations.NotNull;
import webChat.dto.ChatType;
import webChat.dto.room.ChatRoomDto;

import java.util.Random;
import java.util.UUID;

@Builder
@Getter
public class ChatRoomResponse {
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

    public static ChatRoomResponse of(ChatRoomDto chatRoomDto) {
        return ChatRoomResponse.builder()
                .uuid(UUID.randomUUID().toString().split("-")[0])
                .nickName("guest" + (new Random().nextInt(100)+1))
                .roomId(chatRoomDto.getRoomId())
                .roomName(chatRoomDto.getRoomName())
                .userCount(chatRoomDto.getUserCount())
                .maxUserCnt(chatRoomDto.getMaxUserCnt())
                .roomPwd(chatRoomDto.getRoomPwd())
                .secretChk(chatRoomDto.isSecretChk())
                .roomType(chatRoomDto.getChatType())
                .build();
    }
}

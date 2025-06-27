package webChat.model.room;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.jetbrains.annotations.NotNull;
import webChat.model.chat.ChatType;

import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ChatRoom {
    @NotNull
    private String roomId; // 채팅방 고유번호
    @NotNull
    private String roomName; // 채팅방 이름
    private String creator;
    private int userCount; // 채팅방 인원수
    private int maxUserCnt; // 채팅방 최대 인원 제한
    private String roomPwd; // 채팅방 삭제시 필요한 pwd
    private boolean secretChk; // 채팅방 잠금 여부
    @NotNull
    private ChatType chatType; //  채팅 타입 여부
    private Long createDate; // 생성일
    private RoomState roomState;

    @JsonIgnore
    public ChatRoom(@NotNull String roomId, @NotNull String roomName, String creator, int userCount, int maxUserCnt, String roomPwd, boolean secretChk, @NotNull ChatType chatType, RoomState roomState) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.userCount = userCount;
        this.maxUserCnt = maxUserCnt;
        this.roomPwd = roomPwd;
        this.secretChk = secretChk;
        this.chatType = chatType;
        this.creator = creator;
        this.createDate = System.currentTimeMillis();
        this.roomState = Objects.nonNull(roomState) ? roomState : RoomState.CREATED;
    }
}

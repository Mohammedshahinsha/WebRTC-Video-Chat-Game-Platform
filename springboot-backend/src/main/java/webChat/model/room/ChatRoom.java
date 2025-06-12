package webChat.model.room;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;
import webChat.model.chat.ChatType;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoom<T> {
    @NotNull
    private String roomId; // 채팅방 고유번호
    private String roomName; // 채팅방 이름
    private int userCount; // 채팅방 인원수
    private int maxUserCnt; // 채팅방 최대 인원 제한
    private String roomPwd; // 채팅방 삭제시 필요한 pwd
    private boolean secretChk; // 채팅방 잠금 여부
    private ChatType chatType; //  채팅 타입 여부

    /**
     * @desc 참여자를 저장하기 위한 Map
     * */
    private Map<String, T> participants = new ConcurrentHashMap<>();

    public ChatRoom(@NotNull String roomId, String roomName, int userCount, int maxUserCnt, String roomPwd, boolean secretChk, ChatType chatType) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.userCount = userCount;
        this.maxUserCnt = maxUserCnt;
        this.roomPwd = roomPwd;
        this.secretChk = secretChk;
        this.chatType = chatType;

    }
}

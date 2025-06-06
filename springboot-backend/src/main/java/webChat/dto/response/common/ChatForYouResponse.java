package webChat.dto.response.common;

import lombok.Builder;
import lombok.Getter;
import webChat.dto.room.out.ChatRoomOutVo;
import webChat.dto.room.ChatRoomDto;

@Getter
@Builder
public class ChatForYouResponse {
    private String result;
    private String message;
    private Object data;
    private static final String SUCCESS_RESULT = "success";

    public static ChatForYouResponse ofSuccess(String data) {
        return ChatForYouResponse.builder()
                .result(SUCCESS_RESULT)
                .data(data)
                .build();
    }

    public static ChatForYouResponse ofCreateRoom(ChatRoomDto chatRoomDto) {
        return ChatForYouResponse.builder()
                .result(SUCCESS_RESULT)
                .data(chatRoomDto)
                .build();
    }

    public static ChatForYouResponse ofJoinRoom(ChatRoomDto chatRoomDto) {
        return ChatForYouResponse.builder()
                .result(SUCCESS_RESULT)
                .data(ChatRoomOutVo.of(chatRoomDto))
                .build();
    }
}

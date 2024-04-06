package webChat.dto.game;

import lombok.Data;

@Data
public class GameStatusRequest {
    private String roomId;

    private String userId;

    private GameStatus gameStatus;
}

package webChat.controller;

import lombok.Data;
import webChat.dto.GameStatus;

@Data
public class GameStatusRequest {
    private String roomId;

    private String userId;

    private GameStatus gameStatus;
}

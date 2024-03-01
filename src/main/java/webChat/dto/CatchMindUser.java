package webChat.dto;

import lombok.*;

/**
 * catchMind 게임 유저 정보를 저장하기 위한 map
 */
@Getter
@Setter
public class CatchMindUser extends User {
    private int score;
    private int winCount;
    private boolean isWiner;

    CatchMindUser(String userId, String nickName) {
        super(userId, nickName);
    }
}
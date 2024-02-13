package webChat.dto;

import lombok.*;

/**
 * catchMind 게임 유저 정보를 저장하기 위한 map
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatchMindUser {
    String roomName;
    String userName;
    String nickName;
    int score;
    int winCount;
    boolean isWiner;

}

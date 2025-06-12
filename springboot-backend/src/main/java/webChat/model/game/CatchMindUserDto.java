package webChat.model.game;

import lombok.*;
import webChat.model.user.UserDto;

/**
 * catchMind 게임 유저 정보를 저장하기 위한 map
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CatchMindUserDto extends UserDto {
    private int score;
    private int winCount;
    private boolean isWiner;

    CatchMindUserDto(String userId, String nickName) {
        super(userId, nickName);
    }
}
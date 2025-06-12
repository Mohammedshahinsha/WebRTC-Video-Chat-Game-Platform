package webChat.model.user;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private String userId; // 유저 고유값
    private String nickName; // 유저 닉네임
}

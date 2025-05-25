package webChat.dto;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class User {
    private String userId; // 유저 고유값
    private String nickName; // 유저 닉네임
}

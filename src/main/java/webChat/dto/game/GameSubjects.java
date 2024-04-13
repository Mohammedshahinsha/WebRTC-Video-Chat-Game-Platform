package webChat.dto.game;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSubjects {
    String title; // 선택된 주제
    List<String> subjects; // 추천된 주제

    @JsonProperty("before_subjects")
    List<String> beforeSubjects; // 이전 소주제

    public GameSubjects(String title){
        this.title = title;
    }

}

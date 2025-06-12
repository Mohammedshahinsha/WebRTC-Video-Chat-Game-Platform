package webChat.model.game;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSubjects {
    private String title; // 선택된 주제
    private List<String> subjects; // 추천된 주제
    @JsonProperty("before_subjects")
    private List<String> beforeSubjects; // 이전 소주제
    private String difficulty; // 난이도

}

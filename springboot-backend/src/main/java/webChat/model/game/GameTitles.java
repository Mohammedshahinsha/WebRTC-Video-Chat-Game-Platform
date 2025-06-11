package webChat.model.game;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameTitles {
    List<String> titles; // 대주제(카테고리)
}

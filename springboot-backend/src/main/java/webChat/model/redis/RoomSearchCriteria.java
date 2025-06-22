package webChat.model.redis;

import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;
import webChat.model.room.RoomState;

import java.util.List;

@Getter
@Builder
public class RoomSearchCriteria {
    @NonNull
    private RedisIndex redisIndex;
    private String keyword;
    @NonNull
    List<RoomState> roomStates;
    @Builder.Default
    int pageNum = 0; // 기본값
    @Builder.Default
    int pageSize = 100; // 기본값
}

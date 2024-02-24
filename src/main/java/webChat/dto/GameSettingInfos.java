package webChat.dto;

import lombok.Data;

import java.util.List;

@Data
public class GameSettingInfos {
    String roomId;
    int maxGameCount;
    List<CatchMindUser> gameUserList;
}

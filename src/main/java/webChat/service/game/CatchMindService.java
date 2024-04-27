package webChat.service.game;

import webChat.dto.game.*;

import java.util.List;

public interface CatchMindService {
    GameTitles getTitles() throws Exception;
    GameSubjects getSubjects(GameSubjects gameSubjects) throws Exception;
    void setGameSettingInfo(GameSettingInfos gameSettingInfos);

    CatchMindUser updateUser(GameStatus gameStatus, String roomId, String userId);

    List<CatchMindUser> getGameUserInfos(String roomId);

    boolean chkDuplicateNickName(String nickName);
}

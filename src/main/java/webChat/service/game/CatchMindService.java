package webChat.service.game;

import webChat.dto.game.*;

import java.util.List;
import java.util.Map;

public interface CatchMindService {
    boolean chkAlradyPlayedGame(String roomId);
    GameTitles getTitles() throws Exception;
//    List<String> getBeforeSubjects(GameSettingInfo gameSettingInfo, String title);
    GameSubjects getSubjects(String roomId, GameSubjects gameSubjects) throws Exception;
    void setGameSettingInfo(GameSettingInfo gameSettingInfo);

    CatchMindUser updateUser(GameStatus gameStatus, String roomId, String userId);

    List<CatchMindUser> getGameUserInfos(String roomId);

    boolean chkDuplicateNickName(String nickName);

    GameSettingInfo getGameResult(String roomId);
}

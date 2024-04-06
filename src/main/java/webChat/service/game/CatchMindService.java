package webChat.service.game;

import webChat.dto.game.CatchMindUser;
import webChat.dto.game.GameStatus;
import webChat.dto.game.GameSettingInfos;

import java.util.List;

public interface CatchMindService {
    void setGameParticipants(GameSettingInfos gameSettingInfos);

    CatchMindUser updateUser(GameStatus gameStatus, String roomId, String userId);

    List<CatchMindUser> getGameUserInfos(String roomId);

    boolean chkDuplicateNickName(String nickName);
}

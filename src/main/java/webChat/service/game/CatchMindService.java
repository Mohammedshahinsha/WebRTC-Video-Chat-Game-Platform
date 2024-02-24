package webChat.service.game;

import webChat.dto.CatchMindUser;
import webChat.dto.GameStatus;
import webChat.dto.GameSettingInfos;

import java.util.List;

public interface CatchMindService {
    void setGameParticipants(GameSettingInfos gameSettingInfos);

    CatchMindUser updateUser(GameStatus gameStatus, String roomId, String userId);

    List<CatchMindUser> getGameUserInfos(String roomId);

    boolean chkDuplicateNickName(String nickName);
}

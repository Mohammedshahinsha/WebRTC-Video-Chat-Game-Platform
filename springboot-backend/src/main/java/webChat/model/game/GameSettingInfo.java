package webChat.model.game;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class GameSettingInfo {
    String roomId; // 방 아이디
    int totalGameRound; // 총 게임 라운드
    int gameRound; // 현재 게임 라운드
    List<CatchMindUserDto> gameUserList; // 참여하는 유저
    List<String> subjects; // 게임 주제
    Map<String, List<String>> beforeSubjects; // 이전 게임 주제
    boolean alreadyPlayedGame;

    /**
     * TODO
     * 백엔드에서 대주제 api 한번 -> titles :: 백엔드에서 값을 갖고있기 때문에 중복 확인 가능
     * 프론트에서는 소주제 api 한번 -> subjects :: 상동
     */

    public void newGameRound(){
        this.gameRound +=1;
    }
}

package webChat.service.game.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import webChat.dto.*;
import webChat.service.game.CatchMindService;

import java.util.*;

@Service
public class CatchMindServiceImpl implements CatchMindService {

    private final int WINNER_SCORE = 100;
    private final int MORE_TIME_SCORE = 50;
    private final int TOO_MANY_FAIL_SCORE = -50;

    private static final Logger log = LoggerFactory.getLogger(CatchMindServiceImpl.class);

    @Override
    public void setGameParticipants(GameSettingInfos gameSettingInfos) {
        String roomId = gameSettingInfos.getRoomId();

        KurentoRoomDto room = (KurentoRoomDto) ChatRoomMap.getInstance().getChatRooms().get(roomId);
        room.setGameSettingInfos(gameSettingInfos);
        log.info(">>>> CatchMind Game is Ready To GO");
    }

    @Override
    public CatchMindUser updateUser(GameStatus gameStatus, String roomId, String userId) {
        KurentoRoomDto room = (KurentoRoomDto) ChatRoomMap.getInstance().getChatRooms().get(roomId);
        // TODO 예외처리 필요
        if (Objects.isNull(room)) {

        }

        GameSettingInfos gameSettingInfos = room.getGameSettingInfos();
        int maxGameCount = gameSettingInfos.getMaxGameCount();
        List<CatchMindUser> catchMindUserList = gameSettingInfos.getGameUserList();
        // TODO 예외처리 필요
        if (CollectionUtils.isEmpty(catchMindUserList)) {

        }

        Optional<CatchMindUser> user = catchMindUserList.stream()
                .filter(u -> {
                    return u.getUserId().equals(userId);
                }).findFirst();

        if (!user.isPresent()) {
            // TODO 예외처리하기
        }

        CatchMindUser catchMindUser = user.get();
        switch (gameStatus){
            case WINNER:
                updateUserScore(catchMindUser, this.WINNER_SCORE);
                int updatedWinCount = catchMindUser.getWinCount()+1;
                catchMindUser.setWinCount(updatedWinCount);
                if (updatedWinCount == maxGameCount) {
                    catchMindUser.setWiner(true);
                }
                break;

            case MORE_TIME:
                updateUserScore(catchMindUser, this.MORE_TIME_SCORE);
                break;

            case TOO_MANY_FAIL:
                updateUserScore(catchMindUser, this.TOO_MANY_FAIL_SCORE);
                break;
        }
        return catchMindUser;
    }

    @Override
    public List<CatchMindUser> getGameUserInfos(String roomId) {
        KurentoRoomDto kurentoRoom = (KurentoRoomDto) ChatRoomMap.getInstance().getChatRooms().get(roomId);
        List<CatchMindUser> gameUserList = kurentoRoom.getGameSettingInfos().getGameUserList();

        return gameUserList;
    }

    @Override
    public boolean chkDuplicateNickName(String nickName) {
        return false;
    }

    private void updateUserScore(CatchMindUser catchMindUser, int score){
        int updatedScore = catchMindUser.getScore()+score;
        catchMindUser.setScore(updatedScore);
        log.info(">>>> Round Winner and Get Score!! => {} :: {}", catchMindUser.getNickName(), catchMindUser.getScore());
    }

}

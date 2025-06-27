package webChat.service.game.impl;

import com.google.common.collect.Lists;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import webChat.config.CatchMindConfig;
import webChat.controller.ExceptionController;
import webChat.model.game.*;
import webChat.model.redis.DataType;
import webChat.model.room.KurentoRoom;
import webChat.service.game.CatchMindService;
import webChat.service.redis.RedisService;
import webChat.utils.HttpUtil;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatchMindServiceImpl implements CatchMindService {

    private final int WINNER_SCORE = 100;
    private final int MORE_TIME_SCORE = 50;
    private final int TOO_MANY_FAIL_SCORE = -50;

    private final CatchMindConfig catchMindAPI;
    private final RedisService redisService;

    @Value("${catchmind.python.api.titles}")
    private String gameTitleUrl;

    @Value("${catchmind.python.api.subjects}")
    private String gameSubjectUrl;

    // python 서버와 통신 후 예외가 발생하는 경우 titles 대체를 위한 list
    private final List<String> TITLES_EX = Lists.newArrayList("동물","식물","애니메이션","게임","영화");

    @Override
    public boolean chkAlreadyPlayedGame(String roomId) throws BadRequestException {
        KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
        if (Objects.isNull(kurentoRoom)) {
            throw new ExceptionController.BadRequestException("Room not found with ID: " + roomId);
        }
        if (Objects.nonNull(kurentoRoom.getGameSettingInfo()) && kurentoRoom.getGameSettingInfo().isAlreadyPlayedGame()) {
            return true;
        }
        return false;
    }

    @Override
    public GameTitles getTitles() {
        GameTitles titles = null;
        try{
            titles = HttpUtil.get(catchMindAPI.getUrl()+ gameTitleUrl, new HttpHeaders(), new ConcurrentHashMap<>(), GameTitles.class);
            log.info("titles :: {}",titles.toString());
            return titles;
        } catch (Exception e){ // 예외 발생 시 기본 리스트를 반환
            e.printStackTrace();
            titles = new GameTitles(TITLES_EX);
            return titles;
        }
    }

    @Override
    public GameSubjects getSubjects(String roomId, GameSubjects gameSubjects) {

        try{
            KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
            GameSettingInfo gameSettingInfo = kurentoRoom.getGameSettingInfo();
            if (Objects.isNull(gameSettingInfo)) {
                gameSettingInfo = new GameSettingInfo();
                gameSettingInfo.setRoomId(roomId);
                kurentoRoom.setGameSettingInfo(gameSettingInfo);
            }
            setBeforeSubjects(gameSettingInfo, gameSubjects);
            gameSubjects = HttpUtil.post(catchMindAPI.getUrl()+ gameSubjectUrl, new HttpHeaders(), new ConcurrentHashMap<>(), gameSubjects, GameSubjects.class);
            gameSubjects.getBeforeSubjects().addAll(gameSubjects.getSubjects());
            gameSettingInfo.getBeforeSubjects().put(gameSubjects.getTitle(), gameSubjects.getBeforeSubjects());
            log.info("subjects :: {}",gameSubjects.toString());

            redisService.updateChatRoom(kurentoRoom);
            return gameSubjects;
        } catch (Exception e){ // 예외 발생 시 기본 리스트를 반환
            e.printStackTrace();
//            subjects = new GameTitles(TITLES_EX);
            return gameSubjects;
        }
    }

    @Override
    public void setGameSettingInfo(GameSettingInfo gameSettingInfo) {
        String roomId = gameSettingInfo.getRoomId();
        try {
            KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
            GameSettingInfo gameInfo = kurentoRoom.getGameSettingInfo();
            gameInfo.setGameUserList(gameSettingInfo.getGameUserList());
            // TODO 추후에는 선택할 수 있게 하지만 현재는 3 라운드로 고정
            gameInfo.setTotalGameRound(3);
            gameInfo.setGameRound(gameSettingInfo.getGameRound());
            redisService.updateChatRoom(kurentoRoom);
            log.info(">>>> CatchMind Game is Ready To GO");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public CatchMindUserDto updateUser(GameStatus gameStatus, String roomId, String userId) throws BadRequestException {
        KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
        // TODO 예외처리 필요
        if (Objects.isNull(kurentoRoom)) {
            throw new ExceptionController.BadRequestException("Room not found with ID: " + roomId);
        }

        GameSettingInfo gameSettingInfo = kurentoRoom.getGameSettingInfo();
        List<CatchMindUserDto> catchMindUserList = gameSettingInfo.getGameUserList();
        if (CollectionUtils.isEmpty(catchMindUserList)) {
            // TODO 예외처리 필요
        }

        Optional<CatchMindUserDto> user = catchMindUserList.stream()
                .filter(u -> {
                    return u.getUserId().equals(userId);
                }).findFirst();

        if (user.isEmpty()) {
            // TODO 예외처리하기
            throw new ExceptionController.BadRequestException("User not found with ID: " + userId);
        }

        CatchMindUserDto catchMindUser = user.get();
        switch (gameStatus){
            case WINNER:
                updateUserScore(catchMindUser, this.WINNER_SCORE);
                catchMindUser.setWinCount(catchMindUser.getWinCount()+1);
                gameSettingInfo.newGameRound(); // winner 가 있는 경우만 라운드+1
                break;
            case MORE_TIME:
                updateUserScore(catchMindUser, this.MORE_TIME_SCORE);
                break;

            case TOO_MANY_FAIL:
                updateUserScore(catchMindUser, this.TOO_MANY_FAIL_SCORE);
                break;
        }
        redisService.updateChatRoom(kurentoRoom);
        return catchMindUser;
    }

    @Override
    public List<CatchMindUserDto> getGameUserInfos(String roomId) throws BadRequestException {
        KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);
        List<CatchMindUserDto> gameUserList = kurentoRoom.getGameSettingInfo().getGameUserList();

        return gameUserList;
    }

    @Override
    public boolean chkDuplicateNickName(String nickName) {
        return false;
    }

    @Override
    public GameSettingInfo getGameResult(String roomId) throws BadRequestException {
        KurentoRoom kurentoRoom = redisService.getRedisDataByDataType(roomId, DataType.CHATROOM, KurentoRoom.class);

        // 게임 라운드 확인 및 결과 보내주기
        GameSettingInfo gameSettingInfo = kurentoRoom.getGameSettingInfo();
        if (CollectionUtils.isEmpty(gameSettingInfo.getGameUserList())) {
            // TODO 예외처리 필요
        }

        // 게임 라운드와 전체 라운드가 일치하지 않는 경우
        // 프론트와 서버 간 라운드 정보가 일치하지 않는 경우 일치를 위한  Exception
        if (gameSettingInfo.getGameRound() != gameSettingInfo.getTotalGameRound()) {
            throw new ExceptionController.SyncGameRound(String.valueOf(gameSettingInfo.getGameRound()));
        }

        // score 비교 로직 수행
        // score 와 wincount 에 가산해서 비교
        gameSettingInfo.getGameUserList().sort((u1, u2) -> {
            int score1 = u1.getScore() + u1.getWinCount() * 100;
            int score2 = u2.getScore() + u2.getWinCount() * 100;
            return Integer.compare(score2, score1); // 내림차순 정렬
        });

        gameSettingInfo.getGameUserList().get(0).setWiner(true);
        gameSettingInfo.setAlreadyPlayedGame(true);
        redisService.updateChatRoom(kurentoRoom);
        return gameSettingInfo;
    }

    private void updateUserScore(CatchMindUserDto catchMindUser, int score){
        int updatedScore = catchMindUser.getScore()+score;
        catchMindUser.setScore(updatedScore);
        log.info(">>>> Round Winner and Get Score!! => {} :: {}", catchMindUser.getNickName(), catchMindUser.getScore());
    }

    private void setBeforeSubjects(GameSettingInfo gameSettingInfo, GameSubjects gameSubjects) {
        if (CollectionUtils.isEmpty(gameSettingInfo.getBeforeSubjects())) {
            Map<String, List<String>> beforeSubjects = new ConcurrentHashMap<>();
            beforeSubjects.put(gameSubjects.getTitle(), Collections.emptyList());
            gameSettingInfo.setBeforeSubjects(beforeSubjects);
            gameSubjects.setBeforeSubjects(Collections.emptyList());
        } else {
            List<String> beforeSubjects = gameSettingInfo.getBeforeSubjects()
                    .getOrDefault(gameSubjects.getTitle(), Collections.emptyList());
            gameSubjects.setBeforeSubjects(beforeSubjects);
        }
    }
}

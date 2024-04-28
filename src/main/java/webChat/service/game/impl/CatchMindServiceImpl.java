package webChat.service.game.impl;

import com.google.common.collect.Lists;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import webChat.config.CatchMindConfig;
import webChat.controller.ExceptionController;
import webChat.dto.game.*;
import webChat.dto.room.ChatRoomMap;
import webChat.dto.room.KurentoRoomDto;
import webChat.service.game.CatchMindService;
import webChat.utils.HttpUtil;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class CatchMindServiceImpl implements CatchMindService {

    private final int WINNER_SCORE = 100;
    private final int MORE_TIME_SCORE = 50;
    private final int TOO_MANY_FAIL_SCORE = -50;

    private final CatchMindConfig catchMindAPI;

    @Value("${catchmind.python.api.titles}")
    private String gameTitleUrl;

    @Value("${catchmind.python.api.subjects}")
    private String gameSubjectUrl;

    // python 서버와 통신 후 예외가 발생하는 경우 - 통신, 파싱 등 -
    // titles 대체를 위한 list
    private final List<String> TITLES_EX = Lists.newArrayList("동물","식물","애니메이션","게임","영화");

    private static final Logger log = LoggerFactory.getLogger(CatchMindServiceImpl.class);

    @Override
    public boolean chkAlradyPlayedGame(String roomId) {
        KurentoRoomDto room = (KurentoRoomDto)ChatRoomMap.getInstance().getChatRooms().get(roomId);
        if (Objects.isNull(room)) {
            // TODO 예외처리

        }
        if (Objects.nonNull(room.getGameSettingInfos()) && room.getGameSettingInfos().isAlreadyPlayedGame()) {
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
            titles = new GameTitles(TITLES_EX);
            return titles;
        }
    }

    @Override
    public GameSubjects getSubjects(GameSubjects gameSubjects) throws Exception {

        try{
            gameSubjects = HttpUtil.post(catchMindAPI.getUrl()+ gameSubjectUrl, new HttpHeaders(), new ConcurrentHashMap<>(), gameSubjects, GameSubjects.class);
            log.info("titles :: {}",gameSubjects.toString());
            return gameSubjects;
        } catch (Exception e){ // 예외 발생 시 기본 리스트를 반환
//            subjects = new GameTitles(TITLES_EX);
            return gameSubjects;
        }
    }

    @Override
    public void setGameSettingInfo(GameSettingInfos gameSettingInfos) {
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
                catchMindUser.setWinCount(catchMindUser.getWinCount()+1);
                gameSettingInfos.newGameRound(); // winner 가 있는 경우만 라운드+1
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

    @Override
    public GameSettingInfos getGameResult(String roomId) {
        KurentoRoomDto room = (KurentoRoomDto) ChatRoomMap.getInstance().getChatRooms().get(roomId);

        // 게임 라운드 확인 및 결과 보내주기
        GameSettingInfos gameSettingInfos = room.getGameSettingInfos();
        if (CollectionUtils.isEmpty(gameSettingInfos.getGameUserList())) {
            // TODO 예외처리 필요
        }

        // 게임 라운드와 전체 라운드가 일치하지 않는 경우
        // 프론트와 서버 간 라운드 정보가 일치하지 않는 경우 일치를 위한  Exception
        if (gameSettingInfos.getGameRound() != gameSettingInfos.getTotalGameRound()) {
            throw new ExceptionController.SyncGameRound(String.valueOf(gameSettingInfos.getGameRound()));
        }

        // score 비교 로직 수행
        // score 와 wincount 에 가산해서 비교
        gameSettingInfos.getGameUserList().sort((u1, u2) -> {
            int score1 = u1.getScore() + u1.getWinCount() * 100;
            int score2 = u2.getScore() + u2.getWinCount() * 100;
            return Integer.compare(score2, score1); // 내림차순 정렬
        });

        gameSettingInfos.getGameUserList().get(0).setWiner(true);
        gameSettingInfos.setAlreadyPlayedGame(true);

        return gameSettingInfos;
    }

    private void updateUserScore(CatchMindUser catchMindUser, int score){
        int updatedScore = catchMindUser.getScore()+score;
        catchMindUser.setScore(updatedScore);
        log.info(">>>> Round Winner and Get Score!! => {} :: {}", catchMindUser.getNickName(), catchMindUser.getScore());
    }

}

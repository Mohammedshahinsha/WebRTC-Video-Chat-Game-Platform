package webChat.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.*;
import webChat.dto.game.*;
import webChat.dto.room.ChatRoomMap;
import webChat.dto.room.KurentoRoomDto;
import webChat.service.game.CatchMindService;

import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequiredArgsConstructor
public class CatchMindController {

    private final CatchMindService catchMindService;

    private static final Logger log = LoggerFactory.getLogger(CatchMindController.class);

    @GetMapping(value = "/catchmind/titles", produces = "application/json; charset=UTF8")
    public GameTitles getGameTitles() throws Exception {
        log.info(">>>>>>> Successfully Get Game Titles!! <<<<<<<");
        GameTitles gameTitles = catchMindService.getTitles();
        return gameTitles;
    }

    @PostMapping(value = "/catchmind/subjects", produces = "application/json; charset=UTF8")
    public GameSubjects getGameSubjects(@RequestBody GameSubjects gameSubjects) throws Exception {
        log.info(">>>>>>> Successfully Get Game Subjects!! <<<<<<<");
        gameSubjects = catchMindService.getSubjects(gameSubjects);
        return gameSubjects;
    }

    @PostMapping(value = "/catchmind/gameSetting", produces = "application/json; charset=UTF8")
    public Map<String, String> initGameEnv(
            @RequestBody GameSettingInfos gameSettingInfos) {
        catchMindService.setGameSettingInfo(gameSettingInfos);
        Map<String, String> result = new ConcurrentHashMap<>();
        result.put("result", "success");
        log.info(">>>>>>> GameSetting Success!! <<<<<<<");
        return result;
    }

    @PostMapping(value = "/catchmind/updateGameStatus", produces = "application/json; charset=UTF8")
    public Map<String, String> updateGameStatus(
            @RequestBody GameStatusRequest gameStatusRequest) {
        Map<String, String> result = new ConcurrentHashMap<>();
        CatchMindUser catchMindUser = catchMindService.updateUser(gameStatusRequest.getGameStatus(), gameStatusRequest.getRoomId(), gameStatusRequest.getUserId());
        result.put("result", "success");
        result.put("nickName", catchMindUser.getNickName());
        return result;
    }

    @GetMapping(value = "/catchmind/gameResult", produces = "application/json; charset=UTF8")
    public Map<String, Object> gameResult(
            @RequestParam("roomId") String roomId
    ) {
        Map<String, Object> result = new ConcurrentHashMap<>();
        KurentoRoomDto chatRoomDto = (KurentoRoomDto) ChatRoomMap.getInstance().getChatRooms().get(roomId);


        // 게임 라운드 확인 및 결과 보내주기
        GameSettingInfos gameSettingInfos = chatRoomDto.getGameSettingInfos();
        if (CollectionUtils.isEmpty(gameSettingInfos.getGameUserList())) {
            // TODO 예외처리 필요
        }

        if (gameSettingInfos.getGameRound() != gameSettingInfos.getTotalGameRound()) {
            result.put("result", "SyncGameRound");
            result.put("message", "Syncing game round info.");
            result.put("gameRound", gameSettingInfos.getGameRound());
        }

        // score 비교 로직 수행
        // score 와 wincount 에 가산해서 비교
        gameSettingInfos.getGameUserList().sort(new Comparator<CatchMindUser>() {
            @Override
            public int compare(CatchMindUser u1, CatchMindUser u2) {
                int score1 = u1.getScore() + u1.getWinCount() * 100;
                int score2 = u2.getScore() + u2.getWinCount() * 100;
                return Integer.compare(score2, score1); // 내림차순 정렬
            }
        });

        result.put("result", "success");
        result.put("message", "Game has successfully concluded");
        result.put("gameResult", gameSettingInfos);


        return result;
    }
}
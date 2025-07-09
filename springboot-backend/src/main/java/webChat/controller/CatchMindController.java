package webChat.controller;

import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import webChat.model.game.*;
import webChat.service.game.CatchMindService;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chatforyou/api")
public class CatchMindController {

    private final CatchMindService catchMindService;

    private static final Logger log = LoggerFactory.getLogger(CatchMindController.class);

    @GetMapping(value = "/catchmind/titles", produces = "application/json; charset=UTF8")
    public GameTitles getGameTitles(@RequestParam("roomId") String roomId) throws Exception {
        log.info(">>>>>>> Successfully Get Game Titles!! <<<<<<<");
        if (catchMindService.chkAlreadyPlayedGame(roomId)) {
            throw new ExceptionController.AlreadyPlayedGameException("already played game");
        }
        return catchMindService.getTitles();
    }

    @PostMapping(value = "/catchmind/subjects", produces = "application/json; charset=UTF8")
    public GameSubjects getGameSubjects(@RequestParam("roomId") String roomId, @RequestBody GameSubjects gameSubjects) throws Exception {
        log.info(">>>>>>> Successfully Get Game Subjects!! <<<<<<<");
        gameSubjects = catchMindService.getSubjects(roomId, gameSubjects);
        return gameSubjects;
    }

    @PostMapping(value = "/catchmind/gameSetting", produces = "application/json; charset=UTF8")
    public Map<String, String> initGameEnv(
            @RequestBody GameSettingInfo gameSettingInfo) {
        catchMindService.setGameSettingInfo(gameSettingInfo);
        Map<String, String> result = new ConcurrentHashMap<>();
        result.put("result", "success");
        log.info(">>>>>>> GameSetting Success!! <<<<<<<");
        return result;
    }

    @PostMapping(value = "/catchmind/updateGameStatus", produces = "application/json; charset=UTF8")
    public Map<String, String> updateGameStatus(
            @RequestBody GameStatusRequest gameStatusRequest) throws BadRequestException {
        Map<String, String> result = new ConcurrentHashMap<>();
        CatchMindUserDto catchMindUser = catchMindService.updateUser(gameStatusRequest.getGameStatus(), gameStatusRequest.getRoomId(), gameStatusRequest.getUserId());
        result.put("result", "success");
        result.put("nickName", catchMindUser.getNickName());
        return result;
    }

    @GetMapping(value = "/catchmind/gameResult", produces = "application/json; charset=UTF8")
    public Map<String, Object> gameResult(@RequestParam("roomId") String roomId) throws BadRequestException, ExceptionController.SyncGameRound {
        Map<String, Object> result = new ConcurrentHashMap<>();

        result.put("result", "success");
        result.put("message", "Game has successfully concluded");
        result.put("gameResult", catchMindService.getGameResult(roomId));

        return result;
    }
}
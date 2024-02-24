package webChat.controller;

import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import webChat.dto.CatchMindUser;
import webChat.dto.GameSettingInfos;
import webChat.dto.GameStatus;
import webChat.service.game.CatchMindService;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequiredArgsConstructor
public class CatchMindController {

    private final CatchMindService catchMindService;

    private static final Logger log = LoggerFactory.getLogger(CatchMindController.class);

    @PostMapping(value = "/catchmind/participants", produces="application/json; charset=UTF8")
    public Map<String, String> initGameEnv(
            @RequestBody GameSettingInfos gameSettingInfos){
        catchMindService.setGameParticipants(gameSettingInfos);
        Map<String, String> result = new ConcurrentHashMap<>();
        result.put("result", "success");
        result.put("info", "gameSetting Success");
        return result;
    }

    @PostMapping(value="/catchmind/updateGameStatus", produces="application/json; charset=UTF8")
    public Map<String, String> updateGameStatus(
            @RequestBody GameStatusRequest gameStatusRequest){
        Map<String, String> result = new ConcurrentHashMap<>();
        CatchMindUser catchMindUser = catchMindService.updateUser(gameStatusRequest.getGameStatus(), gameStatusRequest.getRoomId(), gameStatusRequest.getUserId());
        result.put("result", "success");
        result.put("nickName", catchMindUser.getNickName());
        return result;
    }
}

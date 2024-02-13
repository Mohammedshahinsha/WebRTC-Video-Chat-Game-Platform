package webChat.controller;

import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import webChat.dto.CatchMindUser;
import webChat.dto.ChatRoomDto;
import webChat.dto.ChatRoomMap;
import webChat.dto.KurentoRoomDto;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
public class CatchMindController {

    @PostMapping("/catchmind/participants")
    public Map<String, String> setGameParticipants(
            @RequestParam("roomName") String roomName,
            @RequestParam("userName") String userName,
            @RequestParam("nickName") String nickName){

        KurentoRoomDto room = (KurentoRoomDto) ChatRoomMap.getInstance().getChatRooms().get(roomName);
        Map<String, CatchMindUser> catchMindMap = room.getCatchMindUserMap();
        if (Objects.isNull(catchMindMap)) {
            catchMindMap = new HashMap<>();
        }

        CatchMindUser gameUser = CatchMindUser.builder()
                .roomName(roomName)
                .userName(userName)
                .nickName(nickName)
                .isWiner(false)
                .winCount(0)
                .score(0)
                .build();

        catchMindMap.put(userName, gameUser);

        return null;
    }
}

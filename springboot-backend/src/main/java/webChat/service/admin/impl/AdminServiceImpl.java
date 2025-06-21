package webChat.service.admin.impl;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import webChat.model.room.ChatRoomMap;
import webChat.model.room.KurentoRoom;
import webChat.service.admin.AdminService;
import webChat.service.chatroom.ChatRoomService;
import webChat.service.file.FileService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final FileService fileService;
    private final ChatRoomService chatRoomService;

    @Override
    public Map<String, Object> getAllRooms() {
        Map<String, Object> result = new HashMap<>();

        JsonArray joRooms = new JsonArray();
        ChatRoomMap.getInstance().getChatRooms().values()
                .forEach(room -> {
                    JsonObject joRoom = new JsonObject();
                    joRoom.addProperty("id", room.getRoomId());
                    joRoom.addProperty("name", room.getRoomName());
                    joRoom.addProperty("pwd", room.getRoomPwd());
                    joRoom.addProperty("isSecret", room.isSecretChk());
                    joRoom.addProperty("type", room.getChatType().toString());
                    joRoom.addProperty("count", room.getUserCount());

                    joRooms.add(joRoom);
                });

        result.put("roomList", joRooms);
        return result;
    }

    @Override
    public String delRoom(String roomId) {
        Optional<KurentoRoom> kurentoRoom = Optional
                .ofNullable((KurentoRoom) ChatRoomMap.getInstance().getChatRooms().get(roomId));

        if (kurentoRoom.isPresent()) {
            kurentoRoom.get().deactivate();
            return "success del chatroom";
        }

        // room 안에 있는 파일 삭제
        fileService.deleteFileDir(roomId);

        return "no such room exist";
    }
}
package webChat.service.chatroom.participant;

import org.springframework.web.socket.WebSocketSession;
import webChat.service.kurento.KurentoUserSession;

import java.util.Collection;
import java.util.Map;

public interface KurentoParticipantService {
    Map<String, KurentoUserSession> getParticipantMap(String roomId);

    Collection<KurentoUserSession> getParticipantList(String roomId);

    KurentoUserSession getParticipant(String roomId, String userId);

    void addParticipant(String roomId, KurentoUserSession participant);

    KurentoUserSession removeParticipant(String roomId, String userId);

    void removeRoom(String roomId);

    int getParticipantCount(String roomId);

    Collection<String> getParticipantIds(String roomId);

    KurentoUserSession getBySessionId(WebSocketSession session);
}

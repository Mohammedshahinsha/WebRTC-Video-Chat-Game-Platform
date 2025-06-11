/*
 * Copyright 2023 SejonJang (wkdtpwhs@gmail.com)
 *
 * Licensed under the  GNU General Public License v3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package webChat.service.kurento;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import org.kurento.client.KurentoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;
import webChat.controller.ExceptionController;
import webChat.model.chat.ChatType;
import webChat.model.room.ChatRoom;
import webChat.model.room.ChatRoomMap;
import webChat.model.room.KurentoRoom;
import webChat.model.room.in.ChatRoomInVo;
import webChat.rtc.KurentoUserSession;
import webChat.service.analysis.AnalysisService;
import webChat.service.chat.ChatRoomService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * @modifyBy SeJon Jang (wkdtpwhs@gmail.com)
 * @Desc KuirentoRoom 을 관리하기 위한 클래스
 */
@Service
@RequiredArgsConstructor
public class KurentoManager {

  // 로깅을 위한 객체 생성
  private final Logger log = LoggerFactory.getLogger(KurentoManager.class);

  private final ChatRoomService chatRoomService;

  // 사이트 통계를 위한 서비스
  private final AnalysisService analysisService;

  // kurento 미디어 서버 연결을 위한 객체 생성?
  private final KurentoClient kurento;

  // roomName 로 채팅방 만들기
  public ChatRoom createChatRoom(ChatRoomInVo chatRoomInVo) {

    chatRoomService.validateRoomInfo(chatRoomInVo.getRoomName(), chatRoomInVo.getMaxUserCnt());

    if(ChatType.RTC.equals(chatRoomInVo.getRoomType())) {
      analysisService.increaseDailyRoomCnt();
      return this.createKurentoRoom(chatRoomInVo.getRoomName(), chatRoomInVo.getRoomPwd(), chatRoomInVo.isSecretChk(), chatRoomInVo.getMaxUserCnt());
    } else {
      throw new ExceptionController.BadRequestException("room type is not exist : " + chatRoomInVo.getRoomType());
    }
  }

  /**
   * @desc 유저가 room 에 join 할때 사용
   * @Param String userName, WebSocketSession session
   * @return UserSession 객체
   * */
  public KurentoUserSession join(KurentoRoom room, String userId, String nickName, WebSocketSession session) throws IOException {

    log.info("ROOM {}: adding participant {}", room.getRoomId(), userId);

    // UserSession 은 유저명, room명, 유저 세션정보, pipline 파라미터로 받음
    final KurentoUserSession participant = new KurentoUserSession(userId, nickName, room.getRoomId(), session, room.getPipeline());

    // room 에 userSession 추가
    this.joinRoom(room, participant);

    // 참여자 map 에 유저명과 유저에 관한 정보를 갖는 userSession 객체를 저장
    room.getParticipants().put(participant.getUserId(), participant);

    // 참여자 정보를 기존 참여자들에게 알림
    this.sendParticipantNames(room, participant);

    // 방에 참여한 사람 수 +1
    chatRoomService.plusUserCnt(room.getRoomId());

    // 참여자 정보 return
    return participant;
  }

  /**
   * room 에서 user 제거 및 user 연결 close
   * @param room
   * @param user
   * @throws IOException
   */
  public void leave(KurentoRoom room, KurentoUserSession user) throws IOException {
    log.debug("PARTICIPANT {}: Leaving room {}", user.getUserId(), room.getRoomId());
    this.removeParticipant(room, user.getUserId());
    chatRoomService.minusUserCnt(user.getRoomId());
    user.close();
  }

  /**
   * @Desc userSession 을 room 에 저장하기 위한 메서드
   * @Param UserSession newParticipant => 새로운 유저
   * @Return List<String 유저명>
   * */
  
  private Collection<String> joinRoom(KurentoRoom room, KurentoUserSession newParticipant) throws IOException {
    // JsonObject 를 생성
    final JsonObject newParticipantMsg = new JsonObject();

    // 유저가 참여했음을 알리는 jsonObject
    // newParticipantMsg : { "id" : "newParticipantArrived", "name" : "참여자 유저명"}
    newParticipantMsg.addProperty("id", "newParticipantArrived");
    JsonObject joNewParticipant = new JsonObject();
    joNewParticipant.addProperty("userId", newParticipant.getUserId());
    joNewParticipant.addProperty("nickName", newParticipant.getNickName());
    newParticipantMsg.add("data", joNewParticipant);

    // participants 를 list 형태로 변환 => 이때 list 는 한명의 유저가 새로 들어올 때마다
    // 즉 joinRoom 이 실행될 때마다 새로 생성 && return 됨
    final List<String> participantsList = new ArrayList<>(room.getParticipants().size());
//    log.debug("ROOM {}: notifying other participants of new participant {}", name,
//        newParticipant.getName());
    log.debug("ROOM {}: 다른 참여자들에게 새로운 참여자가 들어왔음을 알림 {} :: {}", room.getRoomId(),
            newParticipant.getUserId(), newParticipant.getNickName());

    // participants 의 value 로 for 문 돌림
    for (final KurentoUserSession participant : room.getUserSessions()) {
      try {
        // 현재 방의 모든 참여자들에게 새로운 참여자가 입장해서 만들어지는 json 객체
        // 즉, newParticipantMsg 를 send함
        participant.sendMessage(newParticipantMsg);
      } catch (final IOException e) {
        log.error("ROOM {}: participant {} could not be notified", room.getRoomId(), participant.getUserId(), e);
      }

      // list 에 유저명 추가
      participantsList.add(participant.getUserId());
    }

    // 유저 리스트를 return
    return participantsList;
  }

  /**
   * @Desc 유저가 제거되었을 때 이벤트 처리 => 즉 유저가 방에서 나갔을 때 이벤트 처리
   * @Param String name
   * @Return none
   * */
  
  private void removeParticipant(KurentoRoom room, String name) throws IOException {

    // participants map 에서 제거된 유저 - 방에서 나간 유저 - 를 제거함
    room.getParticipants().remove(name);

    log.debug("ROOM {}: notifying all users that {} is leaving the room", room.getRoomId(), name);

    // String list 생성
    final List<String> unNotifiedParticipants = new ArrayList<>();

    // json 객체 생성
    final JsonObject participantLeftJson = new JsonObject();

    // json 객체에 유저가 떠났음을 알리는 jsonObject
    // newParticipantMsg : { "id" : "participantLeft", "name" : "참여자 유저명"}
    participantLeftJson.addProperty("id", "participantLeft");
    participantLeftJson.addProperty("name", name);

    // participants 의 value 로 for 문 돌림
    for (final KurentoUserSession participant : room.getUserSessions()) {
      try {
        // 나간 유저의 video 를 cancel 하기 위한 메서드
        participant.cancelVideoFrom(name);

        // 다른 유저들에게 현재 유저가 나갔음을 알리는 jsonMsg 를 전달
        participant.sendMessage(participantLeftJson);

      } catch (final IOException e) {
        unNotifiedParticipants.add(participant.getUserId());
      }
    }

    // 만약 unNotifiedParticipants 가 비어있지 않다면
    if (!unNotifiedParticipants.isEmpty()) {
      log.debug("ROOM {}: The users {} could not be notified that {} left the room", room.getRoomId(),
              unNotifiedParticipants, name);
    }

  }

  /**
   * @Desc 새로운 참여자 있음을 기존 참여자에게 알림
   * @Param UserSession 유저
   * @Return none
   * */
  
  public void sendParticipantNames(KurentoRoom room, KurentoUserSession user) throws IOException {

    // json 오브젝트 생성
    final JsonObject existingParticipantsMsg = new JsonObject();

    // jsonArray 객체 생성
    // TODO 추후 DTO 객체로 변경 필요
    final JsonArray participantsArray = new JsonArray();

    // participants 의 value 만 return 받아서 => this.getParticipants() for 문 돌림
    for (final KurentoUserSession participant : room.getUserSessions()) {
      // 만약 참여자의 정보가 파라미터로 넘어온 user 와 같지 않다면
      if (!participant.getUserId().equals(user.getUserId())) {
        JsonObject exisingUser = new JsonObject();
        exisingUser.addProperty("userId", participant.getUserId());
        exisingUser.addProperty("nickName", participant.getNickName());

        participantsArray.add(exisingUser);
      }
    }

    // 현재 존재하는 참여자들에 대한 정보를 담는 json Msg 생성
    // id : existingParticipants
    // data : 현재 방 안에 존재하는 유저만을 담은 array
    existingParticipantsMsg.addProperty("id", "existingParticipants");
    existingParticipantsMsg.add("data", participantsArray);
    log.debug("PARTICIPANT {}: sending a list of {} participants", user.getUserId(), participantsArray.size());

    // user 에게 existingParticipantsMsg 전달
    user.sendMessage(existingParticipantsMsg);
  }

  private KurentoRoom createKurentoRoom(String roomName, String roomPwd, boolean secretChk, int maxUserCnt) {

    KurentoRoom room = new KurentoRoom(UUID.randomUUID().toString(), roomName, roomPwd, secretChk, 0, maxUserCnt, ChatType.RTC, kurento);;

    // map 에 채팅룸 아이디와 만들어진 채팅룸을 저장
    ChatRoomMap.getInstance().getChatRooms().put(room.getRoomId(), room);

    return room;
  }

}
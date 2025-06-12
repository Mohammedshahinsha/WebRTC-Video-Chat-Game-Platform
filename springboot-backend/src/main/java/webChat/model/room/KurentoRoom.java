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

package webChat.model.room;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.kurento.client.Continuation;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import webChat.model.chat.ChatType;
import webChat.model.game.GameSettingInfo;
import webChat.rtc.KurentoUserSession;

import javax.annotation.PreDestroy;
import java.io.Closeable;
import java.io.IOException;
import java.util.*;

/**
 * @modifyBy SeJon Jang (wkdtpwhs@gmail.com)
 * @desc 화상채팅을 위한 클래스 ChatRoomDto 를 상속받음
 */
@Getter
@Setter
@NoArgsConstructor
public class KurentoRoom extends ChatRoom<KurentoUserSession> implements Closeable {

  // 로깅 객체 생성
  @JsonIgnore
  private final Logger log = LoggerFactory.getLogger(KurentoRoom.class);
  @JsonIgnore
  private KurentoClient kurento;
  // 미디어 파이프라인
  @JsonIgnore
  private MediaPipeline pipeline;

  private GameSettingInfo gameSettingInfo; // 해당 방의 게임 정보 세팅

  // 룸 정보 set
  public KurentoRoom(String roomId, String roomName, String roomPwd, boolean secretChk, int userCount, int maxUserCnt, ChatType chatType, KurentoClient kurento){
    super(roomId, roomName, userCount, maxUserCnt, roomPwd, secretChk, chatType);
    this.kurento = kurento;
    // 파이프라인 생성
    this.createPipline();
  }

  // 유저명 가져오기
  @Override
  public String getRoomId() {
    return super.getRoomId();
  }

  /**
   * @Param roomName, pipline
   * @desc roomName 과 pipline 을 이용한 생성자
   * */
//  public KurentoRoom(String roomId, MediaPipeline pipeline) {
//    this.roomId = roomId;
//    this.pipeline = pipeline;
//    log.info("ROOM {} has been created", roomId);
//  }

  // 생성자 대신 아래 메서드로 pipline 초기화
  private void createPipline(){
    this.pipeline = this.kurento.createMediaPipeline();
  }

  /**
   * @desc 종료시 실행?
   * */
  @PreDestroy
  private void shutdown() {
    this.close();
  }

  /**
   * @Desc participants 의 value 만 return
   */
  public Collection<KurentoUserSession> getUserSessions() {
    return this.getParticipants().values();
  }

  public KurentoUserSession getParticipant(String userId) {
    return this.getParticipants().get(userId);
  }

  // 방이 close 되었을 때 사용됨
  @Override
  @JsonIgnore
  public void close() {
    // participants 의 value 값으로 for 문 시작
    for (final KurentoUserSession user : this.getUserSessions()) {
      try {
        // 유저 close
        user.close();
      } catch (IOException e) {
        log.debug("ROOM {}: Could not invoke close on participant {}", this.getRoomId(), user.getUserId(), e);
      }
    } // for 문 끝

    // 유저 정보를 담은 map - participants - 초기화
    this.getParticipants().clear();

    /** 여기서 부터는 Kurento 의 메서드 인 듯 **/
    pipeline.release(new Continuation<Void>() {

      @Override
      public void onSuccess(Void result) throws Exception {
        log.trace("ROOM {}: Released Pipeline", KurentoRoom.this.getRoomId());
      }

      @Override
      public void onError(Throwable cause) throws Exception {
        log.warn("PARTICIPANT {}: Could not release Pipeline", KurentoRoom.this.getRoomId(), cause);
      }
    });

    log.debug("Room {} closed", this.getRoomId());
  }
}

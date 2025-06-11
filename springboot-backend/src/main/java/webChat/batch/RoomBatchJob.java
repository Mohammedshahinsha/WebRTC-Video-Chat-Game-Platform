package webChat.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import webChat.entity.DailyInfo;
import webChat.model.room.ChatRoom;
import webChat.model.room.ChatRoomMap;
import webChat.model.chat.ChatType;
import webChat.model.room.KurentoRoom;
import webChat.repository.DailyInfoRepository;
import webChat.service.analysis.AnalysisService;
import webChat.service.chat.ChatRoomService;
import webChat.service.file.FileService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
@RequiredArgsConstructor
public class RoomBatchJob {
    private final AnalysisService analysisService;
    private final DailyInfoRepository dailyInfoRepository;
    private final FileService fileService;

    @Scheduled(cron = "0 0,30 * * * *", zone = "Asia/Seoul") // 매 시간 30분에 실행 , 타임존 seoul 기준
    public void checkRoom() {
        Map<String, ChatRoom> chatRooms = ChatRoomMap.getInstance().getChatRooms();

        AtomicInteger totalDelRoomCnt = new AtomicInteger();
        AtomicInteger rtcRoomCnt = new AtomicInteger();

        chatRooms.keySet()
                .forEach(key -> {
                    KurentoRoom room = (KurentoRoom) chatRooms.get(key);

                    if (room.getUserCount() <= 0) { // chatroom 에서 usercount 가 0 이하만 list 에 저장
                        room.close();
                        // room 에서 업로드된 모든 파일 삭제
                        fileService.deleteFileDir(room.getRoomId());

                        rtcRoomCnt.incrementAndGet();
                        totalDelRoomCnt.incrementAndGet();
                    }
                });

        LocalDateTime date = LocalDateTime.now();
        log.info("##########################");
        log.info("Deleted RTC Room Count : {}", rtcRoomCnt);
        log.info("Deleted Room Total Count : {}", totalDelRoomCnt);
        log.info(date.toString());
        log.info("##########################");
    }

    @Scheduled(cron = "0 0 */3 * * *", zone = "Asia/Seoul") // 3시간 마다 , 타임존 seoul 기준
    public void dailyInfoInsert() {
        LocalDate nowDate = LocalDate.now();
        DailyInfo findDailyInfo = dailyInfoRepository.findByDate(nowDate);
        int dailyVisitor = analysisService.getDailyVisitor();
        int dailyRoomCnt = analysisService.getDailyRoomCnt();

        if (Objects.nonNull(findDailyInfo)) {
            findDailyInfo.setDailyVisitor(dailyVisitor);
            findDailyInfo.setDailyRoomCnt(dailyRoomCnt);
            dailyInfoRepository.save(findDailyInfo);
        } else {
            analysisService.resetDailyInfo(); // dailyInfo 초기화

            DailyInfo dailyInfo = DailyInfo.builder()
                    .dailyVisitor(0)
                    .dailyRoomCnt(0)
                    .date(nowDate)
                    .build();
            dailyInfoRepository.save(dailyInfo);

            log.info("##########################");
            log.info("NEW DAY :: Reset Daily Info");
        }

        log.info("##########################");
        log.info("dailyVisitor : {}", dailyVisitor);
        log.info("dailyRoomCnt : {}", dailyRoomCnt);
        log.info("##########################");
    }
}

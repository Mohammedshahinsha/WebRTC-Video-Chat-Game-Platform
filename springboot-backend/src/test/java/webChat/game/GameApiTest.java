package webChat.game;


import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import webChat.model.game.GameSubjects;
import webChat.model.game.GameTitles;
import webChat.utils.HttpUtil;

import java.util.concurrent.ConcurrentHashMap;


@SpringBootTest
@TestPropertySource(locations = "/application.properties")
@Slf4j
class GameApiTest {

    @Test
    @DisplayName("python api get test")
    void  getTitles() throws Exception {
        String url = "http://localhost:8000/game_title";
        GameTitles titles = HttpUtil.get(url, new HttpHeaders(), new ConcurrentHashMap<>(), GameTitles.class);
        log.info("titles :: {}",titles.toString());

        this.getSubjects(titles.getTitles().get(2));
    }

    @Test
    @DisplayName("python api post test")
    void  getSubjects(String title) throws Exception {
        String url = "http://localhost:8000/game_subject";
        GameSubjects subjects = new GameSubjects(title);
        subjects = HttpUtil.post(url, new HttpHeaders(), new ConcurrentHashMap<>(), subjects, GameSubjects.class);
        log.info("subjects :: {}",subjects.toString());
    }
}

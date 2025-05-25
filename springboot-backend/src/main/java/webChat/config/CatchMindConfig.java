package webChat.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import webChat.utils.StringUtil;
import javax.annotation.PostConstruct;

@Configuration
@Getter
public class CatchMindConfig {

    @Value("${catchmind.python.api.url}")
    private String url;

    // catchmind python api server 의 url 을 세팅하기 위한 postConstruct
    @PostConstruct
    private void initCatchMindConfig(){
        String envCatchMindUrl = System.getenv("CATCH_MIND_API");
        if(!StringUtil.isNullOrEmpty(envCatchMindUrl)){
            url = envCatchMindUrl;
        }
    }
}

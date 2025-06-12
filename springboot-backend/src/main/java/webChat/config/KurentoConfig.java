package webChat.config;

import org.kurento.client.KurentoClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Objects;

@Configuration
public class KurentoConfig {
    // kms.url 를 application.properties 에 저장 후 사용
    @Value("${kms.url}")
    private String kmsUrl;

    // Kurento Media Server 를 사용하기 위한 Bean 설정
    // 환경변수가 들어오면 환경변수를 KMS_URL 로 설정 or
    // 환경변수에 아무것도 안들어오면 application.properties 에 등록된 kms.url 을 가져와서 사용함
    @Bean
    public KurentoClient kurentoClient() {
        String envKmsUrl = System.getenv("KMS_URL");
        if(Objects.isNull(envKmsUrl) || envKmsUrl.isEmpty()){
            return KurentoClient.create(kmsUrl);
        }

        return KurentoClient.create(envKmsUrl);
    }
}

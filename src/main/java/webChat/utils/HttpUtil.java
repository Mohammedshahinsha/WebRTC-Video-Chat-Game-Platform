package webChat.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.*;

public class HttpUtil {

    private static final Logger log = LoggerFactory.getLogger(HttpUtil.class);

    private static HttpClient httpClient = HttpClients.createDefault();
    private static ObjectMapper objectMapper = new ObjectMapper();

    public static <T> T get(String url, HttpHeaders httpHeaders, Map<String, String> queryParams, Class<T> responseType) throws Exception {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
        if (queryParams != null) {
            for (Map.Entry<String, String> entry : queryParams.entrySet()) {
                builder.queryParam(entry.getKey(), entry.getValue());
            }
        }

        HttpGet httpGet = new HttpGet(builder.build().toUri());
        if (httpHeaders != null) {
            httpHeaders.forEach((key, values) -> values.forEach(value -> httpGet.addHeader(key, value)));
        }

        HttpResponse response = httpClient.execute(httpGet);

        log.debug("GET Request URL: " + httpGet.getURI());
        log.debug("GET Request Headers: " + Arrays.toString(httpGet.getAllHeaders()));

        int statusCode = response.getStatusLine().getStatusCode();
        String responseBody = EntityUtils.toString(response.getEntity());

        // 400 or 500 시 에러 체크
        if (statusCode >= 400) {
            log.info("GET Request failed with status code: " + statusCode);
            log.info("Error Response Body: " + responseBody);
            throw new RuntimeException(responseBody);
        } else {
            log.debug("GET Response Body: " + responseBody);
        }

        return objectMapper.readValue(responseBody, responseType);
    }

    public static <T, R> R post(String url, HttpHeaders httpHeaders, Map<String, String> queryParams, T body, Class<R> responseType) throws Exception {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
        if (queryParams != null) {
            for (Map.Entry<String, String> entry : queryParams.entrySet()) {
                builder.queryParam(entry.getKey(), entry.getValue());
            }
        }


        HttpPost httpPost = new HttpPost(builder.build().toUri());
        if (httpHeaders != null) {
            httpHeaders.forEach((key, values) -> values.forEach(value -> httpPost.addHeader(key, value)));
        }

        String requestBody = body instanceof String ? body.toString() : objectMapper.writeValueAsString(body);
        httpPost.setEntity(new StringEntity(requestBody, ContentType.APPLICATION_JSON));

        HttpResponse response = httpClient.execute(httpPost);

        log.debug("POST Request URL: " + httpPost.getURI());
        log.debug("POST Request Headers: " + Arrays.toString(httpPost.getAllHeaders()));
        log.debug("POST Request Body: " + requestBody);

        int statusCode = response.getStatusLine().getStatusCode();
        String responseBody = EntityUtils.toString(response.getEntity());

        // 400 or 500 시 에러 체크
        if (statusCode >= 400) {
            log.info("POST Request failed with status code: " + statusCode);
            log.info("Error Response Body: " + responseBody);
            throw new RuntimeException(responseBody);
        } else {
            log.debug("POST Response Body: " + responseBody);
        }

        return objectMapper.readValue(responseBody, responseType);
    }
}

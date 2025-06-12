package webChat.service.monitoring.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import webChat.controller.ExceptionController;
import webChat.model.log.ClientInfo;
import webChat.service.monitoring.ClientCheckService;
import webChat.utils.SubnetUtil;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientCheckServiceImpl implements ClientCheckService {

    private static final Logger log = LoggerFactory.getLogger(ClientCheckServiceImpl.class);

    private final String blackListJsonPath = "geodata/firehol_level1.txt";

    @Value("${endpoint.allowed_subnet}")
    private List<String> allowedSubnet;
    @Value("${endpoint.allowed_ip_addresses}")
    private List<String> allowedIpAddresses;

    @PostConstruct
    private void initBlackListJson() {
        this.blackListJson(blackListJsonPath);
    }

    @Override
    public Boolean checkBlackList(ClientInfo clientInfo) {
        List<String> blackList = blackListJson(blackListJsonPath);
        log.debug("##########################################");
        log.debug("clientInfo :::: " + clientInfo.toString());
        log.debug("##########################################");

        log.debug("##########################################");
        log.debug("blackList ::: " + blackList.toString());
        log.debug("##########################################");

        boolean isBlack = blackList.stream().anyMatch(black -> {
            return clientInfo.getSubnet().equals(black) || SubnetUtil.isInRange(black, clientInfo.getIpAddr());
        });

        if (isBlack) {
            clientInfo.setBlack(true);
        }
        return isBlack;
    }

    // CIDR 서브넷 체크 로직을 별도의 메소드로 분리
    @Override
    public Boolean checkIsAllowedIp(String ip) {
        if (allowedIpAddresses.contains(ip)) {
            return true;
        }

        for (String cidr : allowedSubnet) {
            if (SubnetUtil.isInRange(cidr, ip)) {
                return true;
            }
        }
        return false;
    }

    @Cacheable("blackList")
    public List<String> blackListJson(String path) {
        try {
            // classpath 로 blackList txt 파일 가져오기
            ClassPathResource blackList = new ClassPathResource(path);

            log.debug("blackList URI :: " + blackList.getURI());

            try (InputStream inputStream = blackList.getInputStream()) {
                return new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))
                        .lines()
                        .collect(Collectors.toList());
            }

        } catch (Exception e) {
            log.error("error path :: " + path);
            throw new ExceptionController.ResourceNotFoundException("there is No BlackList file");
        }
    }
}

package webChat.service.redis.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import webChat.service.chatroom.ChatRoomService;
import webChat.service.redis.RedisService;

@SpringBootTest
class RedisServiceImplTest {
    @Autowired
    private ChatRoomService roomService;

    @Autowired
    private RedisService redisService;
}
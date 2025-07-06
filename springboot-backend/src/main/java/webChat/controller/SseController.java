package webChat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import webChat.service.chatroom.SseService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chatforyou/api/sse")
public class SseController {

    private final SseService sseService;

    @GetMapping("/room-events")
    public SseEmitter connect() {
        // 새로운 SSE 연결을 생성하고 반환
        return sseService.createEmitter();
    }
}

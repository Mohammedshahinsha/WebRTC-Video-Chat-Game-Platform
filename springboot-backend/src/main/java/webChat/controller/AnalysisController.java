package webChat.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import webChat.model.response.common.ChatForYouResponse;
import webChat.service.analysis.AnalysisService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chatforyou/api")
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping(value = "/visitor", produces="application/json; charset=UTF8")
    public ResponseEntity<ChatForYouResponse> getDailyVisitor(
            @RequestParam(defaultValue = "false", name = "isVisitedToday") Boolean isVisitedToday){
        if(isVisitedToday){
            return ResponseEntity.ok(ChatForYouResponse.ofSuccess(String.valueOf(analysisService.getDailyVisitor())));
        }
        return ResponseEntity.ok(ChatForYouResponse.ofSuccess(String.valueOf(analysisService.increaseVisitor())));
    }
}

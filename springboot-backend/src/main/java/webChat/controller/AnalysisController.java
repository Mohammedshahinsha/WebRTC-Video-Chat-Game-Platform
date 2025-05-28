package webChat.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import webChat.service.analysis.AnalysisService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chatforyou/api")
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping(value = "/visitor", produces="application/json; charset=UTF8")
    public int getDailyVisitor(
            @RequestParam(defaultValue = "false", name = "isVisitedToday") Boolean isVisitedToday){
        if(isVisitedToday){
            return analysisService.getDailyVisitor();
        }
        return analysisService.increaseVisitor();
    }
}

package webChat.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import webChat.service.analysis.AnalysisService;

@RestController
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping(value = "/visitor", produces="application/json; charset=UTF8")
    public int getDailyVisitor(
            @RequestParam(defaultValue = "false") Boolean isVisitedToday){
        if(isVisitedToday){
            return analysisService.getDailyVisitor();
        }
        return analysisService.increaseVisitor();
    }
}

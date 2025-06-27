package webChat.repository;

import lombok.extern.slf4j.Slf4j;
import org.kurento.client.MediaPipeline;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class KurentoPiplineMap {

    private static KurentoPiplineMap kurentoPiplineMap = new KurentoPiplineMap();
    private Map<String, MediaPipeline> pipeline = new ConcurrentHashMap<>();
    private KurentoPiplineMap(){}

    public static Map<String, MediaPipeline> getInstance(){
        return kurentoPiplineMap.pipeline;
    }

    public Map<String, MediaPipeline> getPipeline() {
        return pipeline;
    }

    public void setPipeline(String roomId, MediaPipeline pipeline) {
        this.pipeline.put(roomId, pipeline);
    }

    public MediaPipeline getPipeline(String roomId) {
        return pipeline.get(roomId);
    }

}

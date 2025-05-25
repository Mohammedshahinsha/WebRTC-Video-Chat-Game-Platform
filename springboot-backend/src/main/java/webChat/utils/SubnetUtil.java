package webChat.utils;

import org.apache.commons.net.util.SubnetUtils;

public class SubnetUtil {

    /**
     * cidr 에 ip 가 속해있는지 검사
     * @param cidr 확인 cidr
     * @param ip 요청받은 ip
     * @return 포함되면 true, 아니면 false
     */
    public static boolean isInRange(String cidr, String ip) {
        try {
            SubnetUtils subnetUtils = new SubnetUtils(cidr);
            subnetUtils.setInclusiveHostCount(true);
            return subnetUtils.getInfo().isInRange(ip);
        } catch (Exception e) {
            return false;
        }
    }
}

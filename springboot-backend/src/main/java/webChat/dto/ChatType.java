package webChat.dto;

import lombok.Getter;

@Getter
public enum ChatType {
    RTC(1, "RTC"),
    MSG(2, "MSG")
    ;


    private final int code;
    private final String type;

    ChatType(int code, String type){
        this.code = code;
        this.type = type;
    }
}

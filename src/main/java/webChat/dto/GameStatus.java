package webChat.dto;

public enum GameStatus {
    WINNER,
    MORE_TIME,
    TOO_MANY_FAIL, // 너무 많이 시도해서 점수가 깍이는 경우
    TOO_MANY_CLEAR // max canvas clear 횟수 이후 추가로 clear 를 시도하려고 하는 경우
}
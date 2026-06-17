package com.studit.exception;

public class ReservationException extends RuntimeException {

    private final String code;

    public ReservationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

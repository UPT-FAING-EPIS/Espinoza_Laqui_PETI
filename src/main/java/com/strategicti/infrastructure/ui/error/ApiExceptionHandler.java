package com.strategicti.infrastructure.ui.error;

import com.strategicti.application.usecase.AuthenticationFailedException;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(AuthenticationFailedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> handleAuthentication(AuthenticationFailedException exception) {
        return error("unauthorized", exception.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(ResourceNotFoundException exception) {
        return error("not_found", exception.getMessage());
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> handleForbidden(ForbiddenOperationException exception) {
        return error("forbidden", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleState(IllegalStateException exception) {
        return error("conflict", exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBadRequest(IllegalArgumentException exception) {
        return error("bad_request", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, Object> response = error("validation_error", "Revise los campos enviados.");
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fields.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        response.put("fields", fields);
        return response;
    }

    private Map<String, Object> error(String code, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", code);
        response.put("message", message);
        return response;
    }
}

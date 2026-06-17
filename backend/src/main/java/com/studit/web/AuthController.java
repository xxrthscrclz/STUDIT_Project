package com.studit.web;

import com.studit.service.AuthService;
import com.studit.service.AuthService.AuthResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public AuthResponse signup(@RequestBody AuthRequest request) {
        return authService.signup(request.username(), request.password());
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        return authService.login(request.username(), request.password());
    }

    public record AuthRequest(
            @NotBlank String username, @NotBlank String password) {}
}

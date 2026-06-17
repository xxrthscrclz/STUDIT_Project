package com.studit.web;

import com.studit.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    @GetMapping
    public MeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return new MeResponse(principal.getUser().getId(), principal.getUsername());
    }

    public record MeResponse(Long id, String username) {}
}

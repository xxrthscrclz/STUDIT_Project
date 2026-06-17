package com.studit.service;

import com.studit.domain.User;
import com.studit.repository.UserRepository;
import com.studit.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse signup(String username, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
        }
        User user =
                User.builder()
                        .username(username)
                        .password(passwordEncoder.encode(password))
                        .build();
        userRepository.save(user);
        return tokenFor(user);
    }

    public AuthResponse login(String username, String password) {
        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        return tokenFor(user);
    }

    private AuthResponse tokenFor(User user) {
        String token = jwtService.generateToken(user.getUsername(), user.getId());
        return new AuthResponse(token, user.getId(), user.getUsername());
    }

    public record AuthResponse(String token, Long userId, String username) {}
}

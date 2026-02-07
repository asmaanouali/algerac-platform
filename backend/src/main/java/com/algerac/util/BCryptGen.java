package com.algerac.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptGen {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "mdpsmdps"; // Remplacez par le mot de passe voulu
        String hash = encoder.encode(password);
        System.out.println("Hash BCrypt : " + hash);
    }
}

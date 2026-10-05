package com.circulabook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CirculaBookApplication {

    public static void main(String[] args) {
        SpringApplication.run(CirculaBookApplication.class, args);
    }
}
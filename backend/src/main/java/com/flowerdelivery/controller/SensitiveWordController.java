package com.flowerdelivery.controller;

import com.flowerdelivery.entity.SensitiveWord;
import com.flowerdelivery.service.SensitiveWordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sensitive-words")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SensitiveWordController {

    private final SensitiveWordService sensitiveWordService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSensitiveWords() {
        List<SensitiveWord> words = sensitiveWordService.getAllSensitiveWords();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", words);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addSensitiveWord(@RequestBody Map<String, String> request) {
        String word = request.get("word");
        String category = request.get("category");
        SensitiveWord saved = sensitiveWordService.addSensitiveWord(word, category);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", saved);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkSensitiveWords(@RequestParam String text) {
        List<String> hitWords = sensitiveWordService.checkSensitiveWords(text);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", hitWords);
        result.put("hasSensitive", !hitWords.isEmpty());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reload")
    public ResponseEntity<Map<String, Object>> reloadSensitiveWords() {
        sensitiveWordService.loadSensitiveWordsToRedis();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "敏感词库已重新加载");
        return ResponseEntity.ok(result);
    }
}

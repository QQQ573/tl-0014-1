package com.flowerdelivery.service;

import com.flowerdelivery.entity.SensitiveWord;
import com.flowerdelivery.repository.SensitiveWordRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SensitiveWordService {

    private final SensitiveWordRepository sensitiveWordRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String SENSITIVE_WORDS_KEY = "flower:sensitive:words";

    @PostConstruct
    public void init() {
        try {
            loadSensitiveWordsToRedis();
        } catch (Exception e) {
            log.warn("初始化敏感词库失败，可能是数据库未就绪: {}", e.getMessage());
        }
    }

    public void loadSensitiveWordsToRedis() {
        List<SensitiveWord> words = sensitiveWordRepository.findByEnabledTrue();
        Set<String> wordSet = words.stream()
                .map(SensitiveWord::getWord)
                .collect(Collectors.toSet());

        redisTemplate.delete(SENSITIVE_WORDS_KEY);
        if (!wordSet.isEmpty()) {
            redisTemplate.opsForSet().add(SENSITIVE_WORDS_KEY, wordSet.toArray(new String[0]));
        }
        log.info("已加载 {} 个敏感词到 Redis 缓存", wordSet.size());
    }

    public List<String> checkSensitiveWords(String text) {
        List<String> hitWords = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            return hitWords;
        }

        Set<String> cachedWords = redisTemplate.opsForSet().members(SENSITIVE_WORDS_KEY);
        if (cachedWords == null || cachedWords.isEmpty()) {
            loadSensitiveWordsToRedis();
            cachedWords = redisTemplate.opsForSet().members(SENSITIVE_WORDS_KEY);
        }

        if (cachedWords != null) {
            for (String word : cachedWords) {
                if (text.toLowerCase().contains(word.toLowerCase())) {
                    hitWords.add(word);
                }
            }
        }

        return hitWords;
    }

    public List<SensitiveWord> getAllSensitiveWords() {
        return sensitiveWordRepository.findAll();
    }

    public SensitiveWord addSensitiveWord(String word, String category) {
        if (sensitiveWordRepository.existsByWord(word)) {
            throw new RuntimeException("敏感词已存在: " + word);
        }
        SensitiveWord sensitiveWord = new SensitiveWord();
        sensitiveWord.setWord(word);
        sensitiveWord.setCategory(category);
        SensitiveWord saved = sensitiveWordRepository.save(sensitiveWord);
        redisTemplate.opsForSet().add(SENSITIVE_WORDS_KEY, word);
        return saved;
    }
}

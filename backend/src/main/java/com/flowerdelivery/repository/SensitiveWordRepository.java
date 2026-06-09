package com.flowerdelivery.repository;

import com.flowerdelivery.entity.SensitiveWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensitiveWordRepository extends JpaRepository<SensitiveWord, Long> {

    List<SensitiveWord> findByEnabledTrue();

    boolean existsByWord(String word);
}

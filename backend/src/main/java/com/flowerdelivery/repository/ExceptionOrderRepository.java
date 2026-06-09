package com.flowerdelivery.repository;

import com.flowerdelivery.entity.ExceptionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExceptionOrderRepository extends JpaRepository<ExceptionOrder, Long> {

    Optional<ExceptionOrder> findByTrackingNoAndStatus(String trackingNo, ExceptionOrder.ExceptionStatus status);

    List<ExceptionOrder> findByStatus(ExceptionOrder.ExceptionStatus status);

    List<ExceptionOrder> findByExceptionType(ExceptionOrder.ExceptionType exceptionType);

    List<ExceptionOrder> findByTrackingNoOrderByCreateTimeDesc(String trackingNo);

    Optional<ExceptionOrder> findByIdAndStatus(Long id, ExceptionOrder.ExceptionStatus status);
}

package com.flowerdelivery.repository;

import com.flowerdelivery.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {

    Optional<DeliveryOrder> findByTrackingNo(String trackingNo);

    Optional<DeliveryOrder> findByOrderNo(String orderNo);

    List<DeliveryOrder> findByRiderId(String riderId);

    List<DeliveryOrder> findByStatus(DeliveryOrder.OrderStatus status);

    @Query("SELECT o FROM DeliveryOrder o WHERE o.isException = true")
    List<DeliveryOrder> findExceptionOrders();

    boolean existsByTrackingNo(String trackingNo);
}

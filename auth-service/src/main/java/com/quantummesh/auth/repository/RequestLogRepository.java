package com.quantummesh.auth.repository;

import com.quantummesh.auth.entity.RequestLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {

    Page<RequestLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.costMicros), 0) FROM RequestLog r " +
            "WHERE r.userId = :userId AND r.timestamp >= :since")
    long sumCostMicrosByUserSince(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT COUNT(r) FROM RequestLog r " +
            "WHERE r.userId = :userId AND r.timestamp >= :since")
    long countByUserSince(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT r.downstreamService AS service, COUNT(r) AS count FROM RequestLog r " +
            "WHERE r.userId = :userId AND r.timestamp >= :since " +
            "GROUP BY r.downstreamService")
    List<ServiceCountRow> countByServiceForUserSince(@Param("userId") Long userId,
                                                     @Param("since") Instant since);

    @Query("SELECT r FROM RequestLog r " +
            "WHERE r.userId = :userId AND r.timestamp >= :since " +
            "ORDER BY r.timestamp ASC")
    List<RequestLog> findRecentForUser(@Param("userId") Long userId, @Param("since") Instant since);

    interface ServiceCountRow {
        String getService();
        Long getCount();
    }
}

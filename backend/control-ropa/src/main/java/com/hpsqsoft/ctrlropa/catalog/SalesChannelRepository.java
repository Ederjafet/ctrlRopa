package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.common.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SalesChannelRepository extends JpaRepository<SalesChannel, Long> {

    Optional<SalesChannel> findByCode(String code);

    boolean existsByCode(String code);
    
    boolean existsByName(String name);

    List<SalesChannel> findByStatusOrderByNameAsc(Status status);

    List<SalesChannel> findByStatusAndGlobalEnabledTrueOrderByNameAsc(Status status);
}

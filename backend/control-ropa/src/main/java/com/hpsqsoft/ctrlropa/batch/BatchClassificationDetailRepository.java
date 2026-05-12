package com.hpsqsoft.ctrlropa.batch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BatchClassificationDetailRepository extends JpaRepository<BatchClassificationDetail, Long> {

    List<BatchClassificationDetail> findByBatchIdOrderByProductTypeNameAsc(Long batchId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from BatchClassificationDetail detail where detail.batch.id = :batchId")
    void deleteByBatchId(@Param("batchId") Long batchId);
}

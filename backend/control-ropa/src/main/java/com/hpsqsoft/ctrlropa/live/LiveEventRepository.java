package com.hpsqsoft.ctrlropa.live;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiveEventRepository extends JpaRepository<LiveEvent, Long> {

    List<LiveEvent> findTop50ByLiveIdOrderByCreatedAtDesc(Long liveId);
}

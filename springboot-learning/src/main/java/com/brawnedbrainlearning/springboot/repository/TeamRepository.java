package com.brawnedbrainlearning.springboot.repository;

import com.brawnedbrainlearning.springboot.model.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {

    Page<Team> findAll(Pageable pageable);

    @Query("SELECT t FROM Team t WHERE " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.location) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.head) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Team> search(@Param("q") String query);
}

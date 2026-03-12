package com.brawnedbrainlearning.springboot.repository;

import com.brawnedbrainlearning.springboot.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Page<Employee> findAll(Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE " +
           "LOWER(e.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(e.designation) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(e.address) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Employee> search(@Param("q") String query);
}

package com.brawnedbrainlearning.springboot.service;

import com.brawnedbrainlearning.springboot.model.Employee;
import com.brawnedbrainlearning.springboot.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    private final EmployeeRepository repo;

    public EmployeeService(EmployeeRepository repo) {
        this.repo = repo;
    }

    public Page<Employee> getAll(int page, int size) {
        return repo.findAll(PageRequest.of(page, size));
    }

    public Optional<Employee> getById(Long id) {
        return repo.findById(id);
    }

    public List<Employee> search(String query) {
        return repo.search(query);
    }

    public Employee create(Employee employee) {
        return repo.save(employee);
    }

    public Employee update(Long id, Employee patch) {
        Employee existing = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        if (patch.getName() != null)        existing.setName(patch.getName());
        if (patch.getAddress() != null)     existing.setAddress(patch.getAddress());
        if (patch.getDesignation() != null) existing.setDesignation(patch.getDesignation());
        if (patch.getTeamId() != null)      existing.setTeamId(patch.getTeamId());
        if (patch.getSalary() != null)      existing.setSalary(patch.getSalary());
        return repo.save(existing);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}

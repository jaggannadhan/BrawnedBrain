package com.brawnedbrainlearning.springboot.controller;

import com.brawnedbrainlearning.springboot.model.Employee;
import com.brawnedbrainlearning.springboot.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {

    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Employee> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return service.getAll(page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getById(@PathVariable Long id) {
        return service.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Employee> search(@RequestParam String q) {
        return service.search(q);
    }

    @PostMapping
    public Employee create(@Valid @RequestBody Employee employee) {
        return service.create(employee);
    }

    @PatchMapping("/{id}")
    public Employee update(@PathVariable Long id, @RequestBody Employee patch) {
        return service.update(id, patch);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

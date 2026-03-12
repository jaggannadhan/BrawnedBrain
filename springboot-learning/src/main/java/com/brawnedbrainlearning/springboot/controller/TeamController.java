package com.brawnedbrainlearning.springboot.controller;

import com.brawnedbrainlearning.springboot.model.Team;
import com.brawnedbrainlearning.springboot.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "http://localhost:5173")
public class TeamController {

    private final TeamService service;

    public TeamController(TeamService service) {
        this.service = service;
    }

    @GetMapping
    public Page<Team> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return service.getAll(page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getById(@PathVariable Long id) {
        return service.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Team> search(@RequestParam String q) {
        return service.search(q);
    }

    @PostMapping
    public Team create(@Valid @RequestBody Team team) {
        return service.create(team);
    }

    @PatchMapping("/{id}")
    public Team update(@PathVariable Long id, @RequestBody Team patch) {
        return service.update(id, patch);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.brawnedbrainlearning.springboot.service;

import com.brawnedbrainlearning.springboot.model.Team;
import com.brawnedbrainlearning.springboot.repository.TeamRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TeamService {

    private final TeamRepository repo;

    public TeamService(TeamRepository repo) {
        this.repo = repo;
    }

    public Page<Team> getAll(int page, int size) {
        return repo.findAll(PageRequest.of(page, size));
    }

    public Optional<Team> getById(Long id) {
        return repo.findById(id);
    }

    public List<Team> search(String query) {
        return repo.search(query);
    }

    public Team create(Team team) {
        return repo.save(team);
    }

    public Team update(Long id, Team patch) {
        Team existing = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Team not found: " + id));
        if (patch.getName() != null)     existing.setName(patch.getName());
        if (patch.getLocation() != null) existing.setLocation(patch.getLocation());
        if (patch.getBudget() != null)   existing.setBudget(patch.getBudget());
        if (patch.getHead() != null)     existing.setHead(patch.getHead());
        return repo.save(existing);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}

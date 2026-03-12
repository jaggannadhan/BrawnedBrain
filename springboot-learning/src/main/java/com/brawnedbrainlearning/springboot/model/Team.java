package com.brawnedbrainlearning.springboot.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String location;

    private Double budget;

    private String head;

    public Team() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getLocation() { return location; }
    public Double getBudget() { return budget; }
    public String getHead() { return head; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setLocation(String location) { this.location = location; }
    public void setBudget(Double budget) { this.budget = budget; }
    public void setHead(String head) { this.head = head; }
}

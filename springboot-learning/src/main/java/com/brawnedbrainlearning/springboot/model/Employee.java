package com.brawnedbrainlearning.springboot.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String address;

    private String designation;

    @Column(name = "team_id")
    private Long teamId;

    private Double salary;

    public Employee() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getDesignation() { return designation; }
    public Long getTeamId() { return teamId; }
    public Double getSalary() { return salary; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
    public void setDesignation(String designation) { this.designation = designation; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public void setSalary(Double salary) { this.salary = salary; }
}

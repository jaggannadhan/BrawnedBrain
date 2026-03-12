import { gql } from "@apollo/client";

export const GET_EMPLOYEES = gql`
  query GetEmployees($offset: Int = 0, $limit: Int = 10) {
    employees(offset: $offset, limit: $limit) {
      items {
        id
        name
        address
        designation
        team { id name }
        salary
      }
      nextOffset
      hasMore
    }
  }
`;

export const GET_EMPLOYEE = gql`
  query GetEmployee($id: Int!) {
    employee(id: $id) {
      id
      name
      address
      designation
      team { id name }
      salary
    }
  }
`;

export const SEARCH_EMPLOYEES = gql`
  query SearchEmployees($query: String!) {
    searchEmployees(query: $query) {
      id
      name
      address
      designation
      team { id name }
      salary
    }
  }
`;

export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: EmployeeInput!) {
    createEmployee(input: $input) {
      id
      name
      address
      designation
      team { id name }
      salary
    }
  }
`;

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($id: Int!, $input: EmployeeUpdateInput!) {
    updateEmployee(id: $id, input: $input) {
      id
      name
      address
      designation
      team { id name }
      salary
    }
  }
`;

export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: Int!) {
    deleteEmployee(id: $id) {
      success
      message
    }
  }
`;

// === Team queries ===

export const GET_TEAMS = gql`
  query GetTeams($offset: Int = 0, $limit: Int = 10) {
    teams(offset: $offset, limit: $limit) {
      items {
        id
        name
        location
        budget
        head
      }
      nextOffset
      hasMore
    }
  }
`;

export const SEARCH_TEAMS = gql`
  query SearchTeams($query: String!) {
    searchTeams(query: $query) {
      id
      name
      location
      budget
      head
    }
  }
`;

export const CREATE_TEAM = gql`
  mutation CreateTeam($input: TeamInput!) {
    createTeam(input: $input) {
      id
      name
      location
      budget
      head
    }
  }
`;

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: Int!, $input: TeamUpdateInput!) {
    updateTeam(id: $id, input: $input) {
      id
      name
      location
      budget
      head
    }
  }
`;

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: Int!) {
    deleteTeam(id: $id) {
      success
      message
    }
  }
`;

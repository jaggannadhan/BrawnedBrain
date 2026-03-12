# Spring Boot Learning Module — BrawnedBrain

A hands-on learning module for Java + Spring Boot, structured as a 3-phase curriculum
from JVM internals to production-grade distributed systems.

## Curriculum

### Phase 1 · Intermediate — The "Engine" (Java & JVM Deep Dive)
> Understanding *why* Java behaves the way it does at scale

- Memory Management & GC (Heap vs Stack, G1, ZGC)
- The Concurrency Model (Platform Threads vs Virtual Threads / Project Loom)
- Build Tools & Dependency Management (Maven/Gradle lifecycle)
- Streams & Lambdas (Stream API, functional programming in Java)

### Phase 2 · Advanced — The "Framework" (Spring Boot Internals)
> Mastering the "magic" of Spring

- Inversion of Control (IoC) & Dependency Injection (Bean scopes, ApplicationContext)
- Aspect-Oriented Programming (AOP proxies, @Transactional, logging)
- Spring Data JPA & Hibernate (Persistence Context, N+1 problem, LazyLoading)
- Auto-configuration deep dive (@SpringBootApplication, classpath scanning)

### Phase 3 · Senior — The "Architect" (Distributed Systems & Production)
> High-level system design in the Spring ecosystem

- Spring Cloud & Microservices (Eureka, Config Server, API Gateway)
- Resiliency Patterns (Circuit Breaker with Resilience4j, Rate Limiting)
- Observability (Actuator, Micrometer, Prometheus/Grafana)
- Security (OAuth2/JWT, Spring Security filter chain)

## Structure

```
springboot-learning/
├── frontend/          # React + Vite — theory viewer & demo UI
├── src/               # Spring Boot backend (Maven project)
│   └── main/
│       ├── java/com/brawnedbrainlearning/springboot/
│       │   ├── controller/
│       │   ├── model/
│       │   ├── repository/
│       │   └── service/
│       └── resources/
│           └── application.properties
└── pom.xml
```

## Running

```bash
# Backend
mvn spring-boot:run

# Frontend
cd frontend && npm install && npm run dev
```

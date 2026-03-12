```
  ____                                    _ ____            _
 | __ ) _ __ __ ___      ___ __   ___  __| | __ ) _ __ __ _(_)_ __
 |  _ \| '__/ _` \ \ /\ / / '_ \ / _ \/ _` |  _ \| '__/ _` | | '_ \
 | |_) | | | (_| |\ V  V /| | | |  __/ (_| | |_) | | | (_| | | | | |
 |____/|_|  \__,_| \_/\_/ |_| |_|\___|\__,_|____/|_|  \__,_|_|_| |_|
```

> A visual, hands-on e-learning platform — built while learning.

---

## What is this?

BrawnedBrain is a personal learning platform where every technology I study gets its own
interactive module. Each module pairs **working code** with **visual theory** so concepts
stick faster.

---

## Modules

| Module | Topics Covered |
|---|---|
| [`graphql-learning`](./graphql-learning) | GraphQL fundamentals, Strawberry + FastAPI, DataLoader, Federation, Auth, Caching |
| [`springboot-learning`](./springboot-learning) | Java & JVM internals, Spring Boot, JPA/Hibernate, Spring Cloud, Resilience4j, Observability, Security |

---

## Structure

Each module follows the same layout:

```
<topic>-learning/
├── frontend/        # React app — interactive UI, theory viewer, playground
├── main.py          # FastAPI entry point  (or equivalent for the tech stack)
├── requirements.txt
└── ...
```

---

## Running

```bash
# Hub (unified UI — run this to access all modules)
cd frontend && npm install && npm run dev
# → http://localhost:3000

# Module backends (run whichever module you're using)
cd graphql-learning && uvicorn main:app --reload   # :8000
cd springboot-learning && mvn spring-boot:run      # :8080
```

---

## Stack

- **Hub** — React · Vite (port 3000)
- **GraphQL module** — Python · FastAPI · Strawberry · SQLAlchemy
- **Spring Boot module** — Java · Spring Boot · JPA · PostgreSQL
- **Frontend** — React · Vite · Apollo Client

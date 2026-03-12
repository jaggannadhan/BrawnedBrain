import { useState } from "react";

// ── Syntax highlighting ───────────────────────────────────────────────────────

const KEYWORDS = new Set([
  "public","private","protected","static","final","void","class","interface",
  "extends","implements","new","return","if","else","for","while","do","try",
  "catch","finally","throw","throws","import","package","this","super","null",
  "true","false","abstract","synchronized","volatile","transient","instanceof",
  "break","continue","switch","case","default","enum","record","sealed","var",
  "const","let","function","export","typeof","from","of","async","await",
]);

const BUILTIN_TYPES = new Set([
  "int","long","double","float","boolean","char","byte","short",
  "String","Integer","Long","Double","Float","Boolean","Object","List","Map",
  "Set","Optional","Page","Pageable","PageRequest","ResponseEntity","Thread",
  "Runnable","Future","CompletableFuture","ExecutorService","Stream",
  "SpringApplication","ApplicationContext","BeanFactory","DataSource",
  "EntityManager","EntityManagerFactory","PersistenceContext",
  "RestController","Service","Repository","Component","Configuration","Bean",
  "Autowired","Qualifier","Scope","Profile","PostConstruct","PreDestroy",
  "Transactional","Aspect","Before","After","Around","Pointcut","JoinPoint",
  "ProceedingJoinPoint","Entity","Table","Id","Column","ManyToOne","OneToMany",
  "GeneratedValue","NotBlank","Valid","RequestBody","PathVariable","RequestParam",
  "CrossOrigin","GetMapping","PostMapping","PatchMapping","DeleteMapping",
  "RequestMapping","JpaRepository","Query","Param","FetchType",
  "CircuitBreaker","Retry","RateLimiter","SecurityFilterChain","HttpSecurity",
  "UserDetailsService","JwtDecoder","Authentication","Principal","MeterRegistry",
  "Counter","Timer","AtomicInteger","HashMap","LinkedHashMap","ArrayList",
  "number","string","boolean","undefined","Promise","Array",
]);

function isTypeName(word) {
  if (KEYWORDS.has(word)) return false;
  if (BUILTIN_TYPES.has(word)) return true;
  return /^[A-Z][a-zA-Z0-9]*$/.test(word) && /[a-z]/.test(word);
}

function expandCode(text) {
  const result = [];
  const re = /([A-Za-z_]\w*)|([^A-Za-z_]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) result.push({ type: isTypeName(m[1]) ? "type" : "code", text: m[1] });
    else      result.push({ type: "code", text: m[2] });
  }
  return result;
}

function tokenizeLine(line) {
  const tokens = [];
  let i = 0, buf = "";
  while (i < line.length) {
    if ((line[i]==='"'||line[i]==="'") && line[i+1]===line[i] && line[i+2]===line[i]) {
      if (buf) { tokens.push({ type:"code", text:buf }); buf=""; }
      const q = line[i].repeat(3); let str = q; i += 3;
      while (i < line.length) { if (line.slice(i,i+3)===q){str+=q;i+=3;break;} str+=line[i++]; }
      tokens.push({ type:"string", text:str });
    } else if (line[i]==='"' || line[i]==="'") {
      if (buf) { tokens.push({ type:"code", text:buf }); buf=""; }
      const q=line[i]; let str=q; i++;
      while (i<line.length) {
        if (line[i]==="\\"){str+=line[i]+line[i+1];i+=2;continue;}
        if (line[i]===q){str+=q;i++;break;} str+=line[i++];
      }
      tokens.push({ type:"string", text:str });
    } else if (line[i]==="/"&&line[i+1]==="/") {
      if (buf) { tokens.push({ type:"code", text:buf }); buf=""; }
      tokens.push({ type:"comment", text:line.slice(i) }); i=line.length;
    } else if (line[i]==="/"&&line[i+1]==="*") {
      if (buf) { tokens.push({ type:"code", text:buf }); buf=""; }
      let c="/*"; i+=2;
      while (i<line.length){if(line[i]==="*"&&line[i+1]==="/"){c+="*/";i+=2;break;}c+=line[i++];}
      tokens.push({ type:"comment", text:c });
    } else if (line[i]==="(") {
      const match = buf.match(/^([\s\S]*?)([A-Za-z_]\w*)$/);
      if (match) { if (match[1]) tokens.push({type:"code",text:match[1]}); tokens.push({type:"function",text:match[2]}); }
      else { if (buf) tokens.push({type:"code",text:buf}); }
      buf="("; i++;
    } else { buf+=line[i++]; }
  }
  if (buf) tokens.push({ type:"code", text:buf });
  return tokens;
}

function renderToken(tok, key) {
  if (tok.type==="comment")  return <span key={key} style={{color:"#6a9955"}}>{tok.text}</span>;
  if (tok.type==="string")   return <span key={key} style={{color:"#ce9178"}}>{tok.text}</span>;
  if (tok.type==="function") return <span key={key} style={{color:"#d3d3a4"}}>{tok.text}</span>;
  if (tok.type==="type")     return <span key={key} style={{color:"#47af9a"}}>{tok.text}</span>;
  return <span key={key}>{tok.text}</span>;
}

function highlightCode(code) {
  return code.split("\n").map((line, i) => (
    <span key={i}>
      {tokenizeLine(line).flatMap((tok, j) =>
        tok.type==="code"
          ? expandCode(tok.text).map((sub,k) => renderToken(sub,`${j}-${k}`))
          : [renderToken(tok,j)]
      )}
      {"\n"}
    </span>
  ));
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const text = typeof children==="string" ? children : String(children);
  const handleCopy = () => navigator.clipboard.writeText(text).then(() => {
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  });
  return (
    <div className="theory-code-wrap">
      <button className="theory-copy-btn" onClick={handleCopy}>{copied ? "✓ Copied" : "Copy"}</button>
      <pre className="theory-code">{highlightCode(text)}</pre>
    </div>
  );
}

// ── Levels ────────────────────────────────────────────────────────────────────

const LEVELS = {
  intermediate: { label: "Intermediate", color: "#3b82f6" },
  advanced:     { label: "Advanced",     color: "#a855f7" },
  senior:       { label: "Senior",       color: "#ef4444" },
};

// ── Subjects ──────────────────────────────────────────────────────────────────

const SUBJECTS = [

  // ══════════════════════════════════════════════════════
  // PHASE 1 · INTERMEDIATE — Java & JVM Deep Dive
  // ══════════════════════════════════════════════════════

  {
    id: "memory-gc",
    title: "Memory Management & Garbage Collection",
    level: "intermediate",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Heap vs Stack</h4>
          <table className="theory-table">
            <thead><tr><th></th><th>Stack</th><th>Heap</th></tr></thead>
            <tbody>
              <tr><td><strong>Stores</strong></td><td>Primitive locals, method frames, object references</td><td>All object instances</td></tr>
              <tr><td><strong>Lifetime</strong></td><td>Popped when method returns — instant</td><td>Lives until GC decides it's unreachable</td></tr>
              <tr><td><strong>Size</strong></td><td>~512KB–1MB per thread</td><td>Large — set via <code>-Xmx</code></td></tr>
              <tr><td><strong>Thread safety</strong></td><td>Each thread has its own stack</td><td>Shared — requires synchronization</td></tr>
            </tbody>
          </table>
          <CodeBlock>{`public void processEmployees() {
    int count = 0;                        // stack — primitive local
    String label = "employees";           // stack — reference; "employees" on heap
    Employee emp = new Employee("Alice"); // stack — reference; object on heap

    // When method returns:
    //   count, label, emp references → popped from stack instantly
    //   Employee("Alice") object     → stays on heap until GC collects it
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Heap generations</h4>
          <p>Most objects die young — JVM exploits this by splitting the heap:</p>
          <CodeBlock>{`// JVM Heap layout:
//
//  Young Generation
//  ┌──────────┬────────────┬────────────┐
//  │  Eden    │ Survivor 0 │ Survivor 1 │  ← new allocations land here
//  └──────────┴────────────┴────────────┘
//        │  short-lived objects collected here (Minor GC — < 1ms)
//
//  Old Generation (Tenured)
//  ┌──────────────────────────────────┐
//  │  survived N minor GCs            │  ← Major GC — slower, stop-the-world
//  └──────────────────────────────────┘
//
//  Metaspace (off-heap, Java 8+)
//  ┌──────────────────────────────────┐
//  │  class metadata, static fields   │
//  └──────────────────────────────────┘

// Heap size flags:
// java -Xms512m -Xmx2g -jar app.jar
//        │        └── max heap 2 GB
//        └── initial heap 512 MB`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. GC algorithms — G1 vs ZGC</h4>
          <table className="theory-table">
            <thead><tr><th></th><th>G1GC (default, Java 9+)</th><th>ZGC (Java 15+)</th></tr></thead>
            <tbody>
              <tr><td><strong>Goal</strong></td><td>Balanced throughput + latency</td><td>Ultra-low pause (&lt;1ms regardless of heap size)</td></tr>
              <tr><td><strong>Heap</strong></td><td>Up to ~50 GB</td><td>Terabytes</td></tr>
              <tr><td><strong>Pause</strong></td><td>Configurable target (default 200ms)</td><td>Sub-millisecond</td></tr>
              <tr><td><strong>Use for</strong></td><td>Most Spring Boot apps</td><td>Low-latency APIs, real-time systems</td></tr>
            </tbody>
          </table>
          <CodeBlock>{`# Select GC at startup
# G1GC (default — most Spring Boot apps)
JAVA_OPTS=-XX:+UseG1GC -XX:MaxGCPauseMillis=200

# ZGC — payment APIs, trading systems, anything latency-sensitive
JAVA_OPTS=-XX:+UseZGC -Xmx8g

# GC logging to diagnose pauses in production
JAVA_OPTS=-Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=10m`}</CodeBlock>
          <p className="theory-note">
            Unlike Python's reference counting (immediate deallocation, can't handle cycles),
            Java's GC runs in the background and handles circular references naturally.
          </p>
        </div>

        <div className="theory-concept">
          <h4>4. Memory leak pattern in Spring Boot</h4>
          <CodeBlock>{`@Service
public class EmployeeCache {
    // BAD — unbounded map grows forever, never evicted → OutOfMemoryError
    private final Map<Long, Employee> cache = new HashMap<>();

    // GOOD — bounded with LRU eviction
    private final Map<Long, Employee> cache = new LinkedHashMap<>() {
        protected boolean removeEldestEntry(Map.Entry<Long, Employee> e) {
            return size() > 1000;
        }
    };

    // BEST — use Spring Cache + Caffeine (TTL + max size + stats)
    // @Cacheable("employees") on the service method
}`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "concurrency",
    title: "Concurrency — Threads vs Virtual Threads (Project Loom)",
    level: "intermediate",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Java has no GIL</h4>
          <p>
            Python's GIL allows only one thread to execute bytecode at a time — CPU-bound parallelism
            requires <code>multiprocessing</code>. Java has no GIL: threads run truly in parallel on
            separate CPU cores, sharing heap memory. More powerful, but requires explicit synchronization.
          </p>
          <CodeBlock>{`// Python — GIL limits CPU parallelism
from threading import Thread
threads = [Thread(target=cpu_heavy) for _ in range(4)]
// 4 threads "run" but take turns — net: ~1 core used

// Java — real parallelism across all cores
for (int i = 0; i < 4; i++) {
    new Thread(() -> cpuHeavy()).start();
}
// All 4 run simultaneously — 4 cores fully used`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Platform Threads vs Virtual Threads</h4>
          <table className="theory-table">
            <thead><tr><th></th><th>Platform Thread</th><th>Virtual Thread (Java 21+)</th></tr></thead>
            <tbody>
              <tr><td><strong>Backed by</strong></td><td>OS thread — 1:1 mapping</td><td>Carrier thread pool — M:N mapping</td></tr>
              <tr><td><strong>Cost</strong></td><td>~1 MB stack, expensive context switch</td><td>~few KB, cheap mount/unmount</td></tr>
              <tr><td><strong>Scale</strong></td><td>Thousands (OS-limited)</td><td>Millions</td></tr>
              <tr><td><strong>Blocking I/O</strong></td><td>Blocks the OS thread</td><td>Parks the virtual thread, releases carrier</td></tr>
              <tr><td><strong>Spring Boot</strong></td><td>Default pre-3.2</td><td>One property, Spring Boot 3.2+</td></tr>
            </tbody>
          </table>
          <CodeBlock>{`# Enable Virtual Threads — Spring Boot 3.2+ (Java 21+)
spring.threads.virtual.enabled=true
# Spring Boot wires Tomcat, @Async, and scheduled tasks to use virtual threads`}</CodeBlock>
          <CodeBlock>{`// Same blocking code — Virtual Threads make it scale massively
@GetMapping("/employee/{id}")
public Employee getEmployee(@PathVariable Long id) {
    return service.getById(id); // blocks during DB query — that's fine now
    // Platform threads: 200 concurrent requests → 200 OS threads
    // Virtual threads:  1M concurrent requests → 1M virtual, ~8 carrier threads`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Thread safety essentials</h4>
          <CodeBlock>{`// UNSAFE — race condition on shared mutable state
@Service  // singleton — one instance shared across all threads
public class CounterService {
    private int count = 0;
    public void increment() { count++; } // read-modify-write is NOT atomic
}

// SAFE — AtomicInteger (lock-free CAS operations)
@Service
public class CounterService {
    private final AtomicInteger count = new AtomicInteger(0);
    public void increment() { count.incrementAndGet(); }
}

// SAFEST — immutable objects (Java records)
record EmployeeSnapshot(Long id, String name, Double salary) {}
// Immutable — safe to share across any number of threads, no locking needed`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "build-tools",
    title: "Build Tools — Maven & Gradle",
    level: "intermediate",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Maven vs pip + venv</h4>
          <table className="theory-table">
            <thead><tr><th></th><th>Python (pip + venv)</th><th>Java (Maven)</th></tr></thead>
            <tbody>
              <tr><td><strong>Manifest</strong></td><td><code>requirements.txt</code></td><td><code>pom.xml</code></td></tr>
              <tr><td><strong>Env isolation</strong></td><td><code>venv/</code> per project</td><td><code>~/.m2/repository</code> global cache</td></tr>
              <tr><td><strong>Install</strong></td><td><code>pip install -r requirements.txt</code></td><td><code>mvn dependency:resolve</code></td></tr>
              <tr><td><strong>Run</strong></td><td><code>python main.py</code></td><td><code>mvn spring-boot:run</code></td></tr>
              <tr><td><strong>Package</strong></td><td>No standard — <code>pip wheel</code></td><td><code>mvn package</code> → fat JAR</td></tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>2. Maven lifecycle</h4>
          <CodeBlock>{`// Phases execute in order — running "package" runs all phases before it:
//
//  validate  → check pom.xml is valid
//  compile   → javac src/main/java/ → target/classes/
//  test      → run JUnit/Mockito tests in src/test/java/
//  package   → bundle classes into JAR → target/app.jar
//  verify    → integration tests
//  install   → copy JAR to ~/.m2/repository (available to other local projects)
//  deploy    → upload to remote repo (Nexus, Artifactory)

mvn compile                  // compile only
mvn test                     // compile + test
mvn package                  // compile + test + JAR
mvn package -DskipTests      // skip tests (faster during dev)
mvn spring-boot:run          // compile + run (no JAR needed)`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. pom.xml — key sections</h4>
          <CodeBlock>{`<project>
  <groupId>com.brawnedbrainlearning</groupId>   <!-- namespace, like Python package -->
  <artifactId>springboot-learning</artifactId>  <!-- project name -->
  <version>0.0.1-SNAPSHOT</version>             <!-- SNAPSHOT = in development -->

  <!-- Inherit Spring Boot's curated dependency versions — no need to specify versions -->
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
  </parent>

  <dependencies>
    <!-- Starters bundle compatible deps — like "pip install django[rest_framework]" -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
      <!-- No version — inherited from parent -->
    </dependency>

    <!-- test scope — excluded from final JAR -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>4. Gradle — the modern alternative</h4>
          <CodeBlock>{`// build.gradle (Kotlin DSL — modern standard)
plugins {
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.4"
    id("java")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// ./gradlew bootRun    — run
// ./gradlew bootJar    — package
// ./gradlew test       — test only`}</CodeBlock>
          <p className="theory-note">
            Gradle is faster for large projects (incremental builds, build cache).
            Maven is more common in enterprise Java. Spring Initializr supports both.
          </p>
        </div>
      </>
    ),
  },

  {
    id: "streams-lambdas",
    title: "Streams & Lambdas",
    level: "intermediate",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Lambdas — anonymous functions</h4>
          <CodeBlock>{`// Python lambda
double = lambda x: x * 2
employees.sort(key=lambda e: e.salary)

// Java lambda
Function<Integer, Integer> doubler = x -> x * 2;
employees.sort((a, b) -> Double.compare(a.getSalary(), b.getSalary()));

// Method reference — shorthand when lambda just calls one method
employees.forEach(System.out::println);    // e -> System.out.println(e)
employees.stream().map(Employee::getName); // e -> e.getName()`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Stream API vs Python list comprehensions</h4>
          <CodeBlock>{`// Python
names = [e.name for e in employees if e.salary > 80000]
total = sum(e.salary for e in employees)
by_team = {}
for e in employees:
    by_team.setdefault(e.team_id, []).append(e)

// Java — equivalent
List<String> names = employees.stream()
    .filter(e -> e.getSalary() > 80000)     // if condition
    .map(Employee::getName)                 // transform
    .collect(Collectors.toList());          // materialise

double total = employees.stream()
    .mapToDouble(Employee::getSalary)
    .sum();

Map<Long, List<Employee>> byTeam = employees.stream()
    .collect(Collectors.groupingBy(Employee::getTeamId));`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Lazy evaluation — streams are pipelines</h4>
          <CodeBlock>{`// Intermediate (lazy — nothing runs): filter, map, flatMap, sorted, limit, skip
// Terminal (triggers execution): collect, forEach, count, findFirst, anyMatch, reduce

Stream<Employee> pipeline = employees.stream()
    .filter(e -> e.getSalary() > 80000)  // not executed yet
    .map(Employee::getName);             // not executed yet

// Nothing has happened. Pipeline is just a description.
List<String> result = pipeline.collect(Collectors.toList()); // runs NOW`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>4. Optional — null-safe chaining</h4>
          <CodeBlock>{`// JpaRepository.findById() returns Optional<T>
Optional<Employee> opt = repo.findById(id);

// Throw if absent
Employee emp = opt.orElseThrow(() -> new EmployeeNotFoundException(id));

// Provide default
String name = opt.map(Employee::getName).orElse("Unknown");

// Chain safely — equivalent to Python's "if e and e.salary > 80000"
opt.filter(e -> e.getSalary() > 80000)
   .map(Employee::getName)
   .ifPresent(n -> System.out.println("High earner: " + n));`}</CodeBlock>
        </div>
      </>
    ),
  },

  // ══════════════════════════════════════════════════════
  // PHASE 2 · ADVANCED — Spring Boot Internals
  // ══════════════════════════════════════════════════════

  {
    id: "ioc-di",
    title: "IoC & Dependency Injection — Deep Dive",
    level: "advanced",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. The ApplicationContext — Spring's object graph</h4>
          <CodeBlock>{`// Boot startup sequence:
//  1. SpringApplication.run() → creates ApplicationContext
//  2. Component scan — finds all @Component, @Service, @Repository, @Controller
//  3. Resolves dependency graph (who needs what, in what order)
//  4. Instantiates beans in dependency order
//  5. Injects dependencies via constructors
//  6. Calls @PostConstruct methods
//  7. App ready to serve requests`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Bean scopes</h4>
          <CodeBlock>{`// SINGLETON (default) — one instance per ApplicationContext
// All threads share the same instance → must be stateless or thread-safe
@Service
public class EmployeeService { /* stateless — safe */ }

// PROTOTYPE — new instance every injection/getBean call
@Service
@Scope("prototype")
public class ReportBuilder {
    private final List<String> lines = new ArrayList<>(); // safe — each caller gets fresh instance
}

// REQUEST — one per HTTP request (web apps)
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext {
    private final String traceId = UUID.randomUUID().toString();
}
// proxyMode needed so a singleton bean can hold a reference to a request-scoped bean`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Constructor injection — the right way</h4>
          <CodeBlock>{`// FIELD injection — common but problematic
@Service
public class EmployeeService {
    @Autowired
    private EmployeeRepository repo; // can't be final, hides deps, hard to test
}

// CONSTRUCTOR injection — recommended
@Service
public class EmployeeService {
    private final EmployeeRepository repo; // final — immutable, obvious dependency

    public EmployeeService(EmployeeRepository repo) { // @Autowired optional (Spring 4.3+)
        this.repo = repo;
    }
}

// Testing is trivial — no Spring context needed:
@Test
void test() {
    EmployeeRepository mockRepo = mock(EmployeeRepository.class);
    EmployeeService svc = new EmployeeService(mockRepo); // plain constructor
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>4. Conditional beans with @Profile</h4>
          <CodeBlock>{`public interface NotificationService {
    void notify(String message);
}

@Service
@Profile("dev")
public class LogNotificationService implements NotificationService {
    public void notify(String msg) { System.out.println("[DEV] " + msg); }
}

@Service
@Profile("prod")
public class SlackNotificationService implements NotificationService {
    public void notify(String msg) { /* POST to Slack webhook */ }
}

// EmployeeService always injects NotificationService
// Spring picks the right impl based on spring.profiles.active
@Service
public class EmployeeService {
    private final NotificationService notificationService;
    public EmployeeService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
}`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "aop",
    title: "Aspect-Oriented Programming (AOP)",
    level: "advanced",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. The problem — cross-cutting concerns</h4>
          <p>
            Logging, transactions, security, and caching would otherwise be copy-pasted into every method.
            AOP lets you write them once and apply them declaratively via annotations.
          </p>
          <CodeBlock>{`// WITHOUT AOP — logging/timing in every method
public Employee getById(Long id) {
    long start = System.currentTimeMillis();
    log.info("getById id={}", id);
    try {
        Employee emp = repo.findById(id).orElseThrow(...);
        log.info("completed in {}ms", System.currentTimeMillis() - start);
        return emp;
    } catch (Exception e) { log.error("failed", e); throw e; }
}
// ...copy-pasted into every service method

// WITH AOP — zero boilerplate in business code
public Employee getById(Long id) {
    return repo.findById(id).orElseThrow(...); // clean!
} // @LogExecutionTime aspect handles all logging`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. How AOP works — proxies</h4>
          <p>
            Spring doesn't modify your bytecode. It wraps your bean in a <strong>proxy</strong> at startup.
            Calling a method means calling the proxy first, which runs advice, then delegates to your real object.
          </p>
          <CodeBlock>{`// What Spring actually creates for @Transactional (conceptually):
public class EmployeeService$$SpringProxy extends EmployeeService {
    @Override
    public Employee create(Employee emp) {
        TransactionManager.begin();
        try {
            Employee result = super.create(emp); // your real code
            TransactionManager.commit();
            return result;
        } catch (RuntimeException e) {
            TransactionManager.rollback();
            throw e;
        }
    }
}

// CRITICAL PITFALL — self-invocation bypasses the proxy!
@Service
public class EmployeeService {
    @Transactional
    public void createBatch(List<Employee> emps) {
        emps.forEach(e -> createSingle(e)); // calls THIS object, not the proxy → NO transaction!
    }

    @Transactional
    public void createSingle(Employee emp) { ... }
    // Fix: inject self, use @Transactional(propagation = REQUIRES_NEW), or restructure
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Writing a custom aspect</h4>
          <CodeBlock>{`// Step 1 — custom annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogExecutionTime {}

// Step 2 — the aspect
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("@annotation(LogExecutionTime)")
    public Object logTime(ProceedingJoinPoint jp) throws Throwable {
        long start = System.currentTimeMillis();
        String method = jp.getSignature().toShortString();
        try {
            Object result = jp.proceed(); // run the actual method
            log.info("{} OK in {}ms", method, System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("{} FAILED after {}ms", method, System.currentTimeMillis() - start, e);
            throw e;
        }
    }
}

// Step 3 — annotate and forget
@Service
public class EmployeeService {
    @LogExecutionTime
    public Page<Employee> getAll(int page, int size) {
        return repo.findAll(PageRequest.of(page, size));
    }
}`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "jpa-hibernate",
    title: "Spring Data JPA & Hibernate Internals",
    level: "advanced",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. The Persistence Context — first-level cache</h4>
          <p>
            Hibernate's unit of work. Within one <code>@Transactional</code> method, the same DB row
            always returns the same Java object. Dirty checking auto-detects changes — no explicit <code>save()</code> needed.
          </p>
          <CodeBlock>{`@Transactional
public void demonstratePersistenceContext(Long id) {
    Employee emp1 = repo.findById(id).get(); // SELECT * FROM employees WHERE id=?
    Employee emp2 = repo.findById(id).get(); // NO SQL — served from persistence context

    System.out.println(emp1 == emp2); // true — same Java object

    emp1.setName("Alice Updated");
    // No repo.save(emp1) needed!
    // At commit, Hibernate dirty-checks all managed entities → issues UPDATE automatically
} // ← transaction commits, UPDATE fires`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. The N+1 problem</h4>
          <CodeBlock>{`// PROBLEM — lazy loading fires N extra queries
@Entity
public class Employee {
    @ManyToOne(fetch = FetchType.LAZY) // default
    @JoinColumn(name = "team_id")
    private Team team;
}

@Transactional
public void badPattern() {
    List<Employee> emps = repo.findAll();     // 1 query
    for (Employee e : emps) {
        System.out.println(e.getTeam().getName()); // 1 query × N — the N+1 problem
    }
}

// FIX 1 — JOIN FETCH in JPQL (single query)
@Query("SELECT e FROM Employee e JOIN FETCH e.team")
List<Employee> findAllWithTeam();

// FIX 2 — @EntityGraph (no custom query)
@EntityGraph(attributePaths = {"team"})
List<Employee> findAll();

// FIX 3 — Projection (only fetch what the client needs)
public interface EmployeeView {
    String getName();
    String getTeamName(); // Spring resolves this via JOIN
}
List<EmployeeView> findAllProjectedBy();`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Hibernate vs SQLAlchemy</h4>
          <table className="theory-table">
            <thead><tr><th></th><th>SQLAlchemy (Python)</th><th>Hibernate / JPA (Java)</th></tr></thead>
            <tbody>
              <tr><td><strong>Session</strong></td><td><code>Session</code> — explicit open/close</td><td><code>EntityManager</code> — managed by <code>@Transactional</code></td></tr>
              <tr><td><strong>Query language</strong></td><td>Python ORM API / raw SQL</td><td>JPQL (object SQL) / Criteria API</td></tr>
              <tr><td><strong>Lazy loading</strong></td><td><code>lazy=True</code></td><td><code>FetchType.LAZY</code></td></tr>
              <tr><td><strong>Dirty tracking</strong></td><td>Manual <code>session.add()</code></td><td>Automatic in <code>@Transactional</code></td></tr>
              <tr><td><strong>Generated queries</strong></td><td>Query API</td><td>Method naming in <code>JpaRepository</code></td></tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },

  {
    id: "auto-configuration",
    title: "Auto-configuration Deep Dive",
    level: "advanced",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. What @SpringBootApplication actually is</h4>
          <CodeBlock>{`@SpringBootApplication
// composed of three annotations:

@SpringBootConfiguration   // = @Configuration — can define @Bean methods
@EnableAutoConfiguration   // scan META-INF/spring/*.AutoConfiguration.imports
@ComponentScan             // find @Component, @Service, etc. in this package tree
public class SpringBootLearningApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringBootLearningApplication.class, args);
    }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. How Spring "guesses" what to configure</h4>
          <CodeBlock>{`// Inside DataSourceAutoConfiguration (simplified):
@Configuration
@ConditionalOnClass(DataSource.class)           // only if DataSource.class is on classpath
@ConditionalOnMissingBean(DataSource.class)     // only if YOU haven't defined one
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    public DataSource dataSource(DataSourceProperties props) {
        return DataSourceBuilder.create()
            .url(props.getUrl())
            .username(props.getUsername())
            .build();
    }
}

// Key conditionals:
// @ConditionalOnClass      — is this class on the classpath?
// @ConditionalOnMissingBean — has the user NOT defined this bean?
// @ConditionalOnProperty   — is spring.some.property=true in application.properties?
// @ConditionalOnWebApplication — is this a web app?`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Overriding auto-configuration</h4>
          <CodeBlock>{`// Your @Bean always wins — Spring Boot backs off
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:postgresql://primary:5432/employee_db")
            .username("app")
            .build();
    }
}

// Debug: see exactly what auto-config ran and why
// java -jar app.jar --debug
// Prints a "CONDITIONS EVALUATION REPORT":
//   DataSourceAutoConfiguration MATCHED — @ConditionalOnClass found DataSource
//   SecurityAutoConfiguration MATCHED — spring-security on classpath
//   FlywayAutoConfiguration DID NOT MATCH — Flyway not on classpath`}</CodeBlock>
        </div>
      </>
    ),
  },

  // ══════════════════════════════════════════════════════
  // PHASE 3 · SENIOR — Distributed Systems & Production
  // ══════════════════════════════════════════════════════

  {
    id: "spring-cloud",
    title: "Spring Cloud & Microservices",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Problems microservices introduce</h4>
          <CodeBlock>{`// Splitting a monolith into services replaces in-process calls with network calls.
// Spring Cloud solves the resulting problems:
//
//  Service Discovery  — how does Service A find Service B's IP/port?
//    → Eureka Server (Netflix OSS) or Kubernetes DNS
//
//  Config Management  — how do 20 services share and hot-reload config?
//    → Spring Cloud Config Server
//
//  Routing            — how does the client reach the right service?
//    → Spring Cloud Gateway (API Gateway pattern)
//
//  Resilience         — what happens when Service B is down?
//    → Resilience4j — Circuit Breaker, Retry, Rate Limiter
//
//  Tracing            — how do you follow one request across 5 services?
//    → Micrometer Tracing + Zipkin / Jaeger`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Service Discovery with Eureka</h4>
          <CodeBlock>{`// Eureka Server — the service registry
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication { ... }

# application.properties — Eureka Server
server.port=8761
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false`}</CodeBlock>
          <CodeBlock>{`// Employee Service — registers itself at startup
@SpringBootApplication
@EnableDiscoveryClient
public class EmployeeServiceApplication { ... }

# application.properties — Employee Service
spring.application.name=employee-service
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/`}</CodeBlock>
          <CodeBlock>{`// Call team-service by NAME — no hardcoded URLs
@FeignClient(name = "team-service")   // OpenFeign declarative HTTP client
public interface TeamClient {
    @GetMapping("/api/teams/{id}")
    Team getTeam(@PathVariable Long id);
}
// Eureka resolves "team-service" → actual host:port at runtime
// Spring Cloud LoadBalancer distributes across multiple instances`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. API Gateway</h4>
          <CodeBlock>{`# application.yml — Spring Cloud Gateway routes all traffic
spring:
  cloud:
    gateway:
      routes:
        - id: employee-service
          uri: lb://employee-service   # lb:// = load-balanced via Eureka
          predicates:
            - Path=/api/employees/**
          filters:
            - AddRequestHeader=X-Internal, true

        - id: team-service
          uri: lb://team-service
          predicates:
            - Path=/api/teams/**
          filters:
            - CircuitBreaker=name:team-cb,fallbackUri:forward:/fallback/teams`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "resiliency",
    title: "Resiliency — Circuit Breaker & Rate Limiting",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Circuit Breaker — fail fast, recover gracefully</h4>
          <p>
            Without a circuit breaker, a slow downstream service causes threads to pile up and
            your service crashes too (cascading failure). The circuit breaker detects repeated
            failures and "opens" — immediately returning an error instead of waiting.
          </p>
          <CodeBlock>{`// Circuit states:
//  CLOSED   → normal, all calls pass through
//  OPEN     → failing, calls fail immediately (no network call)
//  HALF_OPEN → recovery test — allows a few calls through, reopens if they fail

@Service
public class TeamClient {

    @CircuitBreaker(name = "teamService", fallbackMethod = "fallbackTeam")
    @Retry(name = "teamService")      // retry up to 3x before circuit opens
    public Team getTeam(Long id) {
        return restTemplate.getForObject("http://team-service/api/teams/" + id, Team.class);
    }

    // Fallback — called when circuit OPEN or retries exhausted
    public Team fallbackTeam(Long id, Exception ex) {
        log.warn("Team service down for id={}, using default", id);
        Team fallback = new Team();
        fallback.setName("Unknown Team");
        return fallback;
    }
}`}</CodeBlock>
          <CodeBlock>{`# application.properties — Resilience4j config
resilience4j.circuitbreaker.instances.teamService.sliding-window-size=10
resilience4j.circuitbreaker.instances.teamService.failure-rate-threshold=50
# open if 50% of last 10 calls fail

resilience4j.circuitbreaker.instances.teamService.wait-duration-in-open-state=10s
# stay open for 10s then test recovery

resilience4j.retry.instances.teamService.max-attempts=3
resilience4j.retry.instances.teamService.wait-duration=500ms`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Rate Limiting</h4>
          <CodeBlock>{`@RestController
public class EmployeeController {

    @GetMapping("/api/employees")
    @RateLimiter(name = "employeeApi", fallbackMethod = "rateLimitFallback")
    public Page<Employee> getAll(@RequestParam(defaultValue = "0") int page) {
        return service.getAll(page, 10);
    }

    public Page<Employee> rateLimitFallback(int page, RequestNotPermitted ex) {
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
    }
}

# application.properties
resilience4j.ratelimiter.instances.employeeApi.limit-for-period=100
resilience4j.ratelimiter.instances.employeeApi.limit-refresh-period=1s
resilience4j.ratelimiter.instances.employeeApi.timeout-duration=0
# reject immediately (don't queue waiting callers)`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "observability",
    title: "Observability — Actuator, Micrometer & Prometheus",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. Spring Boot Actuator</h4>
          <CodeBlock>{`# application.properties — expose endpoints
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=always

# Built-in endpoints:
# GET /actuator/health   → { "status": "UP", "components": { "db": { "status": "UP" } } }
# GET /actuator/metrics  → list of available metrics
# GET /actuator/metrics/http.server.requests → latency, count, by status/method/uri
# GET /actuator/info     → app version, git commit, build time`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Custom metrics with Micrometer</h4>
          <CodeBlock>{`@Service
public class EmployeeService {

    private final Counter createdCounter;
    private final Timer queryTimer;

    public EmployeeService(MeterRegistry registry, EmployeeRepository repo) {
        this.repo = repo;
        this.createdCounter = Counter.builder("employee.created.total")
            .description("Total employees created")
            .register(registry);
        this.queryTimer = Timer.builder("employee.query.duration")
            .description("DB query time")
            .register(registry);
    }

    public Employee create(Employee emp) {
        Employee saved = repo.save(emp);
        createdCounter.increment();      // bump counter on each create
        return saved;
    }

    public Page<Employee> getAll(int page, int size) {
        return queryTimer.record(() ->   // measure DB call duration
            repo.findAll(PageRequest.of(page, size))
        );
    }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Prometheus + Grafana</h4>
          <CodeBlock>{`# GET /actuator/prometheus → Prometheus text-format metrics

# prometheus.yml — scrape config
scrape_configs:
  - job_name: 'springboot-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
    scrape_interval: 15s

# Useful Grafana PromQL queries:
#
# Request rate (req/s):
#   rate(http_server_requests_seconds_count[1m])
#
# p95 latency:
#   histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
#
# JVM heap used:
#   jvm_memory_used_bytes{area="heap"}
#
# Custom metric:
#   employee_created_total`}</CodeBlock>
        </div>
      </>
    ),
  },

  {
    id: "security",
    title: "Security — OAuth2/JWT & Spring Security Filters",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>1. The Spring Security filter chain</h4>
          <p>
            Spring Security is a chain of servlet filters intercepting every request
            before it reaches your controller. The order matters.
          </p>
          <CodeBlock>{`// Simplified filter chain (most relevant):
//
//  Request
//    ↓
//  SecurityContextPersistenceFilter     → loads SecurityContext (session or JWT)
//    ↓
//  BearerTokenAuthenticationFilter      → extracts & validates JWT from Authorization header
//    ↓                                    (added when oauth2ResourceServer() configured)
//  ExceptionTranslationFilter           → AccessDeniedException → 403, AuthException → 401
//    ↓
//  AuthorizationFilter                  → enforces hasRole(), @PreAuthorize rules
//    ↓
//  Your @RestController`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>2. Configuring the chain</h4>
          <CodeBlock>{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize on methods
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())            // stateless REST — no CSRF needed
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/employees").hasAnyRole("VIEWER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/employees").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            // ↑ validates Bearer JWTs using public key from your auth server (Keycloak, Auth0)
            .build();
    }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>3. Using the authenticated user in controllers</h4>
          <CodeBlock>{`@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @GetMapping("/me")
    public ResponseEntity<String> getProfile(
        @AuthenticationPrincipal Jwt jwt  // Spring injects the validated JWT
    ) {
        String userId = jwt.getSubject();                        // "sub" claim
        List<String> roles = jwt.getClaimAsStringList("roles"); // custom claim
        return ResponseEntity.ok("Hello " + userId + ", roles=" + roles);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @employeePolicy.isOwner(authentication, #id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>4. Connecting to an auth server</h4>
          <CodeBlock>{`# application.properties — validate JWTs from Keycloak / Auth0 / Okta
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.example.com/realms/myapp
# Spring fetches JWKS automatically from {issuer-uri}/.well-known/openid-configuration
# and caches the public key for signature verification

# For Keycloak specifically:
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://auth.example.com/realms/myapp/protocol/openid-connect/certs`}</CodeBlock>
        </div>
      </>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpringBootTheory() {
  const [activeLevel, setActiveLevel] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = activeLevel === "all"
    ? SUBJECTS
    : SUBJECTS.filter((s) => s.level === activeLevel);

  const selectedSubject = SUBJECTS.find((s) => s.id === selected);
  const selectedIndex   = filtered.findIndex((s) => s.id === selected);

  return (
    <div className="theory-module">
      <div className="theory-level-filter">
        <button
          className={`theory-filter-btn${activeLevel === "all" ? " active" : ""}`}
          onClick={() => setActiveLevel("all")}
        >
          All
        </button>
        {Object.entries(LEVELS).map(([key, { label, color }]) => (
          <button
            key={key}
            className={`theory-filter-btn${activeLevel === key ? " active" : ""}`}
            onClick={() => setActiveLevel(key)}
          >
            <span className="theory-filter-dot" style={{ background: color }} />
            {label}
          </button>
        ))}
      </div>

      {!selected && (
        <div className="theory-subject-list">
          {filtered.length === 0 ? (
            <p className="theory-empty">No topics for this level.</p>
          ) : (
            filtered.map((s) => (
              <button key={s.id} className="theory-subject-btn" onClick={() => setSelected(s.id)}>
                <span className="theory-subject-dot" style={{ background: LEVELS[s.level].color }} />
                <span className="theory-subject-title">{s.title}</span>
                <span className="theory-subject-arrow">›</span>
              </button>
            ))
          )}
        </div>
      )}

      {selected && selectedSubject && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="theory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="theory-modal-header">
              <div className="theory-modal-title-row">
                <h3>{selectedSubject.title}</h3>
                <span
                  className="theory-level-badge"
                  style={{ background: LEVELS[selectedSubject.level].color }}
                >
                  {LEVELS[selectedSubject.level].label}
                </span>
              </div>
              <div className="theory-modal-meta">
                <span className="theory-modal-counter">{selectedIndex + 1} / {filtered.length}</span>
                <button className="theory-modal-close" onClick={() => setSelected(null)}>×</button>
              </div>
            </div>
            <div className="theory-modal-body">{selectedSubject.content}</div>
            <div className="modal-nav-row">
              <button
                className="modal-nav-btn"
                disabled={selectedIndex === 0}
                onClick={() => setSelected(filtered[selectedIndex - 1].id)}
              >← Prev</button>
              <button className="modal-close-inline" onClick={() => setSelected(null)}>Close</button>
              <button
                className="modal-nav-btn"
                disabled={selectedIndex === filtered.length - 1}
                onClick={() => setSelected(filtered[selectedIndex + 1].id)}
              >Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

# 1. Django vs Flask vs FastAPI (plus Express and Spring Boot)
# | **Aspect**      | **Django**                       | **Flask**                 | **FastAPI**                | **Express**               | **Spring Boot**                     |
# | --------------- | -------------------------------- | ------------------------- | -------------------------- | ------------------------- | ----------------------------------- |
# | **Philosophy**  | Batteries included               | Micro, assemble yourself  | Micro + typed, API-first   | Micro, assemble yourself  | Opinionated, convention over config |
# | **Concurrency** | Sync-first (async views partial) | Sync (WSGI)               | Async-first (ASGI)         | Async via event loop      | Thread-per-request (servlet)        |
# | **Validation**  | Forms/serializers                | Manual or extensions      | Pydantic, automatic        | Manual, zod/joi           | Bean Validation annotations         |
# | **Auth**        | Sessions built in                | Extensions (JWT-Extended) | Hand-built with DI helpers | Middleware (jsonwebtoken) | Spring Security                     |
# | **ORM**         | Django ORM                       | SQLAlchemy via extension  | SQLAlchemy/Tortoise        | Mongoose (ODM)            | JPA/Hibernate                       |
# | **Admin**       | Free                             | None                      | None                       | None                      | None                                |
# | **API docs**    | None built in (DRF adds it)      | Third-party               | Free (Swagger + ReDoc)     | Third-party               | springdoc                           |
# | **Wiring**      | Settings + URLconf               | App factory + blueprints  | Routers + Depends          | Router + middleware       | Dependency Injection + annotations  |


# What each of your builds actually showed you:

# Django: the admin, forms, CSRF, session auth and templates came for free. You wrote almost no plumbing. The cost is that everything is shaped by Django's conventions, and a JSON API needs DRF on top.
# Flask: you assembled everything yourself: app factory, blueprints, JWT-Extended and error handlers. That gives full control and a tiny core. The cost is that validation and docs are yours to build, and hand-rolled JSON validation is where bugs like PUT null-outs creep in.
# FastAPI: validation, serialization and OpenAPI docs came out of the type hints. The Depends system makes auth and DB sessions composable. The cost is that async only pays off with async I/O libraries. A blocking call inside async def stalls the whole event loop, as you saw in your debug.py timings.
# Express (closest analogue to FastAPI's model): a single-threaded event loop with non-blocking I/O, so the same "don't block the loop" rule applies. Middleware chains map to FastAPI middleware and Depends.
# Spring Boot: a DI container with annotations, Bean Validation (the Pydantic analogue) and springdoc for OpenAPI. It's heavier at startup and has more ceremony, but very strong typing and tooling for large teams.

# Heuristics for "when would you pick which":

# Pick Django when you need a full-stack product fast, with a built-in admin, auth and ORM, especially for content-heavy or internal tools. Avoid it when you're building a tiny single-purpose service.
# Pick Flask for small services, prototypes, or when you want to choose every component. Avoid it when a large team needs enforced structure, since Flask enforces nothing.
# Pick FastAPI for API-first services, especially I/O-heavy, concurrent, or ML-serving ones where typed contracts and auto-docs matter. Avoid it when you need an admin or server-rendered pages out of the box.
# Pick Express when the team is JS-first and wants to share a language with the React frontend.
# Pick Spring Boot for enterprise, JVM-standard environments with long-lived codebases and large teams.

# A good interview answer names the constraint (team, timeline, workload) before naming the framework.

# 2. MVC vs microservice architectures
# MVC / MTV
# Classic MVC separates Model (data), View (UI) and Controller (input handling).
# Django calls its version MTV: Model, Template, View, where Django's "view" plays the controller role and the URLconf does the routing. Spring MVC follows the classic naming (@Controller).
# Flask and FastAPI enforce no pattern. In your REST builds, the "view" layer is effectively JSON serialization (Pydantic schemas in FastAPI), and good projects add layers themselves: routes → services → repositories/models.

# Monolith → modular monolith → microservices
# | **Aspect**        | **Monolith**              | **Microservices**                                          |
# | ----------------- | ------------------------- | ---------------------------------------------------------- |
# | **Deploy**        | One unit                  | Independent per service                                    |
# | **Scale**         | Scale everything together | Scale hot services alone                                   |
# | **Data**          | One DB, ACID transactions | DB per service, eventual consistency                       |
# | **Failure modes** | In-process errors         | Network failures, timeouts, partial failure                |
# | **Overhead**      | Low                       | Service discovery, API gateway, tracing, CI/CD per service |
# | **Team fit**      | Small teams               | Many teams needing autonomy                                |

# Costs people forget: distributed transactions (no cross-service JOIN or rollback), observability (tracing one request across services), versioning contracts between services, and operational burden.
# Applied to your Tracker: it is correctly a monolith. If it had to split, the natural seams would be auth, applications/notes, and a reminder/notification worker. The classic pairing for your background is a Django or Spring monolith for the core product with a small FastAPI service for ML inference, since that workload has different scaling and dependency needs.
# Sync vs async between services: REST calls are simple but couple availability. Message queues (RabbitMQ, Kafka, Celery tasks) decouple services at the cost of eventual consistency.

# 3. ORM and scalability trade-offs

# Pattern differences
# | **Aspect**     | **Django ORM**  | **SQLAlchemy**                    | **Mongoose**               | **JPA/Hibernate**               |
# | -------------- | --------------- | --------------------------------- | -------------------------- | ------------------------------- |
# | **Pattern**    | Active Record   | Data Mapper + Unit of Work        | ODM (documents)            | Data Mapper (EntityManager)     |
# | **Querying**   | Lazy `QuerySet` | Core and ORM, explicit `select()` | Query builder + `populate` | JPQL, Criteria, derived queries |
# | **Migrations** | Built in        | Alembic (Flask-Migrate wraps it)  | None built in              | Flyway/Liquibase                |
# | **Async**      | Partial         | Yes (`AsyncSession`)              | Native                     | Reactive variants only          |

# The N+1 problem exists in every one of them:
# Django: 1 query for applications + 1 per application for .company
for app in Application.objects.all():
    print(app.company.name)

# Fix: JOIN for FK/one-to-one, separate IN query for reverse/M2M
Application.objects.select_related("company")
Application.objects.prefetch_related("notes")

# SQLAlchemy equivalent fix
from sqlalchemy.orm import selectinload
select(Application).options(selectinload(Application.notes))

# In Hibernate it's JOIN FETCH or @EntityGraph. In Mongoose, populate() has the same pitfall.
# Async-specific gotcha: with async SQLAlchemy, a lazy attribute load outside an awaited call raises MissingGreenlet. You must eager-load relationships (selectinload/joinedload) because implicit lazy loading can't happen in the event loop. Hibernate has the analogous LazyInitializationException.

# Scalability levers (in the order they usually matter):

# Query shape: fix N+1, add indexes, paginate, select only needed columns.
# Connection pooling: the pool size must match worker count, or you exhaust DB connections.
# Caching: Redis for hot reads.
# Horizontal scaling: run more workers (gunicorn/uvicorn) behind a load balancer. This works when the app is stateless, which favours JWT over server-side sessions. Sessions need a shared store (DB, Redis).
# Read replicas and sharding: later-stage problems.

# Key insight: async does not make slow queries faster. It only lets one worker serve other requests while waiting. If the DB is the bottleneck, async won't save you.

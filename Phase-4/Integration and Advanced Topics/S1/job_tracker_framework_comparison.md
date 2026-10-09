# Job Tracker Framework Comparison

## Scope and method

This report compares the uploaded **Django**, **Flask**, and **FastAPI**
Job Tracker builds.

### Measurement method

-   **LOC:** custom Python source counter: counts non-empty, non-comment
    lines in application source. Migrations, tests, virtual
    environments, generated files, and caches are excluded.
-   **Routes/endpoints:** counted from route declarations in the source.
    A route declaration with multiple HTTP methods is counted as one
    route declaration.
-   **Modules/files:** counted as Python source files in the application
    package, excluding migrations and `__pycache__`.
-   **Tests:** counted from active test functions/methods in the
    uploaded source. Commented-out tests do not count.
-   **Dependencies:** the first dependency figure below is **directly
    imported third-party packages in the project source/tests**. A
    second figure records all entries in `requirements.txt` where one
    exists.
-   Runtime tests and SQL-query measurements could not be completed in
    this analysis environment because the uploaded projects'
    dependencies are not installed. Those results are explicitly marked
    rather than guessed.

------------------------------------------------------------------------

# Part A --- Measured facts

  -----------------------------------------------------------------------------------------------
  Metric                              Django                   Flask                      FastAPI
  ---------------- ------------------------- ----------------------- ----------------------------
  **Lines of app                     **189**                 **218**                      **904**
  code**                                                             

  **LOC method**      Custom Python counter;     Same method; `app/`  Same method; `app/` package
                        comments/blank lines            package only                         only
                        removed; migrations,                         
                         tests and generated                         
                       Django files excluded                         

  **Direct                  **1** (`django`)         **8** (`flask`,   **9** (`fastapi`, `httpx`,
  imported                                     `flask-jwt-extended`, `jwt`, `pwdlib`, `pydantic`,
  3rd-party                                         `flask-migrate`,         `pydantic-settings`,
  packages**                                     `flask-sqlalchemy`,      `pytest`, `sqlalchemy`,
                                              `flask-wtf`, `pytest`,                 `starlette`)
                                              `werkzeug`, `wtforms`) 

  **Declared         **Not declared** --- no                  **23**                       **35**
  requirements     `requirements.txt` in the                         
  entries**                       Django ZIP                         

  **Route           **8**: 1 admin mount + 4                  **15**  **21** in the actual `app/`
  declarations**     application + 3 account                                              package
                                      routes                         

  **Modules /      **20** source `.py` files    **13** under `app/`,          **19** under `app/`
  Python files in        across `accounts/`,         excluding cache 
  app package**         `applications/`, and                         
                   `job_tracker/`, excluding                         
                            migrations/cache                         

  **Active tests**                     **0**                  **14**                        **1**

  **Auth**           **Free/configured** ---          **Configured +  **Hand-built + configured**
                      Django auth, sessions,        hand-built** ---    --- JWT creation/decoding
                         `UserCreationForm`,      Flask-JWT-Extended    and password handling are
                   `LoginView`, `LogoutView` supplies JWT machinery;      application code, wired
                                                  register/login and through FastAPI dependencies
                                               password verification 
                                              are written in the app 

  **Validation**     **Free/configured** ---           **Mixed** ---      **Free/configured** ---
                         `UserCreationForm`,   Flask-WTF/WTForms for       Pydantic models, field
                       `ModelForm`, password the HTML form; JSON API   constraints and validators
                                  validators           validation is 
                                                        hand-written 

  **Migrations**         **Free** --- Django      **Configured** ---   **Configured** --- Alembic
                                  migrations   Flask-Migrate/Alembic 

  **Admin**        **Free** --- Django admin                **None**                     **None**
                     is mounted at `/admin/`                         

  **API docs**                      **None**                **None**         **Free** --- FastAPI
                                                                                        generates
                                                                            OpenAPI/Swagger/ReDoc
                                                                                         metadata

  **Error                **Mostly free** ---      **Hand-built** ---    **Configured/hand-built**
  handling**          Django's 404 machinery  custom `NotFoundError`  --- FastAPI `HTTPException`
                    plus `get_object_or_404`  and JSON error handler   plus centralized ownership
                                                                                       dependency

  **CORS**                **Not configured**      **Not configured**          **Configured** with
                                                                                 `CORSMiddleware`

  **Real bug /          The project has **no   The codebase contains       `app/routers/notes.py`
  friction**            active tests**: both       **two application                      imports
                     `accounts/tests.py` and      implementations**:   **`get_application_or_404`
                     `applications/tests.py`      simple placeholder  from `app.deps`**, but that
                         are only empty test               routes in      function is not defined
                                  scaffolds. `app/routes.py` and the        there; this is a real
                                             real JWT/SQLAlchemy API      import/startup friction
                                                               under                       point.
                                                `/api/applications`, 
                                                increasing ambiguity 
                                                 about which path is 
                                                      authoritative. 
  -----------------------------------------------------------------------------------------------

### Test execution note

I attempted to execute the supplied test suites, but the analysis
environment does not contain the projects' dependencies:

-   Flask suite: collection stopped with
    `ModuleNotFoundError: No module named 'flask'`.
-   Django suite: `ModuleNotFoundError: No module named 'django'`.
-   FastAPI suite: collection stopped because `aiosqlite` is not
    installed.

Therefore the **test counts above are source-measured counts**, not
claims about passing tests.

------------------------------------------------------------------------

# Part B --- One operation, three implementations

## Scenario

A logged-in user attempts to read or modify another user's application
(or its note).

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
                    Django                                                        Flask                                   FastAPI
  ----------------- ------------------------------------------------------------- --------------------------------------- ---------------------------------------------
  **Where the check `applications/views.py`.                                      `app/applications/routes.py`. Each      `app/deps.py`. `get_owned_application()`
  happens**         `ApplicationDetailView.get_queryset()` filters by             detail/update/delete endpoint loads the queries with both
                    `user=self.request.user`; `application_edit()` uses           application and then explicitly         `Application.id == application_id` and
                    `get_object_or_404(Application, pk=pk, user=request.user)`.   compares `application.user_id` with the `Application.owner_id == user.id`, and is
                                                                                  JWT identity.                           injected into application and note endpoints.

  **Status + error  **404**. Django's normal object-not-found response is used    **404**, JSON body:                     **404**, JSON body:
  body**            rather than exposing an authorization-specific 403.           `{"error": "Application not found"}`.   `{"detail": "Application <id> not found"}`.
                                                                                  `NotFoundError` is translated by the    The same ownership dependency is used for
                                                                                  central Flask error handler.            application and note access.

  **Repeated or     The ownership filtering is repeated in the list/detail/edit   The ownership check is repeated in each **Centralized.** `get_owned_application()` is
  centralized?**    views rather than one shared authorization dependency.        protected application endpoint. The     a reusable FastAPI dependency and is applied
                                                                                  error-to-JSON conversion is             to multiple endpoints, including notes.
                                                                                  centralized, but the ownership decision 
                                                                                  is not.                                 
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

### 404 vs 403 decision

All three builds make the **same 404 choice** for a cross-user
application: they hide the existence of the other user's resource rather
than returning 403. I would keep that choice aligned across the Job
Tracker because it gives the API/UI one predictable security behavior
and avoids leaking whether another user's application ID exists.

------------------------------------------------------------------------

# Part C --- ORM query check

## What endpoint was selected?

The requirement asks for an application-list endpoint that also touches
a relationship.

-   **Django:** the list view itself does not touch notes; the closest
    relationship-touching operation is `ApplicationDetailView`, which
    loads the application's notes.
-   **Flask:** the active `Application` model has its notes relationship
    commented out, so the application list endpoint does **not**
    currently touch a relationship. The closest active operation is
    `GET /api/applications`.
-   **FastAPI:** `GET /applications` returns applications but does not
    load notes. The closest relationship-touching endpoint is
    `GET /applications/{application_id}`, which uses
    `selectinload(Application.notes)`.

## SQL logging mechanisms

  -----------------------------------------------------------------------
  Framework                           Logging mechanism
  ----------------------------------- -----------------------------------
  Django                              Enable `django.db.backends` logging
                                      at `DEBUG`, or inspect
                                      `django.db.connection.queries`
                                      during a request/test.

  Flask / SQLAlchemy                  Enable SQLAlchemy engine logging /
                                      `echo=True`, or attach an
                                      SQLAlchemy `before_cursor_execute`
                                      listener.

  FastAPI / SQLAlchemy                Enable SQLAlchemy engine logging /
                                      `echo=True`, or attach the same
                                      SQLAlchemy query counter to the
                                      async engine's sync engine.
  -----------------------------------------------------------------------

## Query measurement status

A runtime query count was **not claimed as measured** because the
supplied projects cannot currently be executed in the analysis
environment without installing their dependencies. The source does,
however, make the expected query behavior clear:

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------
                 Endpoint selected                      Expected query behavior from source                    N+1?               Eager-loading fix
  -------------- -------------------------------------- ------------------------------------------------------ ------------------ -----------------------------------
  **Django**     `ApplicationDetailView`                One query to retrieve the owned application, then one  **No N+1 for one   If a future list view renders notes
                                                        query for `self.object.Notes.all()` → **about 2        application**; the for many applications, use
                                                        queries for one application detail request**           notes are fetched  `prefetch_related('Notes')`
                                                                                                               as one collection  
                                                                                                               query              

  **Flask**      `GET /api/applications`                One query:                                             **No active        If notes are re-enabled and
                                                        `Application.query.filter_by(user_id=user_id).all()` → relationship       serialized per application, use
                                                        **about 1 query**                                      load**; notes      SQLAlchemy eager loading such as
                                                                                                               relationship is    `selectinload`/`joinedload` as
                                                                                                               commented out      appropriate

  **FastAPI**    `GET /applications/{application_id}`   Ownership query plus `selectinload(Application.notes)` **No N+1** because Already fixed with
                                                        → **about 2 SQL queries** for the application + notes  `selectinload()`   `selectinload(Application.notes)`
                                                                                                               batches the        
                                                                                                               collection         
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------

### What a lazy-loading mistake looks like

-   **Django:** accessing `application.notes.all()` for every item in a
    list without `prefetch_related()` can silently create one extra
    query per application, producing an N+1 pattern.
-   **Flask / SQLAlchemy:** a relationship accessed inside a loop can
    issue additional lazy-load queries; the mistake may look normal in
    synchronous code while the SQL count grows with the number of
    applications.
-   **FastAPI / async SQLAlchemy:** lazy relationship access is more
    dangerous: the code explicitly comments that lazy loading can fail
    in async usage, so relationship data should be loaded with an
    async-safe eager-loading strategy such as `selectinload()`.

### Important measurement limitation

For a user with approximately **5 applications and several notes each**,
the source strongly suggests that the Django and FastAPI detail
implementations avoid N+1 for their selected relationship access, while
the active Flask API currently does not load notes at all. A final
numeric before/after SQL count should be recorded after installing each
project's dependencies and running the request with SQL logging enabled;
it would be misleading to invent those runtime numbers from static
source inspection.

------------------------------------------------------------------------

# Part D --- Draft matrix and decision statements

## Comparison matrix

  -----------------------------------------------------------------------------------------------------------------------------------
  Aspect            Django            Flask                FastAPI                    Express               Spring Boot
  ----------------- ----------------- -------------------- -------------------------- --------------------- -------------------------
  **Setup time**    Low for a full    Low initial setup,   Low for an API; the build  Low initial setup;    Higher initial ceremony,
                    web app; the      but more assembly is gets routing, validation   assemble middleware   but strong conventions
                    build gets auth,  required; the build  and API schema generation  and libraries as      reduce architectural
                    admin, forms and  wires JWT,           quickly                    needed                decisions later
                    migrations from   migrations and forms                                                  
                    the framework     separately                                                            

  **Boilerplate**   **189 measured    **218 measured app   **904 measured app LOC**;  Moderate; highly      Moderate to high;
                    app LOC**; many   LOC**; lightweight   more explicit API layers,  dependent on selected annotations,
                    capabilities are  core but several     schemas, CRUD, security    middleware/packages   configuration and
                    supplied by       capabilities are     and dependencies                                 ecosystem conventions
                    Django            assembled                                                             

  **Validation**    Model/forms       WTForms for HTML;    Pydantic provides typed    Usually               Bean Validation
                    validation is     JSON API validation  validation and field       middleware/schema     annotations
                    built in          is manual            constraints                library such as       
                                                                                      Zod/Joi               

  **Auth**          Built-in          JWT extension plus   JWT/security dependencies  Usually JWT/session   Spring Security
                    sessions/auth     hand-built           plus FastAPI DI;           middleware and        
                    views/forms       registration/login   substantial application    application code      
                                                           code                                             

  **Docs**          No API docs in    No API docs          OpenAPI/Swagger/ReDoc      Usually third-party   Commonly
                    this build                             generated from the API     OpenAPI tooling       springdoc/OpenAPI
                                                           definitions                                      

  **Testing**       **0 active        **14 active tests**  **1 active pytest test**   Test stack is         Strong JUnit/Spring
                    tests** in        in uploaded build    in                         ecosystem-dependent   testing ecosystem
                    uploaded build                         `tests/test_session3.py`                         

  **Concurrency     Sync-first with   WSGI/sync-first      ASGI/async-first           Event loop /          Servlet
  model**           async support                                                     asynchronous I/O      thread-per-request by
                                                                                                            default; reactive options
                                                                                                            exist

  **ORM**           Django ORM        SQLAlchemy through   SQLAlchemy async in the    Commonly Mongoose for JPA/Hibernate
                                      Flask-SQLAlchemy     main build                 MongoDB or another    
                                                                                      ORM/ODM               

  **Deployment      Straightforward   Straightforward, but Straightforward ASGI       Straightforward       More
  complexity**      single            assembled extensions deployment; async stack    single service;       ecosystem/configuration
                    application       must be configured   and dependencies add some  middleware choices    overhead, but mature
                    deployment                             operational considerations affect complexity     production conventions
  -----------------------------------------------------------------------------------------------------------------------------------

## Decision statements

### Django

> I would pick **Django** when **the Job Tracker needs a complete
> server-rendered web application with authentication, forms, admin and
> database migrations quickly**, because **the build is only 189
> measured application LOC and gets built-in authentication, validation,
> migrations and admin without implementing those systems from
> scratch**.

### Flask

> I would pick **Flask** when **I want a small service with maximum
> control over which components are assembled**, because **the build is
> only 218 measured application LOC and lets the application explicitly
> choose JWT authentication, SQLAlchemy, Flask-Migrate and WTForms
> rather than adopting a large integrated framework**.

### FastAPI

> I would pick **FastAPI** when **the main constraint is an API-first
> service with typed validation and asynchronous database access**,
> because **the build uses Pydantic validation, generated OpenAPI
> documentation, dependency-based ownership checks and SQLAlchemy's
> async session/eager-loading support**.

### When I would not pick one

> I would *not* pick **FastAPI** when **the primary goal is the smallest
> possible conventional CRUD web application**, because **this build
> reached 904 measured application LOC and has substantially more
> explicit API-layer code than the 189-LOC Django build, while Django
> already supplies several web-application features for free**.

------------------------------------------------------------------------

# Should the Job Tracker be microservices?

**No --- I would keep the Job Tracker as a monolith at its current
stage.** The uploaded builds are small: the largest application source
is **904 measured LOC**, while the Django and Flask versions are **189
and 218 LOC** respectively, so splitting them into separately deployed
services would add operational complexity without an evident scaling
boundary. I would reconsider microservices only when a component has an
independent scaling requirement, separate team ownership, or a
deployment/lifecycle requirement that justifies network boundaries and
distributed-system overhead.

------------------------------------------------------------------------

# Overall conclusion

The three builds demonstrate different trade-offs more clearly than a
framework feature checklist alone.

-   **Django** minimizes application code and maximizes built-in
    functionality.
-   **Flask** provides the smallest conceptual core while allowing the
    developer to assemble the exact stack needed.
-   **FastAPI** provides the strongest API-oriented developer experience
    and async/type-driven structure, but the uploaded build is
    considerably more explicit and therefore larger.
-   The authorization comparison is particularly useful: all three
    deliberately return **404** for another user's application, but
    FastAPI has the cleanest centralization through a reusable
    dependency.
-   The ORM comparison also shows that eager loading is important
    regardless of framework: Django needs `prefetch_related()` for
    collection-heavy lists, while SQLAlchemy uses tools such as
    `selectinload()`.
-   The largest practical weakness across the uploads is not the
    framework itself but project maturity: the Django build has no
    active tests, the Flask build contains overlapping placeholder and
    API routes, and the FastAPI build contains an unresolved import in
    the notes router.

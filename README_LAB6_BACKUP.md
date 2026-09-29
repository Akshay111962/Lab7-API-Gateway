# Lab 6 — Docker & Microservices: Decomposing and Running the Backend as Independent Services
### Web Services & Service-Oriented Architecture (WSSOA) Laboratory

> **Course**: Web Services & SOA (Lab 6)  
> **Technologies**: Docker, Docker Compose, Node.js (Express.js), MongoDB, Mongoose, Axios, Microservices Architecture, RESTful APIs, Postman  
> **Architecture Pattern**: Microservices Decomposition, Database-per-Service, Bridge Networking, Inter-Service REST Validation, Fail-Fast Fault Tolerance  

---

## Table of Contents
1. [Project Overview & Relationship to Previous Labs](#1-project-overview--relationship-to-previous-labs)
2. [Microservices Architecture Diagram](#2-microservices-architecture-diagram)
3. [Service Responsibilities & Service Boundaries](#3-service-responsibilities--service-boundaries)
4. [Service Ports & Complete REST Endpoint Mapping](#4-service-ports--complete-rest-endpoint-mapping)
5. [Database-per-Service Pattern & Data Ownership](#5-database-per-service-pattern--data-ownership)
6. [Service-to-Service Communication Flow](#6-service-to-service-communication-flow)
7. [Inter-Service Error Handling & Fault Resilience](#7-inter-service-error-handling--fault-resilience)
8. [Dockerfile Architecture for Each Service](#8-dockerfile-architecture-for-each-service)
9. [Docker Image Build Commands](#9-docker-image-build-commands)
10. [Docker Shared Network & DNS Communication](#10-docker-shared-network--dns-communication)
11. [Environment Variables & Configuration](#11-environment-variables--configuration)
12. [Docker Compose Multi-Service Orchestration](#12-docker-compose-multi-service-orchestration)
13. [How to Run Each Service Independently](#13-how-to-run-each-service-independently)
14. [Section 16: Microservices API & Communication Exercise](#14-section-16-microservices-api--communication-exercise)
15. [Postman Testing Guide & Verification Workflow](#15-postman-testing-guide--verification-workflow)
16. [Troubleshooting Issues & Resolutions](#16-troubleshooting-issues--resolutions)
17. [Final Submission Checklist](#17-final-submission-checklist)

---

## 1. Project Overview & Relationship to Previous Labs

In previous labs, the **CampusConnect** application was progressively engineered:
* **Lab 1 & 2**: Designed frontend user interfaces and consumed REST APIs.
* **Lab 3**: Developed monolithic Express.js backend RESTful web services supporting CRUD operations.
* **Lab 4**: Connected heterogeneous clients (React Vite web client + Native Android Kotlin mobile application) to a unified API backend with MongoDB persistence.
* **Lab 5**: Packaged the monolithic backend into an isolated Docker container with automated Docker Compose orchestration, container networking, and persistent volumes.
* **Lab 6 (Current)**: Decomposed the monolithic backend into three independently runnable, containerized microservices:
  1. **User Microservice** (`user-service`) — Manages student and faculty accounts.
  2. **Product Microservice** (`product-service`) — Manages academic supplies and catalog items.
  3. **Order Microservice** (`order-service`) — Orchestrates order placement, calculates totals, and validates users and products via inter-service REST calls.

---

## 2. Microservices Architecture Diagram

```
+───────────────────────────────────────────────────────────────────────────────────────────────────+
│                                        DOCKER HOST SYSTEM                                         │
│                                                                                                   │
│   [Postman / Client]                                                                              │
│            │                                                                                      │
│            │ (HTTP REST External Requests via Published Host Ports)                               │
│            ├──────────────────────────┬───────────────────────────┐                               │
│            ▼ :3001                    ▼ :3002                     ▼ :3003                         │
│   ┌───────────────────┐      ┌─────────────────────┐     ┌──────────────────────┐                 │
│   │   user-service    │      │   product-service   │     │    order-service     │                 │
│   │   (Port 3001)     │      │   (Port 3002)       │     │    (Port 3003)       │                 │
│   └────────┬──────────┘      └──────────┬──────────┘     └──────────┬───────────┘                 │
│            │                            │                           │                             │
│            │                            │                           │ (HTTP REST Synchronous)     │
│            │◄───────────────────────────┼───────────────────────────┤ GET /users/{id}             │
│            │                            │                           │ (Validate User)             │
│            │                            │◄──────────────────────────┤                             │
│            │                            │                           │ GET /products/{id}          │
│            │                            │                           │ (Validate Product & Price)  │
│            │                            │                           │                             │
│   ═════════╪════════════════════════════╪═══════════════════════════╪══════════════════════════   │
│            │   SHARED DOCKER BRIDGE NETWORK: campus-network         │                             │
│            │                                                        │                             │
│            │ mongodb:27017/             │ mongodb:27017/            │ mongodb:27017/              │
│            │ campusconnect_users        │ campusconnect_products    │ campusconnect_orders        │
│            ▼                            ▼                           ▼                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────┐     │
│   │                              Container: mongodb (Port 27017)                            │     │
│   │                 (Shared Database Engine with Database-per-Service Isolation)            │     │
│   └────────────────────────────────────────────┬────────────────────────────────────────────┘     │
│                                                │                                                  │
│                                                ▼ Mount: /data/db                                  │
│                                 ┌─────────────────────────────┐                                   │
│                                 │ Named Volume:               │                                   │
│                                 │ campus-mongo-data           │                                   │
│                                 └─────────────────────────────┘                                   │
+───────────────────────────────────────────────────────────────────────────────────────────────────+
```

### Architectural Key Characteristics:
1. **No Shared Direct Database Access**: Order Service never queries User or Product collections directly. It strictly queries their respective HTTP REST APIs.
2. **Container DNS Resolution**: Container-to-container traffic uses service names (`http://user-service:3001`, `http://product-service:3002`) resolved by Docker's internal embedded DNS server.
3. **Conceptual API Gateway**: The architecture is designed such that a reverse-proxy gateway (e.g. Nginx or Kong) can be placed in front of `:3001`, `:3002`, and `:3003` to unify client access under a single port.

---

## 3. Service Responsibilities & Service Boundaries

| Service | Domain Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **User Service** | Identity, student/faculty profile registration, user updates, and lifecycle management. | Exclusively owns `campusconnect_users` DB. |
| **Product Service** | Campus inventory, textbook listings, pricing, and category management. | Exclusively owns `campusconnect_products` DB. |
| **Order Service** | Checkout processing, total calculation, order persistence, and cross-service validation. | Exclusively owns `campusconnect_orders` DB. |

---

## 4. Service Ports & Complete REST Endpoint Mapping

### User Microservice (`:3001`)
* `GET /` — Service health check & metadata
* `GET /users` — Retrieve all registered users
* `GET /users/:id` — Retrieve a specific user by ID (e.g., `101`)
* `POST /users` — Create a new user account
* `PUT /users/:id` — Update user profile details
* `DELETE /users/:id` — Delete a user account

### Product Microservice (`:3002`)
* `GET /` — Service health check & metadata
* `GET /products` — Retrieve all product listings
* `GET /products/:id` — Retrieve a single product by ID (e.g., `501`)
* `POST /products` — Create a new product in the catalog
* `PUT /products/:id` — Update product price, stock, or description
* `DELETE /products/:id` — Delete a product listing

### Order Microservice (`:3003`)
* `GET /` — Service health check & dependency status
* `GET /orders` — Retrieve all placed orders
* `GET /orders/:id` — Retrieve specific order details by ID
* `POST /orders` — Create, validate, and place an order (invokes User and Product services)

---

## 5. Database-per-Service Pattern & Data Ownership

To preserve loose coupling and service independence:
* **User Service** connects to `mongodb://mongodb:27017/campusconnect_users`
* **Product Service** connects to `mongodb://mongodb:27017/campusconnect_products`
* **Order Service** connects to `mongodb://mongodb:27017/campusconnect_orders`

Each microservice manages its own schema definitions, indexes, and transactions. If `user-service` alters its internal schema, `order-service` is unaffected as long as the external REST API contract remains unchanged.

---

## 6. Service-to-Service Communication Flow

When a client sends `POST http://localhost:3003/orders`:
```json
{
  "userId": "101",
  "productId": "501",
  "quantity": 2
}
```

The Order Service executes the following sequence:
1. **User Validation**: Sends `GET http://user-service:3001/users/101`.
   - If User exists (`200 OK`), extracts user information.
   - If User not found (`404`), halts and returns `404 Dependency Not Found`.
2. **Product Validation**: Sends `GET http://product-service:3002/products/501`.
   - If Product exists (`200 OK`), verifies price and details.
   - If Product not found (`404`), halts and returns `404 Dependency Not Found`.
3. **Total Calculation & Persistence**:
   - Computes `totalAmount = product.price * quantity`.
   - Saves the confirmed order in `campusconnect_orders`.
   - Responds to the client with `201 Created`.

---

## 7. Inter-Service Error Handling & Fault Resilience

Microservices must never hang or produce unhandled stack traces when dependencies fail. The Order Service implements:
* **Fail-Fast HTTP Timeout**: Axios client configured with a `3000ms` timeout.
* **Invalid Resource (404)**: If `userId` or `productId` does not exist in the upstream service, returns:
  ```json
  {
    "service": "order-service",
    "error": "Dependency Not Found",
    "message": "User with ID '999' was not found in User Service.",
    "targetService": "user-service"
  }
  ```
* **Dependency Outage (503 Service Unavailable)**: If `user-service` is stopped, the connection error is caught and converted into a controlled `503`:
  ```json
  {
    "service": "order-service",
    "error": "Service Unavailable",
    "message": "User Service is currently unavailable at http://user-service:3001. Inter-service dependency failure.",
    "targetService": "user-service"
  }
  ```

---

## 8. Dockerfile Architecture for Each Service

All three microservices use identical, highly-optimized multi-layer Dockerfiles based on `node:20-alpine`:

```dockerfile
# 1. Base Image: Minimal Alpine Linux with Node.js 20 LTS
FROM node:20-alpine

# 2. Working Directory inside container
WORKDIR /app

# 3. Layer Caching: Copy package manifests first
COPY package*.json ./

# 4. Install production dependencies only
RUN npm install --omit=dev

# 5. Copy microservice source code
COPY . .

# 6. Expose microservice listening port (3001 / 3002 / 3003)
EXPOSE 3001

# 7. Container Healthcheck declaration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# 8. Start service
CMD ["node", "server.js"]
```

---

## 9. Docker Image Build Commands

To build all three microservice images independently:

```powershell
# Build User Microservice Image
docker build -t user-service:v1 ./user-service

# Build Product Microservice Image
docker build -t product-service:v1 ./product-service

# Build Order Microservice Image
docker build -t order-service:v1 ./order-service

# Verify built images
docker images
```

---

## 10. Docker Shared Network & DNS Communication

* **Network**: `campus-network` (bridge driver)
* Containers connected to `campus-network` resolve each other by container name without needing static IP addresses.
* Container-to-container calls **MUST NOT** use `localhost` (which resolves only to the calling container itself).
  - Correct: `http://user-service:3001`
  - Incorrect: `http://localhost:3001`

---

## 11. Environment Variables & Configuration

Service URLs and ports are injected via environment variables without hardcoded secrets:

| Variable | Service | Compose Value | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` / `USER_SERVICE_PORT` | `user-service` | `3001` | Service listening port |
| `MONGO_URI` | `user-service` | `mongodb://mongodb:27017/campusconnect_users` | User DB connection string |
| `PORT` / `PRODUCT_SERVICE_PORT` | `product-service` | `3002` | Service listening port |
| `MONGO_URI` | `product-service` | `mongodb://mongodb:27017/campusconnect_products` | Product DB connection string |
| `PORT` / `ORDER_SERVICE_PORT` | `order-service` | `3003` | Service listening port |
| `USER_SERVICE_URL` | `order-service` | `http://user-service:3001` | Target URL for User validation |
| `PRODUCT_SERVICE_URL` | `order-service` | `http://product-service:3002` | Target URL for Product validation |
| `MONGO_URI` | `order-service` | `mongodb://mongodb:27017/campusconnect_orders` | Order DB connection string |

---

## 12. Docker Compose Multi-Service Orchestration

The complete microservices stack is orchestrated via [`compose.yaml`](file:///c:/Lab_Sem3/WSSOA/Lab4/compose.yaml):

```powershell
# 1. Validate Compose configuration syntax
docker compose config

# 2. Build and start all 4 containers in detached mode
docker compose up -d --build

# 3. Check container status
docker compose ps

# 4. View aggregated real-time logs
docker compose logs -f

# 5. Stop and clean up stack
docker compose down
```

---

## 13. How to Run Each Service Independently

Each service can be run independently outside Docker (for unit debugging) or as standalone Docker containers:

### Standalone Local Execution:
```powershell
# In terminal 1:
cd user-service
npm install
npm start

# In terminal 2:
cd product-service
npm install
npm start

# In terminal 3:
cd order-service
npm install
npm start
```

### Standalone Docker Execution (with existing network):
```powershell
docker network create campus-network
docker run -d --name mongodb --network campus-network mongo:latest
docker run -d --name user-service -p 3001:3001 --network campus-network -e MONGO_URI=mongodb://mongodb:27017/campusconnect_users user-service:v1
docker run -d --name product-service -p 3002:3002 --network campus-network -e MONGO_URI=mongodb://mongodb:27017/campusconnect_products product-service:v1
docker run -d --name order-service -p 3003:3003 --network campus-network -e USER_SERVICE_URL=http://user-service:3001 -e PRODUCT_SERVICE_URL=http://product-service:3002 -e MONGO_URI=mongodb://mongodb:27017/campusconnect_orders order-service:v1
```

---

## 14. Section 16: Microservices API & Communication Exercise

### Exercise 1: Service Decomposition Design Table

| Item | User Service | Product Service | Order Service |
| :--- | :--- | :--- | :--- |
| **Responsibility** | Manage user accounts, student/faculty profiles, and credentials. | Manage academic catalog, product specifications, inventory, and pricing. | Coordinate order checkout, validate customers and items, and track order records. |
| **Port** | `:3001` | `:3002` | `:3003` |
| **Main Resources** | Users (`id`, `name`, `email`, `role`, `department`) | Products (`id`, `name`, `description`, `price`, `category`, `stock`) | Orders (`id`, `userId`, `items`, `totalAmount`, `status`, `createdAt`) |
| **Key Endpoints** | `GET /users`<br>`GET /users/:id`<br>`POST /users`<br>`PUT /users/:id`<br>`DELETE /users/:id` | `GET /products`<br>`GET /products/:id`<br>`POST /products`<br>`PUT /products/:id`<br>`DELETE /products/:id` | `GET /orders`<br>`GET /orders/:id`<br>`POST /orders` |
| **Data / Database** | User-owned (`campusconnect_users`) | Product-owned (`campusconnect_products`) | Order-owned (`campusconnect_orders`) |

### Exercise 2: Service-to-Service Call Specification

| Field | User Validation Call | Product Validation Call |
| :--- | :--- | :--- |
| **Calling Service** | `order-service` | `order-service` |
| **Target Service** | `user-service` | `product-service` |
| **HTTP Method** | `GET` | `GET` |
| **Endpoint** | `/users/{id}` (e.g. `/users/101`) | `/products/{id}` (e.g. `/products/501`) |
| **Request Data** | Referenced User ID in URL parameter | Referenced Product ID in URL parameter |
| **Expected Response** | `200 OK` + JSON representation of User | `200 OK` + JSON representation of Product |
| **Failure Response** | `404 Not Found` (invalid ID);<br>`503 Service Unavailable` (target down) | `404 Not Found` (invalid ID);<br>`503 Service Unavailable` (target down) |

---

## 15. Postman Testing Guide & Verification Workflow

A complete ready-to-import Postman collection is included in the project root:  
[`Microservices - Lab 6.postman_collection.json`](file:///c:/Lab_Sem3/WSSOA/Lab4/Microservices%20-%20Lab%206.postman_collection.json)

### Expected Verification Flow (PDF Section 15 & 19):

| Test Step | Target Endpoint | Expected Status | Evidence Description |
| :---: | :--- | :---: | :--- |
| **1** | `GET http://localhost:3001/users` | `200 OK` | Returns array of seed users (Aarav, Meera, Rohan). |
| **2** | `GET http://localhost:3002/products` | `200 OK` | Returns array of seed products (Textbook, Calculator, Coat). |
| **3** | `POST http://localhost:3003/orders`<br>`{ "userId": "101", "productId": "501", "quantity": 2 }` | `201 Created` | Successful inter-service order creation; total calculated ($99.98). |
| **4** | `POST http://localhost:3003/orders`<br>`{ "userId": "999", "productId": "501" }` | `404 Not Found` | Dependency validation failure: invalid User ID gracefully rejected. |
| **5** | **Simulate Dependency Outage**:<br>`docker stop user-service` | — | Stops User Microservice container. |
| **6** | `POST http://localhost:3003/orders`<br>`{ "userId": "101", "productId": "501" }` | `503 Service Unavailable` | Graceful failure: Order Service returns 503 instead of crashing. |
| **7** | **Simulate Recovery**:<br>`docker start user-service` | — | Restarts User Microservice container. |
| **8** | `POST http://localhost:3003/orders`<br>`{ "userId": "101", "productId": "501" }` | `201 Created` | Stack recovery verified; order completes successfully. |

---

## 16. Troubleshooting Issues & Resolutions

1. **Docker Daemon Connection Error (`open //./pipe/dockerDesktopLinuxEngine`)**:
   - *Cause*: Docker Desktop application is closed or restarting.
   - *Fix*: Start Docker Desktop from Windows Start menu, ensure WSL 2 backend finishes starting, then re-run `docker compose up -d`.
2. **503 Service Unavailable on Order Placement**:
   - *Cause*: `user-service` or `product-service` is not yet running or still initializing.
   - *Fix*: Verify container status with `docker compose ps` and confirm target ports `3001` and `3002` respond.
3. **Database Connection Errors**:
   - *Cause*: Container hostname `mongodb` was replaced with `localhost`.
   - *Fix*: Ensure internal connection strings inside container environment variables use `mongodb:27017` and NOT `localhost:27017`.

---

## 17. Final Submission Checklist

- [x] Three independently runnable services: User, Product, Order
- [x] Each service exposes and handles its own REST endpoints
- [x] Each service has a dedicated Dockerfile and `.dockerignore`
- [x] Services communicate over shared Docker network `campus-network`
- [x] Container URLs use DNS service names (`user-service`, `product-service`)
- [x] Database-per-service isolation implemented
- [x] `compose.yaml` orchestrates complete 4-container stack
- [x] Order -> User and Order -> Product inter-service validation verified
- [x] Controlled `503 Service Unavailable` and `404 Not Found` error handling verified
- [x] Postman Collection exported (`Microservices - Lab 6.postman_collection.json`)
- [x] Section 16 API & Communication Exercise completed
- [x] Documentation ([README.md](file:///c:/Lab_Sem3/WSSOA/Lab4/README.md)) fully updated for Lab 6

---

## 18. Lab 6 Submission Screenshots & Evidence Gallery

All verification screenshots have been systematically captured and organized in the [`Screenshort/`](./Screenshort) directory:

| Screenshot File | Type | Verification Description |
| :--- | :---: | :--- |
| [`01_docker_compose_build.png`](./Screenshort/01_docker_compose_build.png) | Docker | `docker compose up -d --build` loading build definitions and Dockerfiles |
| [`02_docker_compose_up_started.png`](./Screenshort/02_docker_compose_up_started.png) | Docker | Successful image builds, `campus-network` & volume creation, containers started |
| [`03_docker_compose_ps.png`](./Screenshort/03_docker_compose_ps.png) | Docker | `docker compose ps` showing `user-service`, `product-service`, `order-service`, and `mongodb` Up (healthy) |
| [`04_docker_network_inspect.png`](./Screenshort/04_docker_network_inspect.png) | Network | `docker network inspect campus-network` showing internal bridge IP allocation |
| [`05_postman_user_service_health.png`](./Screenshort/05_postman_user_service_health.png) | Postman | User Service Health Check (`GET :3001/`) returning `200 OK` |
| [`06_postman_get_all_users.png`](./Screenshort/06_postman_get_all_users.png) | Postman | User Service `GET :3001/users` returning seed users |
| [`07_postman_get_user_by_id.png`](./Screenshort/07_postman_get_user_by_id.png) | Postman | User Service `GET :3001/users/101` returning user data |
| [`08_postman_post_create_user.png`](./Screenshort/08_postman_post_create_user.png) | Postman | User Service `POST :3001/users` creating user 104 with `201 Created` |
| [`09_postman_put_update_user.png`](./Screenshort/09_postman_put_update_user.png) | Postman | User Service `PUT :3001/users/101` updating department with `200 OK` |
| [`10_postman_delete_user.png`](./Screenshort/10_postman_delete_user.png) | Postman | User Service `DELETE :3001/users/104` returning `200 OK` |
| [`11_postman_product_service_health.png`](./Screenshort/11_postman_product_service_health.png) | Postman | Product Service Health Check (`GET :3002/`) returning `200 OK` |
| [`12_postman_order_service_health.png`](./Screenshort/12_postman_order_service_health.png) | Postman | Order Service Health Check (`GET :3003/`) reporting dependencies |
| [`13_postman_order_interservice_call_201.png`](./Screenshort/13_postman_order_interservice_call_201.png) | Postman | Inter-service order creation (`POST :3003/orders`) validating User 101 & Product 501 (`201 Created`) |
| [`14_postman_order_invalid_user_404.png`](./Screenshort/14_postman_order_invalid_user_404.png) | Postman | Inter-service error validation: non-existent User ID returns `404 Dependency Not Found` |
| [`15_docker_images_tags.png`](./Screenshort/15_docker_images_tags.png) | Docker | `docker images` listing images with tags `user-service:v1`, `product-service:v1`, `order-service:v1` |
| [`16_postman_order_user_stopped_503.png`](./Screenshort/16_postman_order_user_stopped_503.png) | Postman / Fault | Dependency outage simulation: stopping User Service causes `POST :3003/orders` to return `503 Service Unavailable` |
| [`17_postman_order_recovery_201.png`](./Screenshort/17_postman_order_recovery_201.png) | Postman / Recovery | Stack recovery: restarting User Service restores order creation returning `201 Created` |


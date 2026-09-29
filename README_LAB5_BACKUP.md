# Lab 5 — Docker & Containerization: Dockerizing the Student REST API
### Web Services and Service-Oriented Architecture (WSSOA)

> **Course**: Web Services and SOA  
> **Assignment**: Lab 5 — Dockerizing the Lab 4 Student REST API & Database Environment  
> **Technologies**: Docker, Docker Compose, Node.js (Express.js), MongoDB, Mongoose, RESTful API  

---

## Table of Contents
1. [Project Overview & Relation to Lab 4](#1-project-overview--relation-to-lab-4)
2. [Docker Installation & Verification](#2-docker-installation--verification)
3. [Dockerfile Architecture & Explanation](#3-dockerfile-architecture--explanation)
4. [Building the Docker Image](#4-building-the-docker-image)
5. [Running the Container & Port Mapping](#5-running-the-container--port-mapping)
6. [API Verification with Postman](#6-api-verification-with-postman)
7. [Multi-Container Architecture & Docker Networking](#7-multi-container-architecture--docker-networking)
8. [Core Architectural Concept: localhost vs. mongodb Service Name](#8-core-architectural-concept-localhost-vs-mongodb-service-name)
9. [Environment Variable Configuration](#9-environment-variable-configuration)
10. [Data Persistence with Docker Volumes](#10-data-persistence-with-docker-volumes)
11. [Multi-Container Orchestration with Docker Compose](#11-multi-container-orchestration-with-docker-compose)
12. [Troubleshooting & Issues Resolved](#12-troubleshooting--issues-resolved)
13. [Submission Evidence Checklist (Items 22–39)](#13-submission-evidence-checklist-items-2239)
14. [Appendix: Lab 4 Multi-Client Reference](#14-appendix-lab-4-multi-client-reference)

---

## 1. Project Overview & Relation to Lab 4

This lab represents the containerization and cloud-readiness phase of our ongoing application:
* **Lab 1**: Created the CampusConnect frontend user interface.
* **Lab 2**: Integrated REST APIs into the frontend web client.
* **Lab 3**: Developed RESTful web services with Express.js supporting complete CRUD operations.
* **Lab 4**: Connected multiple heterogeneous clients (React Vite web app + Native Android Kotlin mobile app) to a unified Express.js REST API with MongoDB persistence.
* **Lab 5 (Current)**: Package and containerize the Student REST API and its MongoDB database into portable, isolated Docker containers, orchestrate inter-service networking, configure data persistence using Docker volumes, and automate multi-container deployment using Docker Compose.

```
+-------------------------------------------------------------------------------+
|                             DOCKER HOST SYSTEM                                |
|                                                                               |
|  [Host Port 3000]                                     [Host Port 27017]       |
|         │                                                     │               |
|         ▼                                                     ▼               |
|  ┌───────────────────────────────┐                 ┌───────────────────────┐  |
|  │  Container: student-api       │   DNS Bridge    │  Container: mongodb   │  |
|  │  Image: student-api:v1        │   Network       │  Image: mongo:latest  │  |
|  │  Internal IP: 172.18.0.3      │◄───────────────►│  Internal IP: 172.18.0.2 │  |
|  │  Listening: 3000              │  mongodb:27017  │  Listening: 27017     │  |
|  └───────────────────────────────┘                 └───────────┬───────────┘  |
|                                                                │              |
|                                                                ▼              |
|                                                    ┌───────────────────────┐  |
|                                                    │  Volume:              │  |
|                                                    │  student-mongo-data   │  |
|                                                    │  Mount: /data/db      │  |
|                                                    └───────────────────────┘  |
+-------------------------------------------------------------------------------+
```

---

## 2. Docker Installation & Verification

Docker Desktop for Windows was installed and configured with WSL 2 integration (Ubuntu backend).

### Verification Commands:
```powershell
# 1. Verify Docker CLI and Engine version
docker --version
# Output: Docker version 29.7.2, build a7dcaa6

# 2. Verify container runtime capability
docker run --rm hello-world
# Output: Hello from Docker! This message shows that your installation appears to be working correctly.
```

---

## 3. Dockerfile Architecture & Explanation

The `Dockerfile` is placed inside `student-api/Dockerfile` (and mirrored at project root):

```dockerfile
# 1. Base Image: Lightweight official Node.js 20 LTS runtime on Alpine Linux
FROM node:20-alpine

# 2. Working Directory: Set isolated workspace inside container
WORKDIR /app

# 3. Dependency Caching: Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# 4. Install Dependencies: Production modules installed directly inside the container
RUN npm install

# 5. Copy Application Source: Copy all application files (excluding patterns in .dockerignore)
COPY . .

# 6. Port Declaration: Document the API listening port
EXPOSE 3000

# 7. Start Command: Launch Express.js application via npm start script
CMD ["npm", "start"]
```

### Dockerignore (`.dockerignore`)
Prevents host artifacts and sensitive files from polluting the image context:
```
node_modules
npm-debug.log
.env
.git
.gitignore
.DS_Store
```

---

## 4. Building the Docker Image

The image is built using the `-t` (tag) flag:

```powershell
# Build the image from the student-api directory
docker build -t student-api:v1 ./student-api

# Confirm image creation
docker images
```

**Verification Output**:
```
IMAGE                      ID             DISK USAGE   CONTENT SIZE
student-api:v1             28101a0cba52        281MB         67.5MB
mongo                      5d7043a4ffe0        793MB          254MB
hello-world                7f4da0fc94bc       25.9kB         9.49kB
```

---

## 5. Running the Container & Port Mapping

Run the container in detached mode (`-d`) mapping host port 3000 to container port 3000:

```powershell
# Launch container with port mapping
docker run -d --name student-api -p 3000:3000 student-api:v1

# Inspect running container
docker ps
```

**Port Mapping Breakdown (`-p 3000:3000`)**:
* **Host Port (First 3000)**: Port exposed on the host machine (`localhost:3000` or `127.0.0.1:3000`).
* **Container Port (Second 3000)**: Internal port where Express.js is listening (`process.env.PORT || 3000`).
* Traffic arriving on host port 3000 is forwarded by Docker's proxy to container port 3000.

---

## 6. API Verification with Postman

Requests sent to `http://localhost:3000/students` confirm the containerized application correctly responds:

| Operation | HTTP Method & URI | Status Code | Description |
|-----------|-------------------|-------------|-------------|
| **Get All** | `GET /students` | `200 OK` | Retrieves array of all student records |
| **Get By ID** | `GET /students/:id` | `200 OK` | Retrieves specific student by UUID |
| **Create** | `POST /students` | `201 Created` | Inserts new student; generates UUID & timestamps |
| **Replace** | `PUT /students/:id` | `200 OK` | Replaces all fields of existing student |
| **Delete** | `DELETE /students/:id` | `204 No Content` | Removes student record |
| **Verify Delete** | `GET /students/:id` | `404 Not Found` | Confirms student no longer exists |

All requests were verified via automated scripts and Postman collection ([`Lab4.postman_collection.json`](Lab4.postman_collection.json)).

---

## 7. Multi-Container Architecture & Docker Networking

To connect the `student-api` container to `mongodb`, a custom user-defined bridge network is created:

```powershell
# 1. Create dedicated bridge network
docker network create student-network

# 2. Run MongoDB on the network
docker run -d --name mongodb --network student-network mongo

# 3. Run Student API on the network with MONGO_URI pointing to the mongodb service name
docker run -d --name student-api \
  --network student-network \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MONGO_URI=mongodb://mongodb:27017/campusconnect \
  student-api:v1

# 4. Verify both containers reside on the network
docker network inspect student-network
```

---

## 8. Core Architectural Concept: localhost vs. mongodb Service Name

### Why `localhost:27017` Fails Inside a Container:
* In Linux / Docker architecture, each container possesses its own isolated network namespace and loopback interface (`127.0.0.1` / `localhost`).
* When `student-api` executes inside its container, `localhost:27017` refers to the `student-api` container itself. Because MongoDB is running in a different container, no process is listening on port 27017 inside `student-api`, causing immediate connection refusal.

### How Docker Network DNS Solves This:
* Custom bridge networks (e.g. `student-network`) provide automatic **embedded DNS service discovery**.
* Docker registers the container name (`mongodb`) as an internal DNS host.
* When `student-api` connects to `mongodb://mongodb:27017/campusconnect`, Docker's internal DNS daemon resolves `mongodb` directly to the MongoDB container's internal IP address (e.g., `172.18.0.2`), establishing a direct, isolated TCP socket connection.

---

## 9. Environment Variable Configuration

To decouple application source code from specific infrastructure environments, database and port values are parameterized:

### Supported Environment Variables:
```env
# Server Port
PORT=3000

# MongoDB Connection String (Docker internal network)
MONGO_URI=mongodb://mongodb:27017/campusconnect

# Alternative connection strings for local development & cloud:
# MONGO_URI=mongodb://localhost:27017/campusconnect
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/student_db?retryWrites=true&w=majority
```

### Application Code Adaptation (`student-api/config/db.js`):
```javascript
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
```
This ensures zero hardcoding: the API connects to local Docker MongoDB, external Docker Compose networks, or MongoDB Atlas transparently.

---

## 10. Data Persistence with Docker Volumes

Containers have an ephemeral writable layer. Without volumes, destroying a database container destroys all stored data. Docker named volumes persist data on the host machine outside the container lifecycle.

### Persistence Verification Exercise:
1. **Create Named Volume**:
   ```powershell
   docker volume create student-mongo-data
   ```
2. **Mount Volume to MongoDB Data Directory**:
   ```powershell
   docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo
   ```
3. **Insert Record via REST API**:
   ```powershell
   POST http://localhost:3000/students
   Body: { "name": "Persistence Test Student", "email": "persistence.verify@university.edu", "course": "Cloud Computing", "semester": 6 }
   # Result: 201 Created (ID: 62beceb0-c34f-437a-813f-4cc8eaff1898)
   ```
4. **Destroy the MongoDB Container**:
   ```powershell
   docker stop mongodb
   docker rm mongodb
   ```
5. **Recreate Brand New MongoDB Container Reusing the Same Volume**:
   ```powershell
   docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo
   docker restart student-api
   ```
6. **Query the Record After Container Recreation**:
   ```powershell
   GET http://localhost:3000/students/62beceb0-c34f-437a-813f-4cc8eaff1898
   # Result: 200 OK | Student data returned intact!
   ```
**Conclusion**: Persistent volume `student-mongo-data` ensured zero data loss despite complete container deletion and replacement.

---

## 11. Multi-Container Orchestration with Docker Compose

`compose.yaml` orchestrates both services, handles dependencies, mounts persistent storage, and configures networking in a single declarative specification:

```yaml
services:
  api:
    build: ./student-api
    container_name: student-api
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      MONGO_URI: mongodb://mongodb:27017/campusconnect
    depends_on:
      - mongodb
    restart: always

  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - student-mongo-data:/data/db
    restart: always

volumes:
  student-mongo-data:
    name: student-mongo-data
```

### Compose Workflow Commands:
```powershell
# 1. Start application stack in background
docker compose up -d

# 2. View status of all running services
docker compose ps

# 3. View aggregated service logs
docker compose logs -f

# 4. Stop and remove containers, networks (preserves volumes)
docker compose down
```

---

## 12. Troubleshooting & Issues Resolved

| Issue Encountered | Root Cause | Solution Implemented |
|-------------------|------------|----------------------|
| **Docker Daemon not reachable on startup** | Docker Desktop engine was in idle/stopped state on Windows | Started `Docker Desktop.exe` using interactive shell launcher and verified daemon readiness with `docker ps`. |
| **`localhost:27017` connection refusal inside container** | Containers use isolated loopback namespaces | Configured custom bridge network `student-network` and set `MONGO_URI=mongodb://mongodb:27017/campusconnect` utilizing Docker DNS service discovery. |
| **Variable name mismatch (`MONGO_URI` vs `MONGODB_URI`)** | Lab 4 codebase used `MONGODB_URI` whereas Lab 5 specification mandated `MONGO_URI` | Updated `student-api/config/db.js` to check `process.env.MONGO_URI \|\| process.env.MONGODB_URI`, ensuring backward compatibility across both environments. |
| **Mongoose connection timeout when Atlas is offline** | MongoDB Atlas IP whitelist blocking local network | Added local containerized MongoDB service via Docker Compose and implemented graceful fallback in `data/store.js`. |
| **Volume recreation scoping in Compose** | Docker Compose prefixes volume names with project directory by default (`lab4_student-mongo-data`) | Added explicit `name: student-mongo-data` to `compose.yaml` to guarantee exact volume reuse and data persistence across manual and Compose workflows. |

---

## 13. Submission Evidence Checklist (Items 22–39)

Full command logs and output traces are compiled in [`screenshots/EVIDENCE.md`](screenshots/EVIDENCE.md), and image captures are organized in [`screenshots/README.md`](screenshots/README.md):

* [x] **22. Docker installation/version**: [`screenshot_22_docker_version.png`](screenshots/screenshot_22_docker_version.png) (`Docker version 29.7.2` & `hello-world`).
* [x] **23. Lab 4 Student REST API running before Dockerization**: Verified via local `node server.js` and `GET /students`.
* [x] **24. Dockerfile**: [`screenshot_24_dockerfile.png`](screenshots/screenshot_24_dockerfile.png) (Multi-stage `node:20-alpine` build configuration).
* [x] **25. Successful student-api:v1 image build**: [`screenshot_25_docker_build.png`](screenshots/screenshot_25_docker_build.png) (`docker build -t student-api:v1 .`).
* [x] **26. docker images output**: [`screenshot_26_docker_images.png`](screenshots/screenshot_26_docker_images.png) (`student-api:v1`, `mongo`, `hello-world`).
* [x] **27. Running Student API container using docker ps**: [`screenshot_27_docker_ps_api.png`](screenshots/screenshot_27_docker_ps_api.png) (`student-api` running with port `3000:3000` mapped).
* [x] **28. Postman / HTTP testing of containerized Student REST API**: [`screenshot_28_api_test.png`](screenshots/screenshot_28_api_test.png) (GET /students returning 200 OK).
* [x] **29. MongoDB container running**: [`screenshot_29_mongodb_running.png`](screenshots/screenshot_29_mongodb_running.png) (`mongodb` and `student-api` running).
* [x] **30. Docker network showing API and MongoDB containers**: [`screenshot_30_docker_network_inspect.png`](screenshots/screenshot_30_docker_network_inspect.png) (`student-network` inspect).
* [x] **31. Configuration showing MONGO_URI uses MongoDB service name**: [`screenshot_31_mongo_uri_connected.png`](screenshots/screenshot_31_mongo_uri_connected.png) (Connected to `mongodb:27017`).
* [x] **32. Environment-variable configuration**: [`screenshot_32_env_vars.png`](screenshots/screenshot_32_env_vars.png) (Verified `PORT=3000`, `MONGO_URI`).
* [x] **33. MongoDB volume creation/mounting**: [`screenshot_33_volume_inspect.png`](screenshots/screenshot_33_volume_inspect.png) (`student-mongo-data` volume inspect).
* [x] **34. Persistence test showing data remains after MongoDB container recreation**: [`screenshot_34_persistence_test.png`](screenshots/screenshot_34_persistence_test.png) (Data persisted across container deletion).
* [x] **35. Compose configuration**: [`screenshot_35_compose_yaml.png`](screenshots/screenshot_35_compose_yaml.png) (`compose.yaml` in VS Code).
* [x] **36. Successful docker compose up**: [`screenshot_36_compose_up.png`](screenshots/screenshot_36_compose_up.png) (`docker compose up -d`).
* [x] **37. docker compose ps output**: [`screenshot_37_compose_ps.png`](screenshots/screenshot_37_compose_ps.png) (Both services `Up` and port-mapped).
* [x] **38. Postman / browser testing of complete Compose-based application**: [`screenshot_38_compose_api_test.png`](screenshots/screenshot_38_compose_api_test.png) (Verified on Compose stack).
* [x] **39. Docker/Compose logs where relevant**: [`screenshot_39_compose_logs.png`](screenshots/screenshot_39_compose_logs.png) (`docker compose logs --tail 25`).

---

## 14. Appendix: Lab 4 Multi-Client Reference

For details on the React Web Client (`student-client`) and Android Mobile Client (`student-android`) integrated in Lab 4, see the original documentation preserved in [`screenshots/README.md`](screenshots/README.md).

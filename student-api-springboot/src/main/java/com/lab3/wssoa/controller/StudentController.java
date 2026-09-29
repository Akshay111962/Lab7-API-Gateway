package com.lab3.wssoa.controller;

import com.lab3.wssoa.model.Student;
import com.lab3.wssoa.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

/**
 * REST Controller for the Student resource.
 *
 * <p>Implements the HTTP layer: receives requests, delegates to
 * {@link StudentService}, and returns appropriate HTTP responses.
 *
 * <p>Lab 3 implements two equivalent endpoints (GET and POST) to
 * demonstrate the Controller → Service → Repository architecture
 * as a complement to the full Express.js CRUD implementation.
 *
 * <p>REST Design:
 * <ul>
 *   <li>Resource noun: {@code /students} (collection) and {@code /students/{id}} (item)</li>
 *   <li>HTTP method encodes the action: GET = read, POST = create</li>
 *   <li>Status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found</li>
 * </ul>
 */
@RestController
@RequestMapping("/students")
@Tag(name = "Students",
     description = "Equivalent GET and POST endpoints demonstrating Spring Boot's " +
                   "Controller → Service → Repository architecture. " +
                   "Compare with the complete Express.js CRUD implementation.")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /students  →  200 OK
    // ─────────────────────────────────────────────────────────────────────
    /**
     * Returns all students.
     *
     * <p>Flow: GET /students → {@code getAllStudents()} → Service →
     * Repository.findAll() → List&lt;Student&gt; → 200 OK
     */
    @Operation(
        summary     = "List all students",
        description = "Returns the complete in-memory student collection. " +
                      "An empty array is returned when no students are stored (never a 404). " +
                      "\n\n**Flow:** HTTP GET → Controller → Service.getAllStudents() " +
                      "→ Repository.findAll() → 200 OK"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successful retrieval",
            content = @Content(mediaType = "application/json",
                               schema = @Schema(implementation = Student.class))),
        @ApiResponse(responseCode = "500", description = "Internal Server Error",
            content = @Content(mediaType = "application/json"))
    })
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStudents() {
        List<Student> students = service.getAllStudents();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", 200);
        response.put("count", students.size());
        response.put("data", students);
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /students/{id}  →  200 OK  |  404 Not Found
    // ─────────────────────────────────────────────────────────────────────
    /**
     * Returns a single student by UUID.
     */
    @Operation(
        summary     = "Get a student by ID",
        description = "Fetches one student resource by UUID. Returns 404 if not found.\n\n" +
                      "**Flow:** GET /students/{id} → Controller → Service.getStudentById(id) " +
                      "→ Repository.findById(id) → 200 OK or 404"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student found",
            content = @Content(mediaType = "application/json",
                               schema = @Schema(implementation = Student.class))),
        @ApiResponse(responseCode = "404", description = "Student not found",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "500", description = "Internal Server Error",
            content = @Content(mediaType = "application/json"))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStudentById(
            @Parameter(description = "UUID of the student", required = true,
                       example = "a1b2c3d4-0001-0001-0001-000000000001")
            @PathVariable String id) {

        return service.getStudentById(id)
            .<ResponseEntity<Map<String, Object>>>map(student -> {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("status", 200);
                body.put("data", student);
                return ResponseEntity.ok(body);
            })
            .orElseGet(() -> {
                Map<String, Object> error = buildError(404, "Not Found",
                    "No student found with id: " + id, "/students/" + id);
                return ResponseEntity.status(404).body(error);
            });
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /students  →  201 Created  |  400 Bad Request
    // ─────────────────────────────────────────────────────────────────────
    /**
     * Creates a new student.
     *
     * <p>{@code @Valid} triggers Bean Validation before the method body runs.
     * If validation fails, Spring throws {@link MethodArgumentNotValidException}
     * which is caught by {@link #handleValidationErrors}.
     *
     * <p>Flow: POST /students (JSON body) → Spring validates (@Valid) →
     * {@code createStudent()} → Service.createStudent(body) →
     * Repository.save(newStudent) → 201 Created
     */
    @Operation(
        summary     = "Create a new student",
        description = "Creates a new student resource. All four fields are required. " +
                      "The server auto-generates the UUID and timestamps.\n\n" +
                      "**Flow:** POST /students → @Valid → Controller " +
                      "→ Service.createStudent() → Repository.save() → 201 Created\n\n" +
                      "Invalid fields → MethodArgumentNotValidException → 400 Bad Request"
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        required = true,
        content  = @Content(
            mediaType = "application/json",
            schema    = @Schema(implementation = Student.class),
            examples  = {
                @ExampleObject(name = "validStudent", summary = "Valid student",
                    value = """
                        {
                          "name": "Priya Desai",
                          "email": "priya.desai@university.edu",
                          "course": "Computer Science",
                          "semester": 4
                        }"""),
                @ExampleObject(name = "invalidStudent", summary = "Invalid payload (→ 400)",
                    value = """
                        {
                          "name": "",
                          "email": "invalid-email",
                          "semester": -2
                        }""")
            }
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Student created",
            content = @Content(mediaType = "application/json",
                               schema = @Schema(implementation = Student.class))),
        @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "500", description = "Internal Server Error",
            content = @Content(mediaType = "application/json"))
    })
    @PostMapping
    public ResponseEntity<Map<String, Object>> createStudent(
            @Valid @RequestBody Student body) {

        Student created = service.createStudent(body);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", 201);
        response.put("message", "Student created successfully");
        response.put("data", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Global validation error handler (400 Bad Request)
    // ─────────────────────────────────────────────────────────────────────
    /**
     * Intercepts {@link MethodArgumentNotValidException} thrown when
     * {@code @Valid} fails, and returns a structured 400 response
     * matching the Express.js error format for easy comparison.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        List<Map<String, Object>> details = new ArrayList<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("field", fe.getField());
            detail.put("message", fe.getDefaultMessage());
            detail.put("receivedValue", fe.getRejectedValue());
            details.add(detail);
        }

        Map<String, Object> error = new LinkedHashMap<>();
        error.put("status", 400);
        error.put("error", "Bad Request");
        error.put("message", "Validation failed — please correct the errors below");
        error.put("details", details);
        error.put("timestamp", Instant.now().toString());
        return ResponseEntity.badRequest().body(error);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helper
    // ─────────────────────────────────────────────────────────────────────
    private Map<String, Object> buildError(int status, String error, String message, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        body.put("timestamp", Instant.now().toString());
        body.put("path", path);
        return body;
    }
}

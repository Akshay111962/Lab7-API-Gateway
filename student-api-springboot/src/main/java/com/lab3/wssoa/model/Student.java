package com.lab3.wssoa.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Student resource model.
 *
 * <p>Bean Validation annotations are used by Spring to enforce constraints
 * when {@code @Valid} is applied on the controller method parameter.
 *
 * <p>Lab 3 Scope: No JPA/database annotations — data is managed in-memory.
 */
@Schema(description = "Represents a university student resource")
public class Student {

    // ── Server-managed fields ──────────────────────────────────────────────
    @Schema(description = "Auto-generated UUID", example = "b1c2d3e4-0001-0001-0001-000000000001",
            accessMode = Schema.AccessMode.READ_ONLY)
    private String id;

    @Schema(description = "ISO 8601 creation timestamp", accessMode = Schema.AccessMode.READ_ONLY)
    private String createdAt;

    @Schema(description = "ISO 8601 last-update timestamp", accessMode = Schema.AccessMode.READ_ONLY)
    private String updatedAt;

    // ── Client-supplied fields (validated) ────────────────────────────────
    @NotBlank(message = "Name is required and cannot be blank")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "Full name of the student", example = "Aarav Patel", required = true)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address (e.g. student@example.com)")
    @Schema(description = "Unique, valid email address",
            example = "aarav.patel@university.edu", required = true)
    private String email;

    @NotBlank(message = "Course is required and cannot be blank")
    @Size(min = 2, max = 100, message = "Course must be between 2 and 100 characters")
    @Schema(description = "Programme / degree the student is enrolled in",
            example = "Computer Science", required = true)
    private String course;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 8, message = "Semester must not exceed 8")
    @Schema(description = "Current semester (1–8)", example = "5", required = true)
    private Integer semester;

    // ── Constructors ───────────────────────────────────────────────────────
    public Student() {}

    /**
     * Used by the repository when creating a new student.
     * The server assigns the id and timestamps.
     */
    public Student(String name, String email, String course, Integer semester) {
        this.id        = UUID.randomUUID().toString();
        this.name      = name.trim();
        this.email     = email.trim().toLowerCase();
        this.course    = course.trim();
        this.semester  = semester;
        String now     = Instant.now().toString();
        this.createdAt = now;
        this.updatedAt = now;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────
    public String getId()          { return id; }
    public void   setId(String id) { this.id = id; }

    public String getName()            { return name; }
    public void   setName(String name) { this.name = name; }

    public String getEmail()              { return email; }
    public void   setEmail(String email)  { this.email = email; }

    public String getCourse()               { return course; }
    public void   setCourse(String course)  { this.course = course; }

    public Integer getSemester()                 { return semester; }
    public void    setSemester(Integer semester) { this.semester = semester; }

    public String getCreatedAt()                  { return createdAt; }
    public void   setCreatedAt(String createdAt)  { this.createdAt = createdAt; }

    public String getUpdatedAt()                  { return updatedAt; }
    public void   setUpdatedAt(String updatedAt)  { this.updatedAt = updatedAt; }
}

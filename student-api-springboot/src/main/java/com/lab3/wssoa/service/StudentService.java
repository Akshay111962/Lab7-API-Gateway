package com.lab3.wssoa.service;

import com.lab3.wssoa.model.Student;
import com.lab3.wssoa.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Business logic layer for the Student resource.
 *
 * <p>The service acts as the intermediary between the controller (HTTP layer)
 * and the repository (data layer). In this lab, the service methods are thin
 * because the business logic is simple; in a real application this layer would
 * contain domain rules, transformations, and transaction management.
 *
 * <p>Flow trace (POST /students):
 * <pre>
 *   HTTP Request (JSON body)
 *       ↓
 *   StudentController.createStudent(@Valid @RequestBody Student body)
 *       │  Spring validates body against @NotBlank / @Email / @Min / @Max
 *       │  If invalid → MethodArgumentNotValidException → 400 Bad Request
 *       ↓
 *   StudentService.createStudent(body)    ← HERE
 *       ↓
 *   StudentRepository.save(new Student(...))
 *       ↓
 *   Saved Student returned → Controller returns 201 Created
 * </pre>
 */
@Service
public class StudentService {

    private final StudentRepository repository;

    /** Constructor injection — preferred over @Autowired field injection. */
    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    /**
     * Retrieves all students from the repository.
     *
     * @return List of all students (may be empty but never null).
     */
    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    /**
     * Finds a single student by UUID.
     *
     * @param id UUID string of the target student.
     * @return Optional containing the student if found, empty otherwise.
     */
    public Optional<Student> getStudentById(String id) {
        return repository.findById(id);
    }

    /**
     * Creates and persists a new student.
     *
     * <p>The Student constructor automatically generates the UUID and timestamps,
     * so only business fields from the validated request body are passed here.
     *
     * @param body Validated student input from the controller.
     * @return The newly created student including generated id and timestamps.
     */
    public Student createStudent(Student body) {
        Student newStudent = new Student(
            body.getName(),
            body.getEmail(),
            body.getCourse(),
            body.getSemester()
        );
        return repository.save(newStudent);
    }
}

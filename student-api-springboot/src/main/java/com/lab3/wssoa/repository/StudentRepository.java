package com.lab3.wssoa.repository;

import com.lab3.wssoa.model.Student;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * In-memory repository for the Student resource.
 *
 * <p><b>Lab 3 scope</b>: Data is stored in an {@link ArrayList}. No database
 * or Spring Data annotations are used. This class is intentionally kept simple
 * to illustrate the repository layer's responsibility — owning the data store.
 *
 * <p>Lab 4 will replace this with a MongoDB-backed {@code @Repository}.
 *
 * <p>Flow trace (GET /students):
 * <pre>
 *   HTTP Request
 *       ↓
 *   StudentController.getAllStudents()
 *       ↓
 *   StudentService.getAllStudents()
 *       ↓
 *   StudentRepository.findAll()   ← HERE
 *       ↓
 *   List&lt;Student&gt; returned up the chain → 200 OK
 * </pre>
 */
@Repository
public class StudentRepository {

    /** In-memory store — seeded with three example students. */
    private final List<Student> store = new ArrayList<>(List.of(
        new Student("Aarav Patel",  "aarav.patel@university.edu",  "Computer Science",       5),
        new Student("Meera Nair",   "meera.nair@university.edu",   "Information Technology", 3),
        new Student("Rohan Sharma", "rohan.sharma@university.edu", "Electronics Engineering", 7)
    ));

    /**
     * Returns a copy of all stored students.
     * @return Unmodifiable snapshot of the student list.
     */
    public List<Student> findAll() {
        return List.copyOf(store);
    }

    /**
     * Finds a student by UUID.
     * @param id UUID string to search for.
     * @return Optional containing the student if found.
     */
    public Optional<Student> findById(String id) {
        return store.stream()
                    .filter(s -> s.getId().equals(id))
                    .findFirst();
    }

    /**
     * Persists a new student to the in-memory store.
     * @param student Student object (id and timestamps already set by constructor).
     * @return The saved student.
     */
    public Student save(Student student) {
        store.add(student);
        return student;
    }
}

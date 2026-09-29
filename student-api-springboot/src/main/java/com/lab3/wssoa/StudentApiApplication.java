package com.lab3.wssoa;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

/**
 * Spring Boot application entry point — Lab 3 WSSOA.
 *
 * <p>Starts the embedded Tomcat server on port 8080 (configured in
 * application.properties). SpringDoc automatically scans
 * {@code @RestController} beans and generates the OpenAPI spec.
 *
 * <p>URLs once running:
 * <ul>
 *   <li>API root    : http://localhost:8080/students</li>
 *   <li>Swagger UI  : http://localhost:8080/swagger-ui.html</li>
 *   <li>OpenAPI JSON: http://localhost:8080/api-docs</li>
 * </ul>
 *
 * <p>Run: {@code mvn spring-boot:run}
 */
@SpringBootApplication
public class StudentApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentApiApplication.class, args);
        System.out.println("\n╔══════════════════════════════════════════════════════╗");
        System.out.println("║    Student API — Spring Boot — Lab 3 (WSSOA)        ║");
        System.out.println("╠══════════════════════════════════════════════════════╣");
        System.out.println("║  Students  : http://localhost:8080/students          ║");
        System.out.println("║  Swagger UI: http://localhost:8080/swagger-ui.html   ║");
        System.out.println("║  OpenAPI   : http://localhost:8080/api-docs          ║");
        System.out.println("╠══════════════════════════════════════════════════════╣");
        System.out.println("║  Implements GET + POST (equivalent to Express.js)   ║");
        System.out.println("╚══════════════════════════════════════════════════════╝\n");
    }

    /**
     * Customises the OpenAPI metadata shown in Swagger UI.
     * SpringDoc auto-discovers endpoint annotations; this bean adds
     * the title, version, description, and server information.
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Student Management REST API — Spring Boot")
                .version("1.0.0")
                .description("""
                    ## Lab 3 — RESTful Web Services (Spring Boot)

                    Implements **GET /students** and **POST /students** as equivalent endpoints
                    to the complete Express.js CRUD implementation. Demonstrates the
                    **Controller → Service → Repository** architecture.

                    ### Architecture
                    ```
                    HTTP Request
                        ↓
                    StudentController   @RestController
                        ↓
                    StudentService      Business logic
                        ↓
                    StudentRepository   In-memory ArrayList<Student>
                    ```

                    ### Lab Scope
                    Data is stored in-memory (no database). MongoDB integration is Lab 4.
                    """)
                .contact(new Contact()
                    .name("WSSOA Lab 3")
                    .email("lab3@university.edu"))
                .license(new License().name("ISC")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local development server")
            ));
    }
}

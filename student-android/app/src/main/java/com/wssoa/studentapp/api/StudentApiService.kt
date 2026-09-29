package com.wssoa.studentapp.api

import com.wssoa.studentapp.model.StudentInput
import com.wssoa.studentapp.model.StudentListResponse
import com.wssoa.studentapp.model.StudentSingleResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Retrofit Service Interface defining Student REST API endpoints.
 */
interface StudentApiService {

    /**
     * List all students — GET /students
     */
    @GET("students")
    suspend fun getStudents(): Response<StudentListResponse>

    /**
     * Create a new student — POST /students
     */
    @POST("students")
    suspend fun createStudent(@Body student: StudentInput): Response<StudentSingleResponse>
}

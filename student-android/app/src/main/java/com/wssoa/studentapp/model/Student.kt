package com.wssoa.studentapp.model

import com.google.gson.annotations.SerializedName

/**
 * Student Domain Model
 */
data class Student(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("course") val course: String,
    @SerializedName("semester") val semester: Int,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

/**
 * Request payload for creating/updating a student
 */
data class StudentInput(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("course") val course: String,
    @SerializedName("semester") val semester: Int
)

/**
 * Response model for GET /students
 */
data class StudentListResponse(
    @SerializedName("status") val status: Int,
    @SerializedName("count") val count: Int,
    @SerializedName("data") val data: List<Student>
)

/**
 * Response model for single student operations
 */
data class StudentSingleResponse(
    @SerializedName("status") val status: Int,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: Student
)

/**
 * Error payload returned by REST API for 400 Bad Request or 404 Not Found
 */
data class ErrorResponse(
    @SerializedName("status") val status: Int?,
    @SerializedName("error") val error: String?,
    @SerializedName("message") val message: String?,
    @SerializedName("timestamp") val timestamp: String?
)

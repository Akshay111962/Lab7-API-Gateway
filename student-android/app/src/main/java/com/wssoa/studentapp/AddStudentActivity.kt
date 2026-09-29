package com.wssoa.studentapp

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.wssoa.studentapp.api.ApiClient
import com.wssoa.studentapp.databinding.ActivityAddStudentBinding
import com.wssoa.studentapp.model.ErrorResponse
import com.wssoa.studentapp.model.StudentInput
import kotlinx.coroutines.launch

/**
 * AddStudentActivity — Form screen for creating a new student via POST /students
 */
class AddStudentActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAddStudentBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddStudentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Add Student"

        binding.btnSubmitStudent.setOnClickListener {
            submitStudent()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun submitStudent() {
        val name = binding.etName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val course = binding.etCourse.text.toString().trim()
        val semesterStr = binding.etSemester.text.toString().trim()

        // Basic client-side validation
        if (name.isEmpty() || email.isEmpty() || course.isEmpty() || semesterStr.isEmpty()) {
            Toast.makeText(this, "Please fill in all required fields", Toast.LENGTH_SHORT).show()
            return
        }

        val semester = semesterStr.toIntOrNull()
        if (semester == null || semester !in 1..12) {
            Toast.makeText(this, "Semester must be a valid number between 1 and 12", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSubmitStudent.isEnabled = false

        val inputPayload = StudentInput(name, email, course, semester)

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.createStudent(inputPayload)

                if (response.isSuccessful) {
                    val created = response.body()?.data
                    Toast.makeText(
                        this@AddStudentActivity,
                        "Student '${created?.name ?: name}' added successfully! (201 Created)",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                } else {
                    val errorCode = response.code()
                    val errorBody = response.errorBody()?.string()

                    val parsedError = try {
                        Gson().fromJson(errorBody, ErrorResponse::class.java)
                    } catch (e: Exception) {
                        null
                    }

                    when (errorCode) {
                        400 -> {
                            val msg = parsedError?.message ?: "Validation error in request payload"
                            Toast.makeText(
                                this@AddStudentActivity,
                                "Toast: 400 Bad Request — $msg",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                        404 -> {
                            Toast.makeText(
                                this@AddStudentActivity,
                                "Toast: Student not found (404)",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                        else -> {
                            Toast.makeText(
                                this@AddStudentActivity,
                                "Toast: Something went wrong ($errorCode)",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@AddStudentActivity,
                    "Toast: Something went wrong (Network error)",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnSubmitStudent.isEnabled = true
            }
        }
    }
}

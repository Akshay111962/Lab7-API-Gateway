package com.wssoa.studentapp

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.wssoa.studentapp.adapter.StudentAdapter
import com.wssoa.studentapp.api.ApiClient
import com.wssoa.studentapp.databinding.ActivityMainBinding
import kotlinx.coroutines.launch

/**
 * MainActivity — Displays list of students consumed from GET /students
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: StudentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()

        binding.swipeRefresh.setOnRefreshListener {
            fetchStudents()
        }

        binding.fabAddStudent.setOnClickListener {
            val intent = Intent(this, AddStudentActivity::class.java)
            startActivity(intent)
        }

        fetchStudents()
    }

    override fun onResume() {
        super.onResume()
        fetchStudents()
    }

    private fun setupRecyclerView() {
        adapter = StudentAdapter()
        binding.rvStudents.layoutManager = LinearLayoutManager(this)
        binding.rvStudents.adapter = adapter
    }

    private fun fetchStudents() {
        binding.swipeRefresh.isRefreshing = true

        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getStudents()

                if (response.isSuccessful) {
                    val studentList = response.body()?.data ?: emptyList()
                    adapter.updateData(studentList)
                    Toast.makeText(
                        this@MainActivity,
                        "Loaded ${studentList.size} students",
                        Toast.LENGTH_SHORT
                    ).show()
                } else if (response.code() == 404) {
                    Toast.makeText(
                        this@MainActivity,
                        "Toast: Student not found (404)",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    Toast.makeText(
                        this@MainActivity,
                        "Toast: Something went wrong (${response.code()})",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@MainActivity,
                    "Toast: Something went wrong (${e.localizedMessage})",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }
}

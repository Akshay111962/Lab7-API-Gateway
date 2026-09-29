package com.wssoa.studentapp.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.wssoa.studentapp.R
import com.wssoa.studentapp.model.Student

/**
 * RecyclerView Adapter for rendering Student items.
 */
class StudentAdapter(
    private var students: List<Student> = emptyList()
) : RecyclerView.Adapter<StudentAdapter.StudentViewHolder>() {

    class StudentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvName: TextView = itemView.findViewById(R.id.tvStudentName)
        val tvEmail: TextView = itemView.findViewById(R.id.tvStudentEmail)
        val tvCourse: TextView = itemView.findViewById(R.id.tvStudentCourse)
        val tvSemester: TextView = itemView.findViewById(R.id.tvStudentSemester)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_student, parent, false)
        return StudentViewHolder(view)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        val student = students[position]
        holder.tvName.text = student.name
        holder.tvEmail.text = student.email
        holder.tvCourse.text = student.course
        holder.tvSemester.text = "Sem ${student.semester}"
    }

    override fun getItemCount(): Int = students.size

    fun updateData(newStudents: List<Student>) {
        students = newStudents
        notifyDataSetChanged()
    }
}

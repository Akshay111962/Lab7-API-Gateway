import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export default function StudentList({
  students,
  isLoading,
  error,
  onRefresh,
  onEditStudent,
  showToast,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student '${name}'?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 204 || response.ok) {
        showToast(`Student '${name}' deleted successfully.`, 'success');
        onRefresh(); // refresh list from server
      } else if (response.status === 404) {
        showToast('HTTP 404: Student not found or already deleted.', 'error');
        onRefresh();
      } else {
        showToast('Unable to load data. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Unable to load data. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          🎓 Student Directory ({students.length})
        </h2>
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          {isLoading ? '🔄 Syncing...' : '🔄 Refresh Data'}
        </button>
      </div>

      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
          <p>Loading students from database...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="alert alert-danger" style={{ display: 'block', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ API Connection Failure</p>
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '1rem' }}
            onClick={onRefresh}
          >
            Retry Connection
          </button>
        </div>
      )}

      {!isLoading && !error && filteredStudents.length === 0 && (
        <div className="empty-state">
          <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</p>
          <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>
            {searchTerm ? 'No matching students found' : 'No students registered yet'}
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            {searchTerm ? 'Try adjusting your search criteria.' : 'Use the form to add your first student record.'}
          </p>
        </div>
      )}

      {!isLoading && !error && filteredStudents.length > 0 && (
        <div className="table-wrapper">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Semester</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'white' }}>{student.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email}</div>
                  </td>
                  <td>
                    <span className="badge">{student.course}</span>
                  </td>
                  <td>
                    <span className="badge semester">Sem {student.semester}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-icon"
                        title="Edit Student"
                        onClick={() => onEditStudent(student)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Delete Student"
                        disabled={deletingId === student.id}
                        onClick={() => handleDelete(student.id, student.name)}
                      >
                        {deletingId === student.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

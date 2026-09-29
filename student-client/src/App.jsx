import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './config/api';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import Toast from './components/Toast';

export default function App() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Unable to fetch students`);
      }
      const json = await response.json();
      setStudents(json.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to load data. Please try again.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSaveSuccess = () => {
    setEditingStudent(null);
    fetchStudents();
  };

  // Calculate Stats
  const totalStudents = students.length;
  const uniqueCourses = new Set(students.map((s) => s.course)).size;
  const avgSemester = totalStudents
    ? (students.reduce((sum, s) => sum + Number(s.semester || 0), 0) / totalStudents).toFixed(1)
    : '0.0';

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">📚</div>
          <div>
            <h1 className="brand-title">Student Portal</h1>
            <p className="brand-subtitle">Lab 4 — RESTful Database & Multi-Client Architecture</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>API Endpoint:</div>
          <code style={{ color: '#22d3ee', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            {API_BASE_URL}
          </code>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">👥</div>
          <div>
            <div className="stat-val">{totalStudents}</div>
            <div className="stat-lbl">Total Registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accent">📖</div>
          <div>
            <div className="stat-val">{uniqueCourses}</div>
            <div className="stat-lbl">Active Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">📊</div>
          <div>
            <div className="stat-val">Sem {avgSemester}</div>
            <div className="stat-lbl">Average Progress</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Student List (Left) + Student Form (Right) */}
      <div className="main-layout">
        <StudentList
          students={students}
          isLoading={isLoading}
          error={error}
          onRefresh={fetchStudents}
          onEditStudent={(s) => setEditingStudent(s)}
          showToast={showToast}
        />

        <StudentForm
          editingStudent={editingStudent}
          onSaveSuccess={handleSaveSuccess}
          onCancelEdit={() => setEditingStudent(null)}
          showToast={showToast}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

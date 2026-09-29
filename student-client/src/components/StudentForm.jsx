import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export default function StudentForm({ editingStudent, onSaveSuccess, onCancelEdit, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    semester: '1',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name || '',
        email: editingStudent.email || '',
        course: editingStudent.course || '',
        semester: editingStudent.semester ? String(editingStudent.semester) : '1',
      });
      setErrors({});
      setApiError(null);
    } else {
      setFormData({ name: '', email: '', course: '', semester: '1' });
      setErrors({});
      setApiError(null);
    }
  }, [editingStudent]);

  // Client-side validation
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Invalid email address format';
    }

    if (!formData.course.trim()) {
      errs.course = 'Course name is required';
    }

    const semNum = Number(formData.semester);
    if (!formData.semester || isNaN(semNum) || semNum < 1 || semNum > 12) {
      errs.semester = 'Semester must be between 1 and 12';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setApiError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      showToast('Please fix client-side validation errors before submitting.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const isEdit = Boolean(editingStudent);
    const url = isEdit ? `${API_BASE_URL}/${editingStudent.id}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          course: formData.course.trim(),
          semester: Number(formData.semester),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Specific HTTP Status Code Handling
        if (response.status === 400) {
          const msg = data.message || (data.errors && data.errors.map(e => e.msg).join(', ')) || 'Validation failed on server.';
          setApiError(`HTTP 400 (Bad Request): ${msg}`);
          showToast(`400 Bad Request: ${msg}`, 'error');
        } else if (response.status === 404) {
          setApiError('HTTP 404 (Not Found): Student not found.');
          showToast('Student not found on server.', 'error');
        } else {
          setApiError(`Server error (${response.status}): ${data.message || 'Unable to save student data.'}`);
          showToast('Unable to load data. Please try again.', 'error');
        }
        setIsSubmitting(false);
        return;
      }

      showToast(
        isEdit ? `Successfully updated student '${data.data.name}'` : `Successfully created student '${data.data.name}'`,
        'success'
      );
      setFormData({ name: '', email: '', course: '', semester: '1' });
      onSaveSuccess();
    } catch (err) {
      setApiError('Network connection failure. Make sure backend is running on localhost:3000');
      showToast('Unable to load data. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          {editingStudent ? '✏️ Edit Student' : '➕ Add New Student'}
        </h2>
        {editingStudent && (
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>

      {apiError && (
        <div className="alert alert-danger">
          <span>⚠️ {apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full Name *</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Ananya Roy"
            className={`form-input ${errors.name ? 'error' : ''}`}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. ananya.roy@university.edu"
            className={`form-input ${errors.email ? 'error' : ''}`}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="course">Course / Field of Study *</label>
          <input
            id="course"
            type="text"
            name="course"
            value={formData.course}
            onChange={handleChange}
            placeholder="e.g. Software Engineering"
            className={`form-input ${errors.course ? 'error' : ''}`}
          />
          {errors.course && <span className="form-error">{errors.course}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="semester">Semester (1 - 12) *</label>
          <input
            id="semester"
            type="number"
            name="semester"
            min="1"
            max="12"
            value={formData.semester}
            onChange={handleChange}
            className={`form-input ${errors.semester ? 'error' : ''}`}
          />
          {errors.semester && <span className="form-error">{errors.semester}</span>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span> Saving Student...
            </>
          ) : editingStudent ? (
            'Update Student Record'
          ) : (
            'Register Student'
          )}
        </button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';

const PRESET_ICONS = ['💼', '🏋️', '📚', '🎯', '💡', '🚀', '🏃', '🎨', '💰', '🧠', '❤️', '🌍'];
const PRESET_COLORS = ['#C9A84C', '#4C9AC9', '#4CC97A', '#C94C4C', '#9A4CC9', '#C97A4C'];

function ProjectsPanel({ isOpen, onClose, projects, currentProjectId, onSelectProject, onNewProject, onDeleteProject, onUpdateProject }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '💼', description: '', instructions: '', color: '#C9A84C' });

  const resetForm = () => setForm({ name: '', icon: '💼', description: '', instructions: '', color: '#C9A84C' });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    onNewProject(form);
    resetForm();
    setCreating(false);
  };

  const handleEdit = (project) => {
    setEditing(project.id);
    setForm({
      name: project.name,
      icon: project.icon,
      description: project.description || '',
      instructions: project.instructions || '',
      color: project.color || '#C9A84C',
    });
  };

  const handleUpdate = () => {
    if (!form.name.trim()) return;
    onUpdateProject(editing, form);
    setEditing(null);
    resetForm();
  };

  return (
    <>
      {isOpen && <div className="log-overlay" onClick={onClose} />}
      <div className={`projects-panel ${isOpen ? 'projects-panel--open' : ''}`}>
        <div className="projects-panel-header">
          <div>
            <p className="log-panel-eyebrow">Workspaces</p>
            <h2 className="log-panel-title">Projects</h2>
          </div>
          <button className="log-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="projects-content">
          {/* Default workspace */}
          <button
            className={`project-item ${!currentProjectId ? 'project-item--active' : ''}`}
            onClick={() => { onSelectProject(null); onClose(); }}
          >
            <span className="project-item-icon">✦</span>
            <div className="project-item-info">
              <p className="project-item-name">General</p>
              <p className="project-item-desc">Default workspace</p>
            </div>
            {!currentProjectId && <span className="project-item-check">●</span>}
          </button>

          {projects.map(project => (
            <div key={project.id}>
              {editing === project.id ? (
                <div className="project-form">
                  <ProjectForm
                    form={form}
                    setForm={setForm}
                    onSave={handleUpdate}
                    onCancel={() => { setEditing(null); resetForm(); }}
                    saveLabel="Save changes"
                  />
                </div>
              ) : (
                <div className={`project-item ${currentProjectId === project.id ? 'project-item--active' : ''}`}>
                  <button
                    className="project-item-main"
                    onClick={() => { onSelectProject(project); onClose(); }}
                  >
                    <span className="project-item-icon" style={{ background: `${project.color}20`, color: project.color }}>
                      {project.icon}
                    </span>
                    <div className="project-item-info">
                      <p className="project-item-name">{project.name}</p>
                      {project.description && <p className="project-item-desc">{project.description}</p>}
                      {project.instructions && (
                        <p className="project-item-instructions">"{project.instructions.slice(0, 60)}{project.instructions.length > 60 ? '...' : ''}"</p>
                      )}
                    </div>
                    {currentProjectId === project.id && <span className="project-item-check">●</span>}
                  </button>
                  <div className="project-item-actions">
                    <button className="project-action-btn" onClick={() => handleEdit(project)} title="Edit">✎</button>
                    <button className="project-action-btn project-action-btn--delete" onClick={() => onDeleteProject(project.id)} title="Delete">✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* New project form */}
          {creating ? (
            <div className="project-form">
              <ProjectForm
                form={form}
                setForm={setForm}
                onSave={handleCreate}
                onCancel={() => { setCreating(false); resetForm(); }}
                saveLabel="Create project"
              />
            </div>
          ) : (
            <button className="project-new-btn" onClick={() => setCreating(true)}>
              <span>+</span> New project
            </button>
          )}
        </div>

        <div className="projects-footer">
          <p>Projects keep your chats organized with custom AI behavior per workspace.</p>
        </div>
      </div>
    </>
  );
}

function ProjectForm({ form, setForm, onSave, onCancel, saveLabel }) {
  const PRESET_ICONS = ['💼', '🏋️', '📚', '🎯', '💡', '🚀', '🏃', '🎨', '💰', '🧠', '❤️', '🌍'];
  const PRESET_COLORS = ['#C9A84C', '#4C9AC9', '#4CC97A', '#C94C4C', '#9A4CC9', '#C97A4C'];

  return (
    <div className="project-form-inner">
      <p className="project-form-label">Icon</p>
      <div className="project-icon-grid">
        {PRESET_ICONS.map(icon => (
          <button
            key={icon}
            className={`project-icon-btn ${form.icon === icon ? 'project-icon-btn--active' : ''}`}
            onClick={() => setForm(f => ({ ...f, icon }))}
          >
            {icon}
          </button>
        ))}
      </div>

      <p className="project-form-label">Color</p>
      <div className="project-color-grid">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            className={`project-color-btn ${form.color === color ? 'project-color-btn--active' : ''}`}
            style={{ background: color }}
            onClick={() => setForm(f => ({ ...f, color }))}
          />
        ))}
      </div>

      <p className="project-form-label">Name</p>
      <input
        className="project-form-input"
        placeholder="e.g. Business idea, Marathon training..."
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && onSave()}
      />

      <p className="project-form-label">Description <span style={{ color: '#B0B0B0', fontWeight: 300 }}>(optional)</span></p>
      <input
        className="project-form-input"
        placeholder="What is this project about?"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
      />

      <p className="project-form-label">Custom instructions for Melius</p>
      <textarea
        className="project-form-textarea"
        placeholder="e.g. You are my business advisor. Always give direct, actionable advice. Focus on market validation and revenue first. Be concise."
        value={form.instructions}
        onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
        rows={4}
      />

      <div className="project-form-actions">
        <button className="project-form-save" onClick={onSave}>{saveLabel}</button>
        <button className="project-form-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default ProjectsPanel;
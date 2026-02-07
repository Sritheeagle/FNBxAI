import React from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaRegCircle, FaClipboardList } from 'react-icons/fa';

/**
/**
 * Task Management
 * Manage and track administrative tasks.
 */
const TodoSection = ({ todos, openModal, toggleTodo, deleteTodo }) => {
    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>TASK <span>NAVIGATOR</span></h1>
                    <p>Strategic administrative objective tracking</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('todo')}>
                        <FaPlus /> INITIALIZE TASK
                    </button>
                </div>
            </header>

            {/* Task Telemetry */}
            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#fff7ed', color: '#f59e0b', width: '50px', height: '50px', borderRadius: '14px' }}><FaClipboardList /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{todos.filter(t => !t.completed).length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>PENDING OPERATIONS</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#ecfdf5', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaCheckCircle /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{todos.filter(t => t.completed).length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>COMPLETED OBJECTIVES</div>
                </div>
            </div>

            <div className="admin-card sentinel-floating">
                <div className="sentinel-scanner"></div>
                <div className="admin-list-container">
                    {todos.map(todo => (
                        <div key={todo.id} className={`admin-list-item ${todo.completed ? 'completed' : 'active'}`} style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', transition: 'all 0.2s', background: todo.completed ? '#f8fafc' : 'white' }}>
                            <div onClick={() => toggleTodo(todo.id)} style={{ cursor: 'pointer', marginRight: '1.25rem', display: 'flex', alignItems: 'center' }}>
                                {todo.completed ? (
                                    <div style={{ background: '#dcfce7', color: '#10b981', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)' }}>
                                        <FaCheckCircle size={18} />
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaRegCircle size={18} color="#94a3b8" />
                                    </div>
                                )}
                            </div>

                            <div className="admin-todo-text" style={{ flex: 1 }}>
                                <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#94a3b8' : '#1e293b', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                                    {todo.text}
                                </span>
                            </div>

                            <div className="todo-actions" style={{ display: 'flex', gap: '0.6rem' }}>
                                <button onClick={() => openModal('todo', todo)} className="admin-action-btn secondary" title="Edit Task" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '10px' }}><FaEdit /></button>
                                <button onClick={() => deleteTodo(todo.id)} className="admin-action-btn danger" title="Delete Task" style={{ background: '#fff1f2', border: '1px solid #fee2e2', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px' }}><FaTrash /></button>
                            </div>
                        </div>
                    ))}

                    {todos.length === 0 && (
                        <div className="admin-empty-state">
                            <FaClipboardList className="admin-empty-icon" />
                            <h2 className="admin-empty-title">All Caught Up</h2>
                            <p className="admin-empty-text">No pending tasks found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TodoSection;

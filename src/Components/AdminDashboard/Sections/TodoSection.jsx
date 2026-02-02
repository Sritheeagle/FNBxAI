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
                    <h1>TASK <span>MANAGER</span></h1>
                    <p>Total Tasks: {todos.length}</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('todo')}>
                        <FaPlus /> ADD NEW TASK
                    </button>
                </div>
            </header>

            <div className="admin-card">
                <div className="admin-list-container">
                    {todos.map(todo => (
                        <div key={todo.id} className={`admin-list-item ${todo.completed ? 'completed' : 'active'}`} style={{ padding: '1rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', transition: 'all 0.2s', background: todo.completed ? 'var(--admin-bg)' : 'white' }}>
                            <div onClick={() => toggleTodo(todo.id)} style={{ cursor: 'pointer', marginRight: '1.25rem', display: 'flex', alignItems: 'center' }}>
                                {todo.completed ? (
                                    <div style={{ background: 'var(--admin-success-light)', color: 'var(--admin-success)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaCheckCircle size={16} />
                                    </div>
                                ) : (
                                    <div style={{ background: 'var(--admin-bg)', border: '2px solid var(--admin-border)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaRegCircle size={16} color="var(--admin-text-muted)" />
                                    </div>
                                )}
                            </div>

                            <div className="admin-todo-text" style={{ flex: 1 }}>
                                <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'var(--admin-text-muted)' : 'var(--admin-text)', fontWeight: 600, fontSize: '1rem' }}>
                                    {todo.text}
                                </span>
                            </div>

                            <div className="todo-actions" style={{ display: 'flex', gap: '0.6rem' }}>
                                <button onClick={() => openModal('todo', todo)} className="admin-action-btn secondary" title="Edit Task"><FaEdit /></button>
                                <button onClick={() => deleteTodo(todo.id)} className="admin-action-btn danger" title="Delete Task"><FaTrash /></button>
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

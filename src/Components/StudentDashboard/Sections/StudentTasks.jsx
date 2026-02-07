import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaCheckCircle, FaRegCircle, FaClipboardList, FaBullhorn, FaCalendarDay } from 'react-icons/fa';
import { apiPost, apiPut, apiDelete } from '../../../utils/apiClient';
import './StudentTasks.css';
import ProfessionalEmptyState from './ProfessionalEmptyState';

/**
 * STUDENT TASKS (Premium)
 * A clean, prioritized task management system.
 */
const StudentTasks = ({ tasks, userData, onRefresh }) => {
    const [newTask, setNewTask] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [filter, setFilter] = useState('active'); // active, completed, all

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            await apiPost('/api/todos', {
                text: newTask,
                target: 'student',
                userId: userData.sid,
                dueDate: new Date(Date.now() + 86400000) // Tomorrow default
            });
            setNewTask('');
            setIsAdding(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    };

    const toggleTask = async (task) => {
        try {
            await apiPut(`/api/todos/${task._id}`, { completed: !task.completed });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await apiDelete(`/api/todos/${taskId}`);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    return (
        <div className="nexus-page-container fade-in">
            <header className="page-section-header">
                <div>
                    <h2 className="title-with-icon">
                        <FaClipboardList className="header-icon" />
                        MY <span>PRIORITY</span> TASKS
                    </h2>
                    <p className="subtitle">Manage your daily goals and academic action items.</p>
                </div>
                <div className="task-filters">
                    {['active', 'completed', 'all'].map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            <div className="tasks-grid">
                {/* Left Column: Quick Add */}
                <div className="add-task-card">
                    <h3><FaPlus style={{ color: 'var(--v-primary)' }} /> QUICK ADD</h3>
                    <form onSubmit={handleAddTask}>
                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onFocus={() => setIsAdding(true)}
                        />
                        <AnimatePresence>
                            {isAdding && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="add-task-expanded"
                                >
                                    <div className="date-hint">
                                        <FaCalendarDay /> Due tomorrow by default
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="cancel-btn" onClick={() => { setIsAdding(false); setNewTask(''); }}>Cancel</button>
                                        <button type="submit" className="save-btn">CREATE TASK</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Right Column: Task List */}
                <div className="task-list-wrapper">
                    <AnimatePresence mode='popLayout'>
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task, idx) => (
                                <motion.div
                                    key={task._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`nexus-task-item sentinel-floating ${task.completed ? 'completed' : ''}`}
                                    style={{ animationDelay: `${idx * -0.4}s`, position: 'relative', overflow: 'hidden' }}
                                >
                                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--v-primary)', opacity: 0.1 }}></div>
                                    <div className="task-main" onClick={() => toggleTask(task)}>
                                        <div className="check-box">
                                            {task.completed ? <FaCheckCircle className="checked" style={{ color: '#10b981' }} /> : <FaRegCircle style={{ color: '#cbd5e1' }} />}
                                        </div>
                                        <div className="task-content">
                                            <span className="task-text" style={{ fontWeight: 950, fontSize: '0.95rem', color: task.completed ? '#94a3b8' : '#1e293b' }}>{task.text}</span>
                                            <div className="task-meta" style={{ marginTop: '0.4rem' }}>
                                                {task.userId === null ? (
                                                    <span className="global-badge" style={{ fontWeight: 900, fontSize: '0.6rem', letterSpacing: '0.05em' }}><FaBullhorn /> BROADCAST</span>
                                                ) : (
                                                    <span className="personal-badge" style={{ fontWeight: 900, fontSize: '0.6rem', letterSpacing: '0.05em' }}>PERSONAL</span>
                                                )}
                                                {task.dueDate && (
                                                    <span className="due-date" style={{ fontWeight: 850, fontSize: '0.6rem', color: '#94a3b8' }}>EXPIRY: {new Date(task.dueDate).toLocaleDateString().toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {task.userId === userData?.sid && (
                                        <button className="task-delete-btn" onClick={() => deleteTask(task._id)} title="Delete Task" style={{ background: '#fef2f2', color: '#ef4444', borderRadius: '10px' }}>
                                            <FaTrash size={12} />
                                        </button>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <ProfessionalEmptyState
                                title={`NO ${filter.toUpperCase()} TASKS`}
                                description={filter === 'completed' ? "You haven't finished any tasks yet. Tick off some goals to see them here!" : "Congratulations! All missions are complete. Add a new objective to stay productive."}
                                icon={filter === 'completed' ? <FaClipboardList /> : <FaCheckCircle />}
                                theme={filter === 'completed' ? 'info' : 'success'}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default StudentTasks;

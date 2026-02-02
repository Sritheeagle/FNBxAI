import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeadset, FaTicketAlt, FaHistory, FaQuestionCircle, FaPaperPlane } from 'react-icons/fa';
import './StudentSupport.css';

/**
 * STUDENT SUPPORT HUB
 * A premium interface for raising support tickets and accessing help.
 */
const StudentSupport = ({ userData }) => {
    const [view, setView] = useState('new'); // 'new', 'history', 'faq'
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('Academic Doubt');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate API call and state feedback
        setTimeout(() => {
            alert('Support ticket submitted successfully! Our team will get back to you soon.');
            setSubmitting(false);
            setSubject('');
            setDescription('');
            setView('history');
        }, 1500);
    };

    return (
        <div className="support-page">
            <header className="page-section-header">
                <div>
                    <h2 className="title-with-icon">
                        <FaHeadset className="header-icon" />
                        STUDENT <span>SUPPORT</span> HUB
                    </h2>
                    <p className="subtitle">Need assistance? Raise a secure ticket or browse our knowledge base.</p>
                </div>
            </header>

            <div className="support-nav-tabs">
                <button
                    className={`support-tab ${view === 'new' ? 'active' : ''}`}
                    onClick={() => setView('new')}
                >
                    <FaTicketAlt /> NEW TICKET
                </button>
                <button
                    className={`support-tab ${view === 'history' ? 'active' : ''}`}
                    onClick={() => setView('history')}
                >
                    <FaHistory /> MY TICKETS
                </button>
                <button
                    className={`support-tab ${view === 'faq' ? 'active' : ''}`}
                    onClick={() => setView('faq')}
                >
                    <FaQuestionCircle /> KNOWLEDGE BASE
                </button>
            </div>

            <div className="support-content-wrapper">
                {view === 'new' && (
                    <motion.div
                        className="support-form-card glass-panel"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3>RAISE A SUPPORT TICKET</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Interaction Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option>Academic Doubt</option>
                                    <option>Financial / Fee Inquiry</option>
                                    <option>Technical Issue</option>
                                    <option>Hostel & Infrastructure</option>
                                    <option>General Support</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject / Summary</label>
                                <input
                                    type="text"
                                    placeholder="Briefly describe your concern"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Detailed Description</label>
                                <textarea
                                    placeholder="Please provide details so we can help you better..."
                                    rows="5"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <button className="submit-ticket-btn" disabled={submitting}>
                                {submitting ? 'PROCESSING...' : 'SUBMIT TICKET'} <FaPaperPlane />
                            </button>
                        </form>
                    </motion.div>
                )}

                {view === 'history' && (
                    <motion.div
                        className="tickets-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="empty-state">
                            <FaHistory size={48} color="#cbd5e1" />
                            <h4>No Active Tickets</h4>
                            <p>You haven't raised any support tickets in the current academic session.</p>
                        </div>
                    </motion.div>
                )}

                {view === 'faq' && (
                    <motion.div
                        className="faq-matrix"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="faq-item glass-panel">
                            <h4>How do I download my fee receipt?</h4>
                            <p>Navigate to Finance {'>'} College Fees. In the Payment History section, click the receipt icon next to any successful transaction.</p>
                        </div>
                        <div className="faq-item glass-panel">
                            <h4>Where can I find my exam schedule?</h4>
                            <p>All upcoming assessments and exam dates are listed in the 'Exam Portal' section available in your main sidebar navigation.</p>
                        </div>
                        <div className="faq-item glass-panel">
                            <h4>Can I update my profile picture?</h4>
                            <p>Yes. Go to Account Settings and click on your current avatar to upload a new profile picture from your device.</p>
                        </div>
                        <div className="faq-item glass-panel">
                            <h4>How to access digital library materials?</h4>
                            <p>Use the 'Classroom' section to browse through modules and subjects. You can download notes and view video lectures directly from there.</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default StudentSupport;

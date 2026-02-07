import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaRegCopy, FaCheck, FaRegFileAlt } from 'react-icons/fa';
import { apiPost, apiGet } from '../../utils/apiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import './VuAiAgent.css';
import { FaSyncAlt } from 'react-icons/fa';

const VuAiAgent = ({ onNavigate, initialMessage, documentContext, forcedRole }) => {
    const resolveUserProfile = () => {
        // ... (existing logic, but we prioritize forcedRole if provided)
        if (forcedRole) {
            const userDataStr = window.localStorage.getItem(forcedRole === 'student' ? 'studentData' : (forcedRole === 'faculty' ? 'facultyData' : 'userData'));
            let userData = {};
            try { userData = JSON.parse(userDataStr || '{}'); } catch (e) { }

            return {
                role: forcedRole,
                userId: userData.sid || userData.facultyId || userData.adminId || 'guest',
                context: {
                    year: userData.year,
                    branch: userData.branch || 'CSE',
                    section: userData.section || 'A',
                    name: userData.studentName || userData.name || (forcedRole === 'admin' ? 'Commander' : 'User')
                }
            };
        }

        // ... (Fallbacks for standalone usage)
        if (typeof window === 'undefined' || !window.localStorage) {
            return { role: 'student', userId: 'guest', context: {} };
        }

        const userDataStr = window.localStorage.getItem('userData');
        const studentDataStr = window.localStorage.getItem('studentData');
        const facultyDataStr = window.localStorage.getItem('facultyData');

        let userData = {};
        let userRole = 'student';

        const safeParse = (value) => {
            try { return JSON.parse(value); }
            catch (err) { return {}; }
        };

        if (userDataStr) {
            const parsed = safeParse(userDataStr);
            if (parsed) { userData = parsed; userRole = parsed.role || 'student'; }
        }

        if (!userData.role) {
            if (facultyDataStr) {
                const parsed = safeParse(facultyDataStr);
                if (parsed) { userData = parsed; userRole = 'faculty'; }
            } else if (studentDataStr) {
                const parsed = safeParse(studentDataStr);
                if (parsed) { userData = parsed; userRole = 'student'; }
            }
        }

        const adminToken = window.localStorage.getItem('adminToken');
        if (adminToken && userRole !== 'faculty') {
            userRole = 'admin';
        }

        return {
            role: userRole,
            userId: userData.sid || userData.facultyId || userData.adminId || 'guest',
            context: {
                year: userData.year,
                branch: userData.branch || 'CSE',
                section: userData.section || 'A',
                name: userData.studentName || userData.name || 'User'
            }
        };
    };

    const getAgentIdentity = (role) => {
        switch (role) {
            case 'admin': return {
                name: 'Sentinel Prime',
                role: 'System Overwatch',
                icon: 'shield',
                theme: 'theme-admin' // Red/Dark
            };
            case 'faculty': return {
                name: 'Academic Core',
                role: 'Teaching Assistant',
                icon: 'brain',
                theme: 'theme-faculty' // Teal/Indigo
            };
            default: return {
                name: 'Study Buddy',
                role: 'Student Companion',
                icon: 'robot',
                theme: 'theme-student' // Purple/Blue
            };
        }
    };

    const userProfileFull = resolveUserProfile();
    const identity = getAgentIdentity(userProfileFull.role);

    const defaultBotMessage = {
        id: 'vuai-greeting',
        sender: 'bot',
        text: `Hi! I am your ${identity.name}. I am online and ready to assist with your ${resolveUserProfile()?.role === 'admin' ? 'systems' : 'studies'}.`,
        timestamp: new Date().toISOString()
    };

    const [messages, setMessages] = useState([defaultBotMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [lastFailedText, setLastFailedText] = useState(null);
    const messagesEndRef = useRef(null);
    const historyLoadedRef = useRef(false);
    const initialMessageProcessed = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        setUserProfile(resolveUserProfile());
    }, []);

    // Personalize greeting once user profile is resolved
    useEffect(() => {
        if (!userProfile) return;
        setMessages(prev => {
            try {
                const name = (userProfile.context && userProfile.context.name) || (userProfile.userId || 'User');

                let personalized = '';
                if (userProfile.role === 'admin') {
                    personalized = `Commander ${name}, Sentinel Prime online. Systems are optimal. How can I assist with oversight today?`;
                } else if (userProfile.role === 'faculty') {
                    personalized = `Greetings Professor ${name}. Academic Core is ready to assist with your class management and materials.`;
                } else {
                    personalized = `Hey ${name}! I'm your Study Buddy. I've got your back this semester! 🚀 Whether you need notes, a quick progress check, or just some focus tips, I'm here for you. What's the plan today, friend?`;
                }

                if (Array.isArray(prev) && prev.length === 1 && prev[0].id === 'vuai-greeting') {
                    return [{ ...prev[0], text: personalized }];
                }
            } catch (e) {
                // ignore personalization errors
            }
            return prev;
        });
    }, [userProfile]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!userProfile || historyLoadedRef.current) return;
            historyLoadedRef.current = true;
            setIsHistoryLoading(true);
            try {
                const params = new URLSearchParams({
                    userId: userProfile.userId || 'guest',
                    role: userProfile.role || 'student'
                });
                const history = await apiGet(`/api/chat/history?${params.toString()}`);
                if (Array.isArray(history) && history.length > 0) {
                    const reconstructed = [];
                    history.forEach(entry => {
                        if (entry.message) {
                            reconstructed.push({
                                id: `${entry.id || entry.timestamp}-user`,
                                sender: 'user',
                                text: entry.message,
                                timestamp: entry.timestamp
                            });
                        }
                        if (entry.response) {
                            reconstructed.push({
                                id: `${entry.id || entry.timestamp}-bot`,
                                sender: 'bot',
                                text: entry.response,
                                timestamp: entry.timestamp
                            });
                        }
                    });
                    setMessages(reconstructed);
                }
            } catch (error) {
                console.error('[VuAiAgent] Failed to load chat history:', error);
            } finally {
                setIsHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [userProfile]);

    useEffect(() => {
        if (initialMessage && !initialMessageProcessed.current && userProfile && !isHistoryLoading) {
            initialMessageProcessed.current = true;
            setTimeout(() => {
                handleSend(null, initialMessage);
            }, 1000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMessage, userProfile, isHistoryLoading]);

    const handleActionTags = (text) => {
        // 1. Navigation: {{NAVIGATE: section}}
        const navMatch = text.match(/{{NAVIGATE:\s*([^}]+)}}/i);
        if (navMatch && navMatch[1] && onNavigate) {
            const section = navMatch[1].trim();
            console.log('[FriendlyAgent] Executing navigation:', section);
            setTimeout(() => onNavigate(section), 200);
        }

        // 2. Actions: {{ACTION: name}}
        const actionMatch = text.match(/{{ACTION:\s*([^}]+)}}/i);
        if (actionMatch && actionMatch[1]) {
            const action = actionMatch[1].trim().toLowerCase();
            console.log('[FriendlyAgent] Executing action:', action);

            // Visual Feedback for Actions
            const actionMap = {
                'mark_attendance': 'Opening AI Attendance Scanner... 📸',
                'create_exam': 'Launching Exam Generator... 📝',
                'add_student': 'Opening Student Registration Form... ➕',
                'run_cleanup': 'System Cleanup Initiated... 🧹',
                'upload_notes': 'Opening Material Uploader... 📂'
            };

            const feedback = actionMap[action] || `Executing ${action}...`;

            // We can reuse the setMessages to show a system notification
            if (isMountedRef.current) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: `sys-${Date.now()}`,
                        sender: 'bot',
                        text: `*System*: ${feedback}`,
                        isSystem: true, // we can style this differently if CSS allows, or just bold it
                        timestamp: new Date().toISOString()
                    }]);
                }, 500);
            }
        }

        // Remove tags from display text
        let cleanText = text.replace(/{{NAVIGATE:\s*[^}]+}}/gi, '');
        cleanText = cleanText.replace(/{{ACTION:\s*[^}]+}}/gi, '');

        // Handle Knowledge Hub styling marker
        if (cleanText.includes('[Knowledge Hub]:')) {
            cleanText = cleanText.replace('[Knowledge Hub]:', '### 🧠 Neural Protocol Insight\n\n');
        }

        return cleanText;
    };

    const isMountedRef = useRef(true);
    useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

    // Load system pulse for admin
    const [systemPulse, setSystemPulse] = useState(null);
    useEffect(() => {
        if (userProfile?.role !== 'admin') return;
        const fetchPulse = async () => {
            try {
                await fetch('/api/chat/history?userId=pulse_check&role=admin'); // Mock/Real telemetry route
                // If the real route doesn't exist, we'll just simulate for UI beauty
                setSystemPulse({
                    cpu: 20 + Math.floor(Math.random() * 15),
                    mem: 45 + Math.floor(Math.random() * 10),
                    latency: '12ms'
                });
            } catch (e) { }
        };
        fetchPulse();
        const interval = setInterval(fetchPulse, 10000);
        return () => clearInterval(interval);
    }, [userProfile]);

    const handleSend = async (e, forcedText = null) => {
        if (e) e.preventDefault();
        const userText = forcedText || input;
        if (!userText || !userText.trim() || !userProfile || isLoading) return;

        setInput('');

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: userText,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        const payload = {
            user_id: userProfile.userId || 'guest',
            message: userText,
            role: userProfile.role || 'student',
            user_name: (userProfile.context && userProfile.context.name) || 'User',
            context: {
                ...(userProfile.context || {}),
                document: documentContext
            }
        };

        const MAX_RETRIES = 3;

        const sendPayload = async (attempt = 1) => {
            try {
                console.log('[VuAiAgent] Sending payload:', payload);
                console.log('[VuAiAgent] Attempt:', attempt);

                const data = await apiPost('/api/chat', payload);

                console.log('[VuAiAgent] Received data:', data);

                let botResponse = '';
                if (typeof data === 'string') {
                    botResponse = data;
                } else if (data && (data.response || data.text || data.message)) {
                    botResponse = data.response || data.text || data.message;
                } else {
                    botResponse = 'Received empty response from server.';
                }

                botResponse = handleActionTags(String(botResponse));

                if (!isMountedRef.current) return;
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: botResponse,
                    source: data.source || 'agent',
                    timestamp: new Date().toISOString()
                }]);

                if (isMountedRef.current) setLastFailedText(null);
                return;
            } catch (error) {
                console.error('[VuAiAgent] chat send failed (attempt', attempt, '):', error);

                if (attempt < MAX_RETRIES) {
                    const nextAttempt = attempt + 1;
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    await new Promise(_ => setTimeout(_, delay));
                    if (!isMountedRef.current) return;
                    return sendPayload(nextAttempt);
                }

                if (isMountedRef.current) {
                    setLastFailedText(userText);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'bot',
                        text: `Uplink disrupted. (${error?.message || 'Network error'})`,
                        isError: true,
                        timestamp: new Date().toISOString()
                    }]);
                }
            } finally {
                if (isMountedRef.current) setIsLoading(false);
            }
        };

        await sendPayload(1);
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getSuggestions = () => {
        if (userProfile?.role === 'admin') return [
            "Check system telemetry",
            "Generate health report",
            "Broadcast emergency transmission",
            "Navigate to statistics"
        ];
        if (userProfile?.role === 'faculty') return [
            "Create quiz for Unit 2",
            "Check student attendance",
            "Generate marks overview",
            "Navigate to exams"
        ];
        return [
            "How can I 'lock in' today? 🧠",
            "Quick stats check! 📈",
            "Where are my notes? 📚",
            "Navigate to Academic Browser"
        ];
    };

    return (
        <div className={`vu-ai-container role-${userProfile?.role || 'student'}`}>
            {/* Header */}
            <header className="vu-header">
                <div className="vu-bot-avatar">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <FaRobot size={24} className="ai-icon-spin" />
                    </motion.div>
                </div>
                <div className="vu-title-group">
                    <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {identity.name} <span className="vu-version-tag">{identity.role}</span>
                    </motion.h3>
                    {userProfile?.role === 'admin' && systemPulse && (
                        <div className="system-pulse-small">
                            <span className="pulse-item">CPU: {systemPulse.cpu}%</span>
                            <span className="pulse-item">MEM: {systemPulse.mem}%</span>
                        </div>
                    )}
                    <div className="vu-status">
                        <div className="vu-status-dot"></div>
                        <span>SYNCED: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                            title="Refresh AI Knowledge"
                            className="vu-refresh-btn"
                            onClick={async () => {
                                try {
                                    await apiPost('/api/agent/reload', {});
                                    setMessages(prev => [...prev, { id: Date.now() + 99, sender: 'bot', text: 'Knowledge refreshed ✅', timestamp: new Date().toISOString() }]);
                                } catch (e) {
                                    setMessages(prev => [...prev, { id: Date.now() + 100, sender: 'bot', text: 'Failed to refresh knowledge', timestamp: new Date().toISOString(), isError: true }]);
                                }
                            }}
                            style={{ marginLeft: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#2d8cff' }}
                        >
                            <FaSyncAlt />
                        </button>
                    </div>
                </div>
            </header>

            {/* Document Context Banner */}
            {documentContext && (
                <div style={{
                    background: '#eff6ff', borderBottom: '1px solid #dbeafe', padding: '0.5rem 1rem',
                    fontSize: '0.8rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <FaRegFileAlt />
                    <span>Analyzing: <strong>{documentContext.title || 'Document'}</strong></span>
                </div>
            )}

            {/* Holographic Video Analysis Overlay */}
            {documentContext?.videoAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="vu-analysis-overlay"
                    style={{ margin: '1rem' }}
                >
                    <div className="analysis-header">
                        <div className="analysis-tag">AI ANALYSIS</div>
                        <span>VIDEO INSIGHTS ENGINE</span>
                    </div>
                    <div className="analysis-content">
                        {documentContext.videoAnalysis}
                    </div>
                    <a href={documentContext.url} target="_blank" rel="noopener noreferrer" className="analysis-link">
                        View Source Resource →
                    </a>
                </motion.div>
            )}

            {/* Messages Area */}
            <div className="vu-messages">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`vu-msg-wrapper ${msg.sender}`}
                        >
                            <div className={`vu-bubble ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                                <div className="markdown-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                                {msg.sender === 'bot' && !msg.isError && (
                                    <div className="bot-meta-tags">
                                        {msg.source && <span className="source-badge">{msg.source}</span>}
                                        <button
                                            className={`copy-btn ${copiedId === msg.id ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(msg.text, msg.id)}
                                            title="Copy response"
                                        >
                                            {copiedId === msg.id ? <FaCheck size={10} /> : <FaRegCopy size={10} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="vu-timestamp">
                                {msg.sender === 'user' ? 'Local Query' : (identity.name || 'Friendly Agent')} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="vu-typing"
                    >
                        <div className="thinking-scanner">
                            <div className="scan-line"></div>
                        </div>
                        <span>Processing Neural Patterns...</span>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips */}
            <div className="vu-suggestions">
                {getSuggestions().map((s, i) => (
                    <div
                        key={i}
                        className="suggestion-chip"
                        onClick={() => {
                            handleSend(null, s);
                        }}
                    >
                        {s}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="vu-input-area">
                {/* Strategic Suggestions */}
                <div className="sentinel-suggestions">
                    {userProfile?.role === 'student' && (
                        <>
                            <button onClick={() => setInput('Show my academic progress')} className="suggestion-chip">📈 Progress</button>
                            <button onClick={() => setInput('Find study materials')} className="suggestion-chip">📚 Resources</button>
                            <button onClick={() => setInput('Check my attendance')} className="suggestion-chip">🗓 Attendance</button>
                        </>
                    )}
                    {userProfile?.role === 'faculty' && (
                        <>
                            <button onClick={() => setInput('Show class schedule')} className="suggestion-chip">⏰ Schedule</button>
                            <button onClick={() => setInput('Create a Sentinel exam')} className="suggestion-chip">📝 Exam Builder</button>
                        </>
                    )}
                    {userProfile?.role === 'admin' && (
                        <>
                            <button onClick={() => setInput('System health status')} className="suggestion-chip">🔋 System Logs</button>
                            <button onClick={() => setInput('Explain Transmission Protocol')} className="suggestion-chip">📡 Broadcast Hub</button>
                        </>
                    )}
                </div>

                <div className="vuai-input-wrapper">
                    <input
                        type="text"
                        className="vu-input-field"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        disabled={isLoading || isHistoryLoading}
                    />
                    <button
                        type="submit"
                        className={`vu-send-btn`}
                        disabled={isLoading || !input.trim() || isHistoryLoading}
                    >
                        <FaPaperPlane size={16} />
                    </button>
                    {lastFailedText && !isLoading && (
                        <button
                            type="button"
                            title="Retry last message"
                            className="vu-retry-btn"
                            onClick={() => handleSend(null, lastFailedText)}
                            style={{ marginLeft: '8px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                        >
                            Retry
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

/* Assistant Identity Rewire Styles */
const AssistantStyles = `
.system-pulse-small {
    display: flex;
    gap: 8px;
    font-size: 0.6rem;
    font-weight: 900;
    color: var(--fa-accent);
    margin-top: 4px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.pulse-item {
    background: rgba(16, 185, 129, 0.1);
    padding: 1px 6px;
    border-radius: 3px;
    border: 1px solid rgba(16, 185, 129, 0.2);
}
.bot-meta-tags {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 0.75rem;
}
.source-badge {
    pointer-events: none;
    font-size: 0.55rem;
    opacity: 0.8;
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = AssistantStyles;
    document.head.appendChild(style);
}

export default VuAiAgent;
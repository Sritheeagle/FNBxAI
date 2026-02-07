const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

const headersJson = { 'Content-Type': 'application/json' };

function getAuthHeaders() {
    const headers = {};

    if (typeof window !== 'undefined' && window.localStorage) {
        const adminToken = window.localStorage.getItem('adminToken');
        const facultyToken = window.localStorage.getItem('facultyToken');
        const studentToken = window.localStorage.getItem('studentToken');

        if (adminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`;
            headers['x-admin-token'] = adminToken;
        } else if (facultyToken) {
            headers['Authorization'] = `Bearer ${facultyToken}`;
            headers['x-faculty-token'] = facultyToken;
        } else if (studentToken) {
            headers['Authorization'] = `Bearer ${studentToken}`;
            headers['x-student-token'] = studentToken;
        }
    }
    return headers;
}

export async function apiGet(path) {
    try {
        const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, { headers: { ...getAuthHeaders() } });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            // Handle Database Disconnected (503) gracefully
            if (res.status === 503) {
                console.warn(`⚠️ API 503 (Service Unavailable) at ${path}: ${data.error || 'Database disconnected'}`);
                return null; // Return null so UI can handle "no data" gracefully without crashing
            }

            const err = new Error(data.details || data.error || `GET ${path} failed: ${res.status}`);
            err.status = res.status;
            err.details = data;
            throw err;
        }
        return data;
    } catch (e) {
        // Network errors (e.g. server down)
        if (e.message.includes('Failed to fetch')) {
            console.warn(`⚠️ Network Error at ${path}: Backend likely down.`);
            return null;
        }
        throw e;
    }
}

export async function apiPost(path, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s frontend timeout

    try {
        const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
            method: 'POST',
            headers: { ...headersJson, ...getAuthHeaders() },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.details || data.error || `POST ${path} failed: ${res.status}`);
            err.status = res.status;
            err.details = data;
            throw err;
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

export async function apiPut(path, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
        const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
            method: 'PUT',
            headers: { ...headersJson, ...getAuthHeaders() },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.details || data.error || `PUT ${path} failed: ${res.status}`);
            err.status = res.status;
            err.details = data;
            throw err;
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.message.includes('Failed to fetch')) {
            console.error(`❌ Network Error (PUT) at ${path}. Check if backend at ${API_URL} is running.`);
        }
        throw err;
    }
}

export async function apiDelete(path) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
        const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
            method: 'DELETE',
            headers: { ...getAuthHeaders() },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.details || data.error || `DELETE ${path} failed: ${res.status}`);
            err.status = res.status;
            err.details = data;
            throw err;
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.message.includes('Failed to fetch')) {
            console.error(`❌ Network Error (DELETE) at ${path}. Check if backend at ${API_URL} is running.`);
        }
        throw err;
    }
}

export async function apiUpload(path, formData, method = 'POST') {
    const headers = { ...getAuthHeaders() };
    const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
        method: method,
        body: formData,
        headers: headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || data.error || `Upload failed: ${res.status}`);
        err.status = res.status;
        err.details = data;
        throw err;
    }
    return data;
}

export async function adminLogin(adminId, password) {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/admin/login`, {
        method: 'POST', headers: headersJson, body: JSON.stringify({ adminId, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Login failed: ${res.status}`);
    if (data.token) window.localStorage.setItem('adminToken', data.token);
    return data;
}

export async function facultyLogin(facultyId, password) {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/faculty/login`, {
        method: 'POST', headers: headersJson, body: JSON.stringify({ facultyId, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Login failed: ${res.status}`);
    if (data.token) window.localStorage.setItem('facultyToken', data.token);
    return data;
}

export async function studentLogin(sid, password) {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/students/login`, {
        method: 'POST', headers: headersJson, body: JSON.stringify({ sid, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Login failed: ${res.status}`);
    if (data.token) {
        window.localStorage.setItem('studentToken', data.token);
        window.localStorage.setItem('userData', JSON.stringify(data.studentData));
    }
    return data;
}

export async function studentRegister(studentData) {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/students/register`, {
        method: 'POST', headers: headersJson, body: JSON.stringify(studentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Registration failed: ${res.status}`);
    if (data.token) {
        window.localStorage.setItem('studentToken', data.token);
        window.localStorage.setItem('userData', JSON.stringify(data.studentData));
    }
    return data;
}

export async function adminLogout() {
    return { success: true };
}

export async function facultyLogout() {
    return { success: true };
}

const client = {
    apiGet, apiPost, apiPut, apiDelete, apiUpload,
    adminLogin, adminLogout, facultyLogin, facultyLogout,
    studentLogin, studentRegister
};

export default client;

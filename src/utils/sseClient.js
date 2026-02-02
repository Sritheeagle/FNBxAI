const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

let es = null;
const listeners = new Set();

function ensure() {
  if (es) return es;
  try {
    es = new EventSource(`${API_URL}/api/stream`);
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        listeners.forEach(cb => {
          try { cb(data); } catch (e) { console.error('sse listener error', e); }
        });
      } catch (e) {
        console.warn('Failed to parse SSE message', e);
      }
    };
    es.onerror = (err) => {
      console.warn('SSE error', err);
      // try reconnect by closing and recreating
      try { es.close(); } catch (e) { }
      es = null;
      setTimeout(ensure, 2000);
    };
  } catch (e) {
    console.warn('EventSource not available', e);
  }
  return es;
}

const sseClient = {
  onUpdate(cb) {
    if (typeof cb !== 'function') return () => { };
    listeners.add(cb);
    ensure();
    return () => listeners.delete(cb);
  }
};

export default sseClient;

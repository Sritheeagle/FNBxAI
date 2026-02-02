import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>FNB-XAI System v2.0</h1>
            <p>Modern Academic Management System</p>
          </header>
          <main>
            <Routes>
              <Route path="/" element={
                <div>
                  <h2>Welcome to FNB-XAI System</h2>
                  <p>Backend API: <a href="http://localhost:5000/api-docs" target="_blank" rel="noopener noreferrer">API Documentation</a></p>
                  <p>System Health: <a href="http://localhost:5000/api/system/health" target="_blank" rel="noopener noreferrer">Health Check</a></p>
                </div>
              } />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/faculty" element={<Navigate to="/" replace />} />
              <Route path="/student" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

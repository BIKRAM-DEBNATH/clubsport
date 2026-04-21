import React from 'react';

const ErrorPage = ({ statusCode = 404, message = 'Page Not Found', showHome = true }) => {
  const getErrorMessage = (code) => {
    const messages = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Page Not Found',
      500: 'Server Error',
      503: 'Service Unavailable',
    };
    return messages[code] || 'Error';
  };

  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
      }}>
        <h1 style={{
          fontSize: '48px',
          color: '#dc3545',
          margin: '0 0 20px 0',
        }}>
          {statusCode}
        </h1>
        <h2 style={{
          fontSize: '24px',
          color: '#333',
          margin: '0 0 10px 0',
        }}>
          {message || getErrorMessage(statusCode)}
        </h2>
        <p style={{
          color: '#666',
          marginBottom: '30px',
          fontSize: '16px',
        }}>
          {statusCode === 404 && "The page you're looking for doesn't exist."}
          {statusCode === 500 && "Something went wrong on our end. Please try again later."}
          {statusCode === 503 && "The service is temporarily unavailable. Please try again later."}
        </p>
        {showHome && (
          <div>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              Go Home
            </a>
            <a
              href="/admin/login"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Admin Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;

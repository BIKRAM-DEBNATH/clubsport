import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", sender: 'bot' }
  ]);
  const [currentStep, setCurrentStep] = useState('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  // Periodic greeting animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowGreeting(true);
        setTimeout(() => setShowGreeting(false), 3000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowGreeting(false);
  };

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text,
      sender,
      timestamp: new Date()
    }]);
  };

  const handleOptionClick = async (option) => {
    addMessage(option, 'user');
    setIsLoading(true);

    try {
      let botResponse = '';

      switch(option) {
        case 'Check Application Status':
          botResponse = 'Please provide your application number to check status.';
          setCurrentStep('status');
          break;

        case 'Withdraw Application':
          botResponse = 'Please provide your application number to withdraw.';
          setCurrentStep('withdraw');
          break;

        case 'Search Application by Phone':
          botResponse = 'Please enter your phone number to search for your application.';
          setCurrentStep('search');
          break;

        case 'Contact Details':
          // Contact details are static — no backend call needed
          botResponse = `📞 **BikramSports Club Contact Details:**

📧 Email: bikramdebnath905@gmail.com
📱 Phone: +91 6294920220
🏢 Address: BikramSports Club, Sports Complex, City, State - PIN
⏰ Support Hours: Monday to Friday: 9:00 AM - 6:00 PM IST
🚨 Emergency: +91 6294920220`;
          setCurrentStep('menu');
          break;

        case 'Update Details':
          botResponse = 'Please provide your application number to update details.';
          setCurrentStep('update');
          break;

        default:
          botResponse = 'Please select an option from the menu.';
          setCurrentStep('menu');
      }

      addMessage(botResponse, 'bot');

    } catch (error) {
      addMessage(`❌ Error: ${error.message || 'Something went wrong'}`, 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputSubmit = async (input) => {
    addMessage(input, 'user');
    setIsLoading(true);

    try {
      let botResponse = '';
      const trimmed = input.trim();

      switch(currentStep) {
        case 'status': {
          const res = await api.get(`/chatbot/status/${trimmed}`);
          const data = res.data;

          if (data.success) {
            const app = data.data;
            botResponse = `📋 **Application Status for ${app.registrationNumber}:**

👤 Name: ${app.firstName} ${app.lastName}
📧 Email: ${app.email}
📱 Mobile: ${app.mobile}
🎯 Age Group: ${app.ageGroup}
🏆 Status: ${app.status}
💰 Payment: ${app.paymentStatus}
📅 Registered: ${new Date(app.createdAt).toLocaleDateString()}

${app.adminRemarks ? `📝 Remarks: ${app.adminRemarks}` : ''}
${app.missingDocuments?.length > 0 ? `📄 Missing Documents: ${app.missingDocuments.join(', ')}` : '✅ All documents submitted'}`;
          } else {
            botResponse = `⚠️ ${data.message || 'Application not found.'}`;
          }
          break;
        }

        case 'withdraw': {
          const res = await api.post(`/chatbot/withdraw/${trimmed}`, {
            reason: 'Withdrawn via chatbot'
          });
          const data = res.data;

          if (data.success) {
            botResponse = `✅ **Application Withdrawn Successfully!**

Application ${data.data.registrationNumber} has been withdrawn.
Status: ${data.data.status}
Withdrawn on: ${new Date(data.data.withdrawnAt).toLocaleString()}

If you change your mind, you can register again.`;
          } else {
            botResponse = `⚠️ ${data.message || 'Unable to withdraw application.'}`;
          }
          break;
        }

        case 'search': {
          const res = await api.get(`/chatbot/search?phone=${trimmed}`);
          const data = res.data;

          if (data.success) {
            const app = data.data;
            botResponse = `🔍 **Application Found!**

📋 Registration Number: ${app.registrationNumber}
👤 Name: ${app.firstName} ${app.lastName}
📧 Email: ${app.email}
🏆 Status: ${app.status}
📅 Registered: ${new Date(app.createdAt).toLocaleDateString()}

You can use this registration number to check status or make updates.`;
          } else {
            botResponse = `⚠️ ${data.message || 'No application found with this phone number.'}`;
          }
          break;
        }

        case 'update':
          botResponse = `To update your application details for ${trimmed}, please visit our website or contact support directly. This feature is coming soon in the chatbot!`;
          break;

        default:
          botResponse = 'Please select an option from the menu.';
      }

      addMessage(botResponse, 'bot');
      setCurrentStep('completed');

    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Unknown error';
      const status = error.response?.status;
      const url = error.config?.url;
      addMessage(
        `❌ **Backend Error**${status ? ` (${status})` : ''}\n\n` +
        `${errMsg}\n\n` +
        `${url ? `🔗 URL: ${url}` : ''}\n\n` +
        `Please make sure:\n` +
        `• Backend server is running on port 5000\n` +
        `• VITE_API_URL is set correctly in .env`,
        'bot'
      );
      setCurrentStep('menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToMenu = () => {
    setCurrentStep('menu');
    addMessage('🔄 Returned to main menu. How can I help you?', 'bot');
  };

  const renderMenu = () => (
    <div className="chat-options">
      <button onClick={() => handleOptionClick('Check Application Status')} className="option-btn" disabled={isLoading}>
        📋 Check Application Status
      </button>
      <button onClick={() => handleOptionClick('Withdraw Application')} className="option-btn" disabled={isLoading}>
        ❌ Withdraw Application
      </button>
      <button onClick={() => handleOptionClick('Search Application by Phone')} className="option-btn" disabled={isLoading}>
        🔍 Search Application by Phone
      </button>
      <button onClick={() => handleOptionClick('Contact Details')} className="option-btn" disabled={isLoading}>
        📞 Contact Details
      </button>
      <button onClick={() => handleOptionClick('Update Details')} className="option-btn" disabled={isLoading}>
        ✏️ Update Details
      </button>
    </div>
  );

  const renderInput = () => (
    <div className="chat-input-container">
      <input
        type="text"
        placeholder={currentStep === 'search' ? "Enter phone number (10 digits)..." : "Enter application number..."}
        className="chat-input"
        onKeyPress={(e) => {
          if (e.key === 'Enter' && e.target.value.trim() && !isLoading) {
            handleInputSubmit(e.target.value.trim());
            e.target.value = '';
          }
        }}
        disabled={isLoading}
      />
      {isLoading && <div className="loading-indicator">⏳ Processing...</div>}
    </div>
  );

  const renderReturnToMenu = () => (
    <div className="chat-options">
      <button onClick={handleReturnToMenu} className="option-btn return-menu-btn">
        🔄 Return to Main Menu
      </button>
    </div>
  );

  return (
    <>
      {showGreeting && !isOpen && (
        <div className="chatbot-greeting">
          <div className="greeting-content">
            <span className="greeting-text">👋 Hello! Need help?</span>
            <button onClick={toggleChat} className="greeting-close">×</button>
          </div>
          <div className="greeting-arrow"></div>
        </div>
      )}

      <div className="chatbot-toggle" onClick={toggleChat}>
        <div className="chat-icon">💬</div>
      </div>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chat-header">
            <h3>BikramSports Support</h3>
            <button onClick={toggleChat} className="close-btn">×</button>
          </div>

          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  {message.text.split('\n').map((line, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>{line}</div>
                   ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-footer">
            {currentStep === 'menu' ? renderMenu() :
             currentStep === 'completed' ? renderReturnToMenu() :
             renderInput()}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;


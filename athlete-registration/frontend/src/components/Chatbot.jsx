import React, { useState, useEffect } from 'react';
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
      // Only show greeting if chat is not open and no recent interaction
      if (!isOpen) {
        setShowGreeting(true);
        // Hide greeting after 3 seconds
        setTimeout(() => {
          setShowGreeting(false);
        }, 3000);
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowGreeting(false); // Hide greeting when opening chat
  };

  const addMessage = (text, sender) => {
    const newMessage = {
      id: messages.length + 1,
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionClick = async (option) => {
    addMessage(option, 'user');

    setIsLoading(true);
    try {
      let response;
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
          try {
            const res = await fetch('/api/chatbot/contact');
            const data = await res.json();
            if (data.success) {
              const contact = data.data;
              botResponse = `📞 **BikramSports Club Contact Details:**

📧 Email: ${contact.email}
📱 Phone: ${contact.phone}
🏢 Address: ${contact.address}
⏰ Support Hours: ${contact.supportHours}
🚨 Emergency: ${contact.emergencyContact}`;
            } else {
              botResponse = 'Sorry, unable to fetch contact details at the moment.';
            }
          } catch (error) {
            console.error('Error fetching contact details:', error);
            botResponse = 'Sorry, unable to fetch contact details at the moment.';
          }
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
      console.error('Error handling option:', error);
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputSubmit = async (input) => {
    addMessage(input, 'user');
    setIsLoading(true);

    try {
      let response;
      let botResponse = '';

      switch(currentStep) {
        case 'status':
          try {
            response = await fetch(`/api/chatbot/status/${input.trim()}`);
            const data = await response.json();

            if (response.ok && data.success) {
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
${app.missingDocuments && app.missingDocuments.length > 0 ?
  `📄 Missing Documents: ${app.missingDocuments.join(', ')}` : '✅ All documents submitted'}`;
            } else {
              botResponse = data.message || 'Application not found. Please check your application number.';
            }
          } catch (error) {
            console.error('Error checking status:', error);
            botResponse = 'Sorry, unable to check status at the moment. Please try again later.';
          }
          break;

        case 'withdraw':
          try {
            response = await fetch(`/api/chatbot/withdraw/${input.trim()}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ reason: 'Withdrawn via chatbot' })
            });
            const data = await response.json();

            if (response.ok && data.success) {
              botResponse = `✅ **Application Withdrawn Successfully!**

Application ${data.data.registrationNumber} has been withdrawn.
Status: ${data.data.status}
Withdrawn on: ${new Date(data.data.withdrawnAt).toLocaleString()}

If you change your mind, you can register again.`;
            } else {
              botResponse = data.message || 'Unable to withdraw application. Please try again.';
            }
          } catch (error) {
            console.error('Error withdrawing application:', error);
            botResponse = 'Sorry, unable to process withdrawal at the moment. Please try again later.';
          }
          break;

        case 'search':
          try {
            response = await fetch(`/api/chatbot/search?phone=${input.trim()}`);
            const data = await response.json();

            if (response.ok && data.success) {
              const app = data.data;
              botResponse = `🔍 **Application Found!**

📋 Registration Number: ${app.registrationNumber}
👤 Name: ${app.firstName} ${app.lastName}
📧 Email: ${app.email}
🏆 Status: ${app.status}
📅 Registered: ${new Date(app.createdAt).toLocaleDateString()}

You can use this registration number to check status or make updates.`;
            } else {
              botResponse = data.message || 'No application found with this phone number.';
            }
          } catch (error) {
            console.error('Error searching application:', error);
            botResponse = 'Sorry, unable to search at the moment. Please try again later.';
          }
          break;

        case 'update':
          botResponse = `To update your application details for ${input.trim()}, please visit our website or contact support directly. This feature is coming soon in the chatbot!`;
          break;

        default:
          botResponse = 'Please select an option from the menu.';
      }

      addMessage(botResponse, 'bot');
      setCurrentStep('completed'); // Show return to menu button

    } catch (error) {
      console.error('Error processing input:', error);
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
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
      {/* Greeting Popup */}
      {showGreeting && !isOpen && (
        <div className="chatbot-greeting">
          <div className="greeting-content">
            <span className="greeting-text">👋 Hello! Need help?</span>
            <button onClick={toggleChat} className="greeting-close">×</button>
          </div>
          <div className="greeting-arrow"></div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <div className="chatbot-toggle" onClick={toggleChat}>
        <div className="chat-icon">
          💬
        </div>
      </div>

      {/* Chat Window */}
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
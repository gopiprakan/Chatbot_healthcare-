document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    // API Endpoint Setup
    const API_URL = 'http://localhost:5000/chat';

    // Function to generate current time
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    }

    // Auto-scroll to bottom of chat
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Function to append a message to the chat
    function appendMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', sender);
        
        // For bot, check if HTML content (to support line breaks if any)
        let formattedText = text;
        // Basic markdown to html replacement (bold and line breaks)
        formattedText = formattedText.replace(/\n/>g, '<br>');
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        wrapper.innerHTML = `
            <div class="message">${formattedText}</div>
            <span class="timestamp">${getCurrentTime()}</span>
        `;
        
        chatContainer.appendChild(wrapper);
        scrollToBottom();
    }

    // Show Typing Indicator
    function showTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.id = 'typingIndicator';
        wrapper.classList.add('message-wrapper', 'bot');
        
        wrapper.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        chatContainer.appendChild(wrapper);
        scrollToBottom();
        return wrapper;
    }

    // Remove Typing Indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Send Message Logic
    async function sendMessage(text) {
        if (!text.trim()) return;

        // 1. Display User Message
        appendMessage(text, 'user');
        messageInput.value = '';

        // 2. Show Bot Typing
        showTypingIndicator();

        // 3. API Call to Backend
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });
            
            removeTypingIndicator();
            
            if (response.ok) {
                const data = await response.json();
                // Assume standard response format { response: "bot answer" } 
                // or fallback to text representation
                const botReply = data.response || data.answer || data.message || JSON.stringify(data);
                appendMessage(botReply, 'bot');
            } else {
                throw new Error('Server responded with an error status: ' + response.status);
            }
        } catch (error) {
            removeTypingIndicator();
            console.error("API Fetch Error:", error);
            
            // Display error message to user
            appendMessage("⚠️ I'm sorry, I couldn't connect to the server. Please ensure the backend is running at " + API_URL + ".", 'bot');
        }
    }

    // Event Listeners for sending message
    sendBtn.addEventListener('click', () => {
        sendMessage(messageInput.value);
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(messageInput.value);
        }
    });

    // Quick Suggestions Handling (Exposed to global for onclick ease)
    window.handleSuggestion = function(text) {
        sendMessage(text);
    };

    // Clear Chat functionality
    clearChatBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to clear the conversation?')) {
            chatContainer.innerHTML = '';
            appendMessage("Conversation cleared. How can I assist you further?", 'bot');
        }
    });

    // Dark Mode Toggle
    themeToggleBtn.addEventListener('click', () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const themeIcon = themeToggleBtn.querySelector('i');
        const themeText = themeToggleBtn.querySelector('span');
        
        if (currentTheme === 'light') {
            body.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            themeText.textContent = 'Light Mode';
        } else {
            body.setAttribute('data-theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            themeText.textContent = 'Dark Mode';
        }
    });

    // Voice Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        let isRecording = false;

        recognition.onstart = function() {
            isRecording = true;
            voiceBtn.classList.add('mic-active');
            messageInput.placeholder = 'Listening...';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
        };

        recognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
        };

        recognition.onend = function() {
            isRecording = false;
            voiceBtn.classList.remove('mic-active');
            messageInput.placeholder = 'Describe your symptoms or ask a health question...';
            
            // Auto-send if something was transcribed
            if (messageInput.value.trim() !== '') {
                sendMessage(messageInput.value);
            }
        };

        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        // Browser doesn't support Speech API
        voiceBtn.addEventListener('click', () => {
            alert('Microphone feature is not supported in your browser.');
        });
    }
    
    // Mobile Sidebar Toggle
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarBackdrop.classList.toggle('active');
    }
    
    hamburgerBtn.addEventListener('click', toggleSidebar);
    sidebarBackdrop.addEventListener('click', toggleSidebar);
    
    // Allow clicking sidebar items to visually switch active state
    const navItems = document.querySelectorAll('.nav-items .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            if(window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
});

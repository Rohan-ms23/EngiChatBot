document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const newChatBtn = document.getElementById('new-chat-btn');
    const promptBtns = document.querySelectorAll('.prompt-btn');
    const chatHistoryList = document.getElementById('chat-history');

    // State Variables
    let apiKey = localStorage.getItem('gemini_api_key') || '';
    let isGenerating = false;
    
    // Chat History Database System
    let savedChats = JSON.parse(localStorage.getItem('engimind_chats')) || [];
    let currentChatId = null;

    // Initialize Markdown syntax highlighting
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });

    // Initial Setup
    renderHistoryList();

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-sun"></i> Theme' : '<i class="fa-solid fa-moon"></i> Theme';
    });

    // UI Toggles
    menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    settingsBtn.addEventListener('click', () => {
        apiKeyInput.value = apiKey;
        settingsModal.style.display = 'flex';
    });
    
    closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    
    saveKeyBtn.addEventListener('click', () => {
        apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
            settingsModal.style.display = 'none';
        } else {
            alert('Please enter a valid API key.');
        }
    });

    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 150 ? this.scrollHeight : 150) + 'px';
    });

    // Handle Clicks & Enters
    promptBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            userInput.value = btn.getAttribute('data-prompt');
            handleSend();
        });
    });

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    newChatBtn.addEventListener('click', startNewChat);

    // --- Core Chat Functions ---

    function startNewChat() {
        currentChatId = null;
        chatBox.innerHTML = '';
        chatBox.appendChild(welcomeScreen);
        welcomeScreen.style.display = 'flex';
        renderHistoryList(); // clear active state
        if(window.innerWidth <= 768) sidebar.classList.remove('active');
    }

    function loadSpecificChat(id) {
        currentChatId = id;
        const chatData = savedChats.find(c => c.id === id);
        if(!chatData) return;

        // Clear screen and hide welcome
        chatBox.innerHTML = '';
        welcomeScreen.style.display = 'none';

        // Re-render past messages
        chatData.messages.forEach(msg => {
            appendMessage(msg.role, msg.content, false); // false = don't save to storage again
        });

        renderHistoryList(); // Update active highlight
        if(window.innerWidth <= 768) sidebar.classList.remove('active');
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text || isGenerating) return;

        if (!apiKey) {
            settingsModal.style.display = 'flex';
            return;
        }

        welcomeScreen.style.display = 'none';
        
        // Print user message to screen and save it
        appendMessage('user', text, true);
        
        userInput.value = '';
        userInput.style.height = 'auto';
        
        isGenerating = true;
        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetchGeminiAPI(text);
            typingIndicator.remove();
            // Print AI message to screen and save it
            appendMessage('ai', response, true);
        } catch (error) {
            typingIndicator.remove();
            appendMessage('ai', `**Error:** ${error.message}`, false);
        } finally {
            isGenerating = false;
        }
    }

    function appendMessage(sender, text, shouldSave = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-bolt"></i>';
        
        const content = document.createElement('div');
        content.className = 'msg-content';
        
        if (sender === 'ai') {
            content.innerHTML = marked.parse(text);
        } else {
            content.textContent = text;
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        if (shouldSave) saveToDatabase(sender, text);
    }

    // --- Database / Saving Logic ---

    function saveToDatabase(role, content) {
        // If it's the very first message, create a new chat container
        if (!currentChatId) {
            currentChatId = Date.now().toString();
            // Use the first 25 characters of the first user message as the title
            const title = role === 'user' ? content.substring(0, 25) + '...' : 'New Chat';
            
            savedChats.unshift({
                id: currentChatId,
                title: title,
                messages: []
            });
        }

        // Find the active chat and push the new message
        const activeChat = savedChats.find(c => c.id === currentChatId);
        if (activeChat) {
            activeChat.messages.push({ role: role, content: content });
            localStorage.setItem('engimind_chats', JSON.stringify(savedChats));
            renderHistoryList();
        }
    }

    function renderHistoryList() {
        chatHistoryList.innerHTML = '';
        
        savedChats.forEach(chat => {
            const li = document.createElement('li');
            li.className = 'history-item';
            if (chat.id === currentChatId) li.classList.add('active');
            
            li.innerHTML = `<i class="fa-regular fa-message"></i> ${chat.title}`;
            li.onclick = () => loadSpecificChat(chat.id);
            
            chatHistoryList.appendChild(li);
        });
    }

    // --- Helpers ---

    function showTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai';
        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-bolt"></i></div>
            <div class="msg-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
        `;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return msgDiv;
    }

    async function fetchGeminiAPI(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `Status ${response.status}`);
        return data.candidates[0].content.parts[0].text;
    }
});

    // --- Voice Input (Web Speech API) ---
    // Check if the browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stops automatically when you pause speaking
        recognition.interimResults = true; // Shows words as you speak them
        
        let isRecording = false;

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            userInput.placeholder = "Listening...";
        };

        recognition.onresult = (event) => {
            let currentTranscript = '';
            // Piece together the words
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            userInput.value = currentTranscript;
            
            // Auto-resize the text box as words fill in
            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight < 150 ? userInput.scrollHeight : 150) + 'px';
        };

        recognition.onerror = (event) => {
            console.error("Microphone error:", event.error);
            stopRecording();
        };

        recognition.onend = () => {
            stopRecording();
        };

        function stopRecording() {
            isRecording = false;
            micBtn.classList.remove('recording');
            userInput.placeholder = "Ask an engineering question...";
        }

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                userInput.value = ''; // Clear the box before recording
                recognition.start();
            }
        });
    } else {
        // If the browser (like old versions or some mobile browsers) doesn't support it, hide the button
        micBtn.style.display = 'none';
        console.warn("Speech Recognition API not supported in this browser.");
    }

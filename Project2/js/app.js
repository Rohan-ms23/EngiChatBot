import { IntentRouter } from './router.js';
import { GeminiAPI } from './api.js';
import { QuizEngine } from './quizEngine.js';
import { FAQManager } from './faqManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const chatHistoryList = document.getElementById('chat-history');
    const aiStatus = document.getElementById('ai-status');

    // State & Modules
    let apiKey = localStorage.getItem('gemini_api_key') || '';
    let isGenerating = false;
    let savedChats = JSON.parse(localStorage.getItem('engimind_chats')) || [];
    let currentChatId = null;
    
    const api = new GeminiAPI();
    const quizEngine = new QuizEngine(chatBox);
    const faqManager = new FAQManager('faq-modal', 'faq-list-container', 'close-faq-btn');

    // Init Config
    marked.setOptions({
        highlight: (code, lang) => hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value
    });
    renderHistoryList();

    // Basic Event Listeners
    document.getElementById('menu-btn').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('close-sidebar-btn').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('new-chat-btn').addEventListener('click', startNewChat);
    
    document.getElementById('faq-btn').addEventListener('click', () => {
        faqManager.open();
        if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
    });

    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i> Theme' : '<i class="fa-solid fa-moon"></i> Theme';
    });

    // Settings Modal
    settingsBtn.addEventListener('click', () => { apiKeyInput.value = apiKey; settingsModal.style.display = 'flex'; });
    document.getElementById('close-modal-btn').addEventListener('click', () => settingsModal.style.display = 'none');
    document.getElementById('save-key-btn').addEventListener('click', () => {
        apiKey = apiKeyInput.value.trim();
        if (apiKey) { localStorage.setItem('gemini_api_key', apiKey); settingsModal.style.display = 'none'; }
    });

    // Prompt Buttons & Sending
    document.querySelectorAll('.prompt-btn').forEach(btn => {
        btn.addEventListener('click', () => { userInput.value = btn.getAttribute('data-prompt'); handleSend(); });
    });
    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    userInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight < 150 ? this.scrollHeight : 150) + 'px'; });

    // Voice Input
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && micBtn) {
        const recognition = new SpeechRecognition();
        let isRecording = false;
        recognition.onstart = () => { isRecording = true; micBtn.classList.add('recording'); userInput.placeholder = "Listening..."; };
        recognition.onresult = (e) => { let transcript = ''; for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript; userInput.value = transcript; };
        recognition.onend = () => { isRecording = false; micBtn.classList.remove('recording'); userInput.placeholder = "Ask a question..."; };
        micBtn.addEventListener('click', () => isRecording ? recognition.stop() : recognition.start());
    } else {
        micBtn.style.display = 'none';
    }

    // PDF Export
    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        html2pdf().set({ margin: 10, filename: `Notes_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 } }).from(chatBox).save();
    });

    // Core Logic
    async function handleSend() {
        const text = userInput.value.trim();
        if (!text || isGenerating) return;
        if (!apiKey) return settingsModal.style.display = 'flex';

        welcomeScreen.style.display = 'none';
        appendMessage('user', text, true);
        userInput.value = ''; userInput.style.height = 'auto';
        
        isGenerating = true; aiStatus.innerText = "Thinking..."; aiStatus.style.color = "orange";
        const typingIndicator = showTypingIndicator();
        const intent = IntentRouter.route(text);

        try {
            const rawResponse = await api.generateResponse(apiKey, text, intent);
            typingIndicator.remove();
            
            if (intent.mode === 'quiz') {
                try {
                    const quizData = JSON.parse(rawResponse.replace(/```json/g, '').replace(/```/g, ''));
                    quizEngine.startQuiz(quizData);
                    saveToDatabase('ai', "[Interactive Quiz Generated]");
                } catch (e) {
                    appendMessage('ai', "Failed to generate valid quiz format. Try asking again.", false);
                }
            } else {
                appendMessage('ai', rawResponse, true);
            }
        } catch (error) {
            typingIndicator.remove();
            appendMessage('ai', `**Error:** ${error.message}`, false);
        } finally {
            isGenerating = false; aiStatus.innerText = "Online"; aiStatus.style.color = "var(--accent-color)";
        }
    }

    function appendMessage(sender, text, shouldSave = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = `<div class="msg-avatar">${sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-graduation-cap"></i>'}</div>
                            <div class="msg-content">${sender === 'ai' ? marked.parse(text) : text}</div>`;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        if (shouldSave) saveToDatabase(sender, text);
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message ai';
        div.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-graduation-cap"></i></div><div class="msg-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return div;
    }

    // Database
    function saveToDatabase(role, content) {
        if (!currentChatId) {
            currentChatId = Date.now().toString();
            savedChats.unshift({ id: currentChatId, title: role === 'user' ? content.substring(0, 25) + '...' : 'New Session', messages: [] });
        }
        const chat = savedChats.find(c => c.id === currentChatId);
        if (chat) { chat.messages.push({ role, content }); localStorage.setItem('engimind_chats', JSON.stringify(savedChats)); renderHistoryList(); }
    }

    function renderHistoryList() {
        chatHistoryList.innerHTML = '';
        savedChats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            li.innerHTML = `<i class="fa-solid fa-chalkboard-user"></i> ${chat.title}`;
            li.onclick = () => loadSpecificChat(chat.id);
            chatHistoryList.appendChild(li);
        });
    }

    function loadSpecificChat(id) {
        currentChatId = id; const chat = savedChats.find(c => c.id === id); if(!chat) return;
        chatBox.innerHTML = ''; welcomeScreen.style.display = 'none';
        chat.messages.forEach(msg => { if(msg.content !== "[Interactive Quiz Generated]") appendMessage(msg.role, msg.content, false); });
        renderHistoryList(); if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
    }

    function startNewChat() {
        currentChatId = null; chatBox.innerHTML = ''; chatBox.appendChild(welcomeScreen); welcomeScreen.style.display = 'flex';
        renderHistoryList(); if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
    }
});
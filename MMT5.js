// ============ CONFIG ============
const WEBHOOK_URL = "https://n8n.srv1220381.hstgr.cloud/webhook/a6cc63aa-d05f-43f5-aaf8-5dede32919a2";
const STORAGE_KEYS = {
    users: 'mmt_users',
    currentUser: 'mmt_current_user',
    chats: 'mmt_chats',
    theme: 'mmt_theme',
    settings: 'mmt_settings'
};

// ============ STATE ============
let currentUser = null;
let chats = {};
let activeChat = null;
let isRecording = false;
let recognition = null;

// ============ UTILITIES ============
const uuid = () => crypto.randomUUID();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const showToast = (message, type = 'info') => {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const loadFromStorage = (key, defaultValue = null) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const hashPassword = async (password) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============ AUTH ============
const initAuth = () => {
    const authModal = $('#authModal');
    const loginBtn = $('#loginBtn');
    const registerBtn = $('#registerBtn');
    const authTabs = $$('.auth-tab');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');


            $$('.auth-form').forEach(f => f.classList.remove('active'));
            $(`#${tab.dataset.tab}Form`).classList.add('active');
        });
    });

    loginBtn.addEventListener('click', async () => {
        const email = $('#loginEmail').value.trim();
        const password = $('#loginPassword').value;

        if (!email || !password) {
            showToast('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        const users = loadFromStorage(STORAGE_KEYS.users, {});
        const hashedPass = await hashPassword(password);

        if (users[email] && users[email].password === hashedPass) {
            currentUser = users[email];
            saveToStorage(STORAGE_KEYS.currentUser, email);
            authModal.classList.remove('active');
            initApp();
            showToast(`Willkommen zurück, ${currentUser.name}!`, 'success');
        } else {
            showToast('Ungültige Anmeldedaten', 'error');
        }
    });

    registerBtn.addEventListener('click', async () => {
        const name = $('#regName').value.trim();
        const email = $('#regEmail').value.trim();
        const password = $('#regPassword').value;

        if (!name || !email || !password) {
            showToast('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        const users = loadFromStorage(STORAGE_KEYS.users, {});

        if (users[email]) {
            showToast('E-Mail bereits registriert', 'error');
            return;
        }

        const hashedPass = await hashPassword(password);
        users[email] = {
            name,
            email,
            password: hashedPass,
            createdAt: new Date().toISOString()
        };

        saveToStorage(STORAGE_KEYS.users, users);
        showToast('Account erfolgreich erstellt!', 'success');

        // Auto-login
        currentUser = users[email];
        saveToStorage(STORAGE_KEYS.currentUser, email);
        authModal.classList.remove('active');
        initApp();
    });

    // Check if already logged in
    const savedEmail = loadFromStorage(STORAGE_KEYS.currentUser);
    if (savedEmail) {
        const users = loadFromStorage(STORAGE_KEYS.users, {});
        if (users[savedEmail]) {
            currentUser = users[savedEmail];
            authModal.classList.remove('active');
            initApp();
        }
    }
};

// ============ APP INIT ============
const initApp = () => {
    $('#userName').textContent = currentUser.name;

    // Load user's chats
    const userChatsKey = `${STORAGE_KEYS.chats}_${currentUser.email}`;
    chats = loadFromStorage(userChatsKey, {});

    if (Object.keys(chats).length === 0) {
        createNewChat();
    } else {
        activeChat = Object.keys(chats)[0];
        renderSidebar();
        renderMessages();
    }

    initEventListeners();
    initStarfield();
    initTheme();
    initCommandPalette();
    updateStats();
};

// ============ CHAT MANAGEMENT ============
const saveChats = () => {
    const userChatsKey = `${STORAGE_KEYS.chats}_${currentUser.email}`;
    saveToStorage(userChatsKey, chats);
    updateStats();
};

const createNewChat = () => {
    const id = uuid();
    chats[id] = {
        id,
        name: `Chat ${Object.keys(chats).length + 1}`,
        messages: [],
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    activeChat = id;
    saveChats();
    renderSidebar();
    renderMessages();
    showToast('Neuer Chat erstellt', 'success');
};

const deleteChat = (id) => {
    if (confirm('Chat wirklich löschen?')) {
        delete chats[id];
        if (activeChat === id) {
            activeChat = Object.keys(chats)[0] || null;
            if (!activeChat) createNewChat();
        }
        saveChats();
        renderSidebar();
        renderMessages();
        showToast('Chat gelöscht', 'info');
    }
};

const toggleFavorite = (id) => {
    chats[id].favorite = !chats[id].favorite;
    saveChats();
    renderSidebar();
    showToast(chats[id].favorite ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt', 'success');
};

const switchChat = (id) => {
    activeChat = id;
    renderSidebar();
    renderMessages();
};

// ============ RENDERING ============
const renderSidebar = () => {
    const chatList = $('#chatList');
    const favoritesList = $('#favoritesList');

    chatList.innerHTML = '';
    favoritesList.innerHTML = '';

    Object.values(chats).forEach(chat => {
        const item = createChatItem(chat);
        chatList.appendChild(item.cloneNode(true));

        if (chat.favorite) {
            favoritesList.appendChild(item.cloneNode(true));
        }
    });

    // Re-attach event listeners

    $$('.chat-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-action-btn')) {
                switchChat(item.dataset.chatId);
            }
        });
    });

    updateChatHeader();
};

const createChatItem = (chat) => {
    const div = document.createElement('div');
    div.className = `chat-item ${chat.id === activeChat ? 'active' : ''}`;
    div.dataset.chatId = chat.id;

    const lastMsg = chat.messages[chat.messages.length - 1];
    const preview = lastMsg ? lastMsg.text.substring(0, 50) + '...' : 'Keine Nachrichten';

    div.innerHTML = `
        <div class="chat-item-content">
            <span class="chat-name">${chat.favorite ? '⭐ ' : ''}${chat.name}</span>
            <span class="chat-preview">${preview}</span>
        </div>
        <div class="chat-actions">
            <button class="chat-action-btn" onclick="toggleFavorite('${chat.id}')" title="Favorit">
                <i class="fa${chat.favorite ? 's' : 'r'} fa-star"></i>
            </button>
            <button class="chat-action-btn" onclick="deleteChat('${chat.id}')" title="Löschen">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return div;
};

const renderMessages = () => {
    const messagesDiv = $('#messages');
    const welcomeScreen = $('#welcomeScreen');

    if (!activeChat || chats[activeChat].messages.length === 0) {
        messagesDiv.innerHTML = '';
        messagesDiv.appendChild(welcomeScreen.cloneNode(true));

        // Attach quick action listeners

        $$('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => {
                $('#input').value = btn.dataset.prompt;
                $('#input').focus();
            });
        });
        return;
    }

    messagesDiv.innerHTML = '';
    chats[activeChat].messages.forEach((msg, idx) => {
        addMessageToDOM(msg.text, msg.sender, idx);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

const addMessageToDOM = (text, sender, idx = null) => {
    const messagesDiv = $('#messages');
    const welcomeScreen = messagesDiv.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();

    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.dataset.messageIdx = idx;

    if (sender === 'ai') {
        div.innerHTML = marked.parse(text);

        // Highlight code blocks
        div.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        // Render LaTeX
        if (window.MathJax) {
            MathJax.typesetPromise([div]).catch(err => console.log(err));
        }
    } else {
        div.textContent = text;
    }

    // Add message actions
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.innerHTML = `
        <button class="message-action-btn" onclick="copyMessage(${idx})">
            <i class="fas fa-copy"></i> Kopieren
        </button>
        ${sender === 'user' ? `<button class="message-action-btn" onclick="editMessage(${idx})">
            <i class="fas fa-edit"></i> Bearbeiten
        </button>` : ''}
        <button class="message-action-btn" onclick="deleteMessage(${idx})">
            <i class="fas fa-trash"></i> Löschen
        </button>
    `;

    div.appendChild(actions);
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    return div;
};

const addMessage = (text, sender) => {
    if (!activeChat) createNewChat();

    chats[activeChat].messages.push({ text, sender, timestamp: new Date().toISOString() });
    chats[activeChat].updatedAt = new Date().toISOString();
    saveChats();

    const idx = chats[activeChat].messages.length - 1;
    addMessageToDOM(text, sender, idx);
};

const showTypingIndicator = () => {
    const messagesDiv = $('#messages');
    const typing = document.createElement('div');
    typing.className = 'message ai typing';
    typing.id = 'typingIndicator';
    typing.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    `;
    messagesDiv.appendChild(typing);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

const removeTypingIndicator = () => {
    const typing = $('#typingIndicator');
    if (typing) typing.remove();
};

// ============ MESSAGE ACTIONS ============
window.copyMessage = (idx) => {
    const text = chats[activeChat].messages[idx].text;
    navigator.clipboard.writeText(text);
    showToast('In Zwischenablage kopiert', 'success');
};

window.editMessage = (idx) => {
    const msg = chats[activeChat].messages[idx];
    if (msg.sender !== 'user') return;

    const newText = prompt('Nachricht bearbeiten:', msg.text);
    if (newText && newText.trim()) {
        chats[activeChat].messages[idx].text = newText.trim();
        saveChats();
        renderMessages();
        showToast('Nachricht bearbeitet', 'success');
    }
};

window.deleteMessage = (idx) => {
    if (confirm('Nachricht löschen?')) {
        chats[activeChat].messages.splice(idx, 1);
        saveChats();
        renderMessages();
        showToast('Nachricht gelöscht', 'info');
    }
};

window.toggleFavorite = (id) => toggleFavorite(id);
window.deleteChat = (id) => deleteChat(id);

// ============ CHAT HEADER ============
const updateChatHeader = () => {
    if (!activeChat) return;

    const chat = chats[activeChat];
    $('#activeChatName').textContent = chat.name;
    $('#messageCount').textContent = `${chat.messages.length} Nachrichten`;

    const favBtn = $('#favoriteBtn i');
    favBtn.className = chat.favorite ? 'fas fa-star' : 'far fa-star';
};

// ============ STATS ============
const updateStats = () => {
    const totalMsgs = Object.values(chats).reduce((sum, chat) => sum + chat.messages.length, 0);
    const totalChatsCount = Object.keys(chats).length;

    $('#totalMessages').textContent = totalMsgs;
    $('#totalChats').textContent = totalChatsCount;
    $('#avgResponse').textContent = '2.3s'; // Placeholder
};

// ============ SEND MESSAGE ============
const sendMessage = async () => {
    const input = $('#input');
    const text = input.value.trim();

    if (!text || !activeChat) return;

    addMessage(text, 'user');
    input.value = '';
    input.style.height = 'auto';

    showTypingIndicator();

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{
                sessionId: activeChat,
                action: 'sendMessage',
                chatInput: text
            }])
        });

        const data = await response.json();
        removeTypingIndicator();

        const aiResponse = data[0]?.output || 'Keine Antwort erhalten';
        addMessage(aiResponse, 'ai');

    } catch (error) {
        removeTypingIndicator();
        addMessage('⚠️ Serverfehler. Bitte versuche es erneut.', 'ai');
        showToast('Verbindungsfehler', 'error');
    }
};

// ============ EVENT LISTENERS ============
const initEventListeners = () => {
    // Send message
    $('#send').addEventListener('click', sendMessage);

    const input = $('#input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });

    // New chat
    $('#newChat').addEventListener('click', createNewChat);

    // Logout
    $('#logoutBtn').addEventListener('click', () => {
        if (confirm('Wirklich abmelden?')) {
            localStorage.removeItem(STORAGE_KEYS.currentUser);
            location.reload();
        }
    });

    // Theme toggle
    $('#themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('light');
        const icon = $('#themeToggle i');
        icon.className = document.body.classList.contains('light') ? 'fas fa-sun' : 'fas fa-moon';
        saveToStorage(STORAGE_KEYS.theme, document.body.classList.contains('light') ? 'light' : 'dark');
    });

    // Favorite toggle
    $('#favoriteBtn').addEventListener('click', () => {
        if (activeChat) toggleFavorite(activeChat);
    });

    // Export
    $('#exportBtn').addEventListener('click', () => {
        $('#exportModal').classList.add('active');
    });

    // Sidebar tabs

    $$('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {

            $$('.sidebar-tab').forEach(t => t.classList.remove('active'));

            $$('.sidebar-view').forEach(v => v.classList.remove('active'));

            tab.classList.add('active');
            $(`#${tab.dataset.view}View`).classList.add('active');
        });
    });

    // Search
    $('#searchChats').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        $$('.chat-item').forEach(item => {
            const name = item.querySelector('.chat-name').textContent.toLowerCase();
            item.style.display = name.includes(query) ? 'flex' : 'none';
        });
    });

    // File attach
    $('#attachBtn').addEventListener('click', () => {
        $('#fileInput').click();
    });

    $('#fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showToast(`Datei "${file.name}" wird hochgeladen...`, 'info');
            // TODO: Implement file upload
        }
    });

    // Voice input
    $('#voiceBtn').addEventListener('click', toggleVoiceInput);

    // Modal close

    $$('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Export options
    $('#exportPDF').addEventListener('click', exportAsPDF);
    $('#exportMD').addEventListener('click', exportAsMarkdown);
    $('#exportJSON').addEventListener('click', exportAsJSON);
};

// ============ VOICE INPUT ============
const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
        showToast('Spracheingabe nicht unterstützt', 'error');
        return;
    }

    if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'de-DE';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            $('#input').value = transcript;
            showToast('Sprache erkannt', 'success');
        };

        recognition.onerror = () => {
            showToast('Fehler bei Spracherkennung', 'error');
            $('#voiceBtn').classList.remove('active');
        };

        recognition.onend = () => {
            $('#voiceBtn').classList.remove('active');
        };
    }

    if (isRecording) {
        recognition.stop();
        isRecording = false;
        $('#voiceBtn').classList.remove('active');
    } else {
        recognition.start();
        isRecording = true;
        $('#voiceBtn').classList.add('active');
        showToast('Sprechen Sie jetzt...', 'info');
    }
};

// ============ EXPORT ============
const exportAsPDF = () => {
    showToast('PDF-Export wird vorbereitet...', 'info');
    // Simplified - real implementation would use jsPDF properly
    const chat = chats[activeChat];
    const text = chat.messages.map(m => `${m.sender}: ${m.text}`).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `${chat.name}.txt`);
    $('#exportModal').classList.remove('active');
};

const exportAsMarkdown = () => {
    const chat = chats[activeChat];
    let md = `# ${chat.name}\n\n`;

    chat.messages.forEach(msg => {
        md += `**${msg.sender === 'user' ? 'User' : 'AI'}:** ${msg.text}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `${chat.name}.md`);
    showToast('Als Markdown exportiert', 'success');
    $('#exportModal').classList.remove('active');
};

const exportAsJSON = () => {
    const chat = chats[activeChat];
    const json = JSON.stringify(chat, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `${chat.name}.json`);
    showToast('Als JSON exportiert', 'success');
    $('#exportModal').classList.remove('active');
};

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// ============ COMMAND PALETTE ============
const initCommandPalette = () => {
    const palette = $('#commandPalette');
    const input = $('#commandInput');

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            palette.classList.toggle('active');
            if (palette.classList.contains('active')) {
                input.focus();
            }
        }

        if (e.key === 'Escape') {
            palette.classList.remove('active');
        }
    });

    const commands = [
        { name: 'Neuer Chat', icon: 'fa-plus', action: createNewChat },
        { name: 'Theme wechseln', icon: 'fa-moon', action: () => $('#themeToggle').click() },
        { name: 'Exportieren', icon: 'fa-download', action: () => $('#exportBtn').click() },
        { name: 'Abmelden', icon: 'fa-sign-out-alt', action: () => $('#logoutBtn').click() }
    ];

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        const results = $('#commandResults');
        results.innerHTML = '';

        commands
            .filter(cmd => cmd.name.toLowerCase().includes(query))
            .forEach(cmd => {
                const div = document.createElement('div');
                div.className = 'command-item';
                div.innerHTML = `<i class="fas ${cmd.icon}"></i> ${cmd.name}`;
                div.addEventListener('click', () => {
                    cmd.action();
                    palette.classList.remove('active');
                });
                results.appendChild(div);
            });
    });
};

// ============ THEME ============
const initTheme = () => {
    const theme = loadFromStorage(STORAGE_KEYS.theme, 'dark');
    if (theme === 'light') {
        document.body.classList.add('light');
        $('#themeToggle i').className = 'fas fa-sun';
    }
};

// ============ STARFIELD ============
const initStarfield = () => {
    const canvas = $('#starfield');
    const ctx = canvas.getContext('2d');

    let w, h;
    const resize = () => {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const STAR_COUNT = 400;
    const stars = [];

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            z: Math.random() * w,
            o: Math.random()
        });
    }

    const animate = () => {
        ctx.fillStyle = document.body.classList.contains('light')
            ? 'rgba(245, 247, 250, 0.1)'
            : 'rgba(10, 14, 26, 0.1)';
        ctx.fillRect(0, 0, w, h);

        for (const s of stars) {
            s.z -= 1;
            if (s.z <= 0) {
                s.x = Math.random() * w;
                s.y = Math.random() * h;
                s.z = w;
            }

            const k = 128 / s.z;
            const px = (s.x - w / 2) * k + w / 2;
            const py = (s.y - h / 2) * k + h / 2;

            if (px >= 0 && px <= w && py >= 0 && py <= h) {
                const size = (1 - s.z / w) * 2;
                ctx.fillStyle = `rgba(122, 252, 255, ${s.o})`;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        requestAnimationFrame(animate);
    };

    animate();
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

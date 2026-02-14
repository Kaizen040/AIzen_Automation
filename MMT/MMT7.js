/* MMT7.js – stable, defensive version */
(() => {
    'use strict';

    // ============ CONFIG ============
    const CONFIG = {
        webhookUrl: "https://n8n.srv1220381.hstgr.cloud/webhook/a6cc63aa-d05f-43f5-aaf8-5dede32919a2",
        fileWebhookUrl: "https://n8n.srv1220381.hstgr.cloud/webhook/cd704034-367b-440b-8f01-fe196f8251ff",
        maxFileSize: 20 * 1024 * 1024, // 20MB
        allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'doc', 'txt', 'md']
    };

    const STORAGE_KEYS = {
        authToken: 'mmt_auth_token',
        currentUser: 'mmt_current_user', // speichert das User-Objekt
        chats: 'mmt_chats',
        files: 'mmt_files',
        theme: 'mmt_theme',
        sidebarWidth: 'mmt_sidebar_width',
        draft: 'mmt_draft',
        // alt: Migration
        usersOld: 'mmt_users',
        usersNew: 'mmt_users_local'
    };

    // ============ STATE ============
    let currentUser = null;
    let chats = {};
    let uploadedFiles = [];
    let activeChat = null;
    let isRecording = false;
    let recognition = null;
    let fileQueue = [];
    let uploadXHR = null;

    // Spark animation
    let sparks = [];
    const sparkEmitter = { x: 0, setPosition(p) { this.x = p; } };

    // ============ UTILITIES ============
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const on = (selector, event, handler, opts) => {
        const el = $(selector);
        if (el) el.addEventListener(event, handler, opts);
        return !!el;
    };

    const uuid = () => {
        try {
            if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        } catch (_) {}
        // Fallback (RFC4122 v4-like)
        const rnd = (n = 16) => {
            if (window.crypto?.getRandomValues) {
                const a = new Uint8Array(n);
                window.crypto.getRandomValues(a);
                return Array.from(a, b => b);
            }
            return Array.from({ length: n }, () => Math.floor(Math.random() * 256));
        };
        const bytes = rnd(16);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
        const hex = bytes.map(b => b.toString(16).padStart(2, '0'));
        return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex.slice(10).join('')}`;
    };

    const showNotification = (title, message, type = 'info') => {
        const container = $('#notificationContainer');
        if (!container) return alert(`${title}\n\n${message}`);
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        notification.innerHTML = `
            <i class="fas ${icons[type] || icons.info} notification-icon"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" title="Schließen">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        const btn = notification.querySelector('.notification-close');
        if (btn) {
            btn.addEventListener('click', () => {
                notification.style.animation = 'notificationSlideIn 0.25s ease reverse';
                setTimeout(() => notification.remove(), 220);
            });
        }
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'notificationSlideIn 0.25s ease reverse';
                setTimeout(() => notification.remove(), 220);
            }
        }, 5000);
    };

    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('localStorage save failed:', e);
        }
    };

    const loadFromStorage = (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('localStorage load failed:', e);
            return defaultValue;
        }
    };

    const hashPassword = async (password) => {
        try {
            if (window.crypto?.subtle) {
                const msgBuffer = new TextEncoder().encode(password);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (_) { /* ignore */ }
        // Fallback (nicht kryptographisch – nur als Notnagel für Dev-Umgebungen)
        let h = 0;
        for (let i = 0; i < password.length; i++) {
            h = ((h << 5) - h) + password.charCodeAt(i);
            h |= 0;
        }
        return `insecure_${h}`;
    };

    const formatFileSize = (bytes) => {
        if (!Number.isFinite(bytes)) return '—';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        if (isNaN(date)) return '—';
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Gerade eben';
        if (minutes < 60) return `vor ${minutes}m`;
        if (hours < 24) return `vor ${hours}h`;
        if (days < 7) return `vor ${days}d`;
        return date.toLocaleDateString('de-DE');
    };

    const autoResizeTextarea = () => {
        const input = $('#input');
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    };

    // ============ AUTH ============
    const migrateUsersIfNeeded = () => {
        const oldUsers = loadFromStorage(STORAGE_KEYS.usersOld, null);
        const newUsers = loadFromStorage(STORAGE_KEYS.usersNew, null);
        if (oldUsers && !newUsers) {
            saveToStorage(STORAGE_KEYS.usersNew, oldUsers);
            console.info('Users migrated from mmt_users -> mmt_users_local');
        }
    };

    const initAuth = () => {
        migrateUsersIfNeeded();

        const authModal = $('#authModal');
        const loginBtn = $('#loginBtn');
        const registerBtn = $('#registerBtn');

        // Tabs
        $$('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                $$('.auth-form').forEach(f => f.classList.remove('active'));
                const form = document.getElementById(`${tab.dataset.tab}Form`);
                if (form) form.classList.add('active');
            });
        });

        // Login
        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                const email = $('#loginEmail')?.value.trim();
                const password = $('#loginPassword')?.value || '';

                if (!email || !password) {
                    showNotification('Fehler', 'Bitte alle Felder ausfüllen', 'error');
                    return;
                }

                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird angemeldet...';

                try {
                    const hashed = await hashPassword(password);
                    const users = loadFromStorage(STORAGE_KEYS.usersNew, {});
                    if (users[email] && users[email].password === hashed) {
                        currentUser = users[email];
                        saveToStorage(STORAGE_KEYS.currentUser, currentUser);
                        saveToStorage(STORAGE_KEYS.authToken, uuid());
                        if (authModal) authModal.classList.remove('active');
                        initApp();
                        showNotification('Willkommen!', `Schön dich zu sehen, ${currentUser.name}!`, 'success');
                    } else {
                        showNotification('Fehler', 'Ungültige Anmeldedaten', 'error');
                    }
                } catch (e) {
                    console.error(e);
                    showNotification('Fehler', 'Anmeldung fehlgeschlagen', 'error');
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Anmelden';
                }
            });
        }

        // Register
        if (registerBtn) {
            registerBtn.addEventListener('click', async () => {
                const name = $('#regName')?.value.trim();
                const email = $('#regEmail')?.value.trim();
                const password = $('#regPassword')?.value || '';

                if (!name || !email || !password) {
                    showNotification('Fehler', 'Bitte alle Felder ausfüllen', 'error');
                    return;
                }
                if (password.length < 8) {
                    showNotification('Fehler', 'Passwort muss mindestens 8 Zeichen haben', 'error');
                    return;
                }

                registerBtn.disabled = true;
                registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird erstellt...';

                try {
                    const users = loadFromStorage(STORAGE_KEYS.usersNew, {});
                    if (users[email]) {
                        showNotification('Fehler', 'E-Mail bereits registriert', 'error');
                        return;
                    }
                    const hashed = await hashPassword(password);
                    users[email] = {
                        name,
                        email,
                        password: hashed,
                        createdAt: new Date().toISOString()
                    };
                    saveToStorage(STORAGE_KEYS.usersNew, users);

                    currentUser = users[email];
                    saveToStorage(STORAGE_KEYS.currentUser, currentUser);
                    saveToStorage(STORAGE_KEYS.authToken, uuid());

                    if (authModal) authModal.classList.remove('active');
                    initApp();
                    showNotification('Erfolg!', 'Account erfolgreich erstellt!', 'success');
                } catch (e) {
                    console.error(e);
                    showNotification('Fehler', 'Registrierung fehlgeschlagen', 'error');
                } finally {
                    registerBtn.disabled = false;
                    registerBtn.innerHTML = '<i class="fas fa-rocket"></i> Account erstellen';
                }
            });
        }

        // Enter support
        on('#loginPassword', 'keydown', (e) => { if (e.key === 'Enter') $('#loginBtn')?.click(); });
        on('#regPassword', 'keydown', (e) => { if (e.key === 'Enter') $('#registerBtn')?.click(); });

        // Auto-login
        const savedUserObj = loadFromStorage(STORAGE_KEYS.currentUser, null);
        const authToken = loadFromStorage(STORAGE_KEYS.authToken, null);
        if (savedUserObj && authToken) {
            currentUser = savedUserObj;
            if (authModal) authModal.classList.remove('active');
            initApp();
        }
    };

    // ============ APP INIT ============
    const initApp = () => {
        if (!currentUser) return;

        // User anzeigen
        const nameEl = $('#userName');
        const avatarEl = $('#userAvatar');
        if (nameEl) nameEl.textContent = currentUser.name || 'User';
        if (avatarEl) {
            const initials = (currentUser.name || '')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2) || 'U';
            avatarEl.textContent = initials;
        }

        // Daten laden
        const chatsKey = `${STORAGE_KEYS.chats}_${currentUser.email}`;
        chats = loadFromStorage(chatsKey, {});
        const filesKey = `${STORAGE_KEYS.files}_${currentUser.email}`;
        uploadedFiles = loadFromStorage(filesKey, []);

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
        initResizableSidebar();
        initFilePanel();
        updateStats();
        renderUploadedFiles();
        updateFileBadge();

        // Restore Draft
        const draft = loadFromStorage(`${STORAGE_KEYS.draft}_${activeChat}`, '');
        const input = $('#input');
        if (input) {
            input.value = draft;
            autoResizeTextarea();
            const sendBtn = $('#send');
            if (sendBtn) sendBtn.disabled = !input.value.trim();
        }
    };

    const persistChats = () => {
        if (!currentUser) return;
        const chatsKey = `${STORAGE_KEYS.chats}_${currentUser.email}`;
        saveToStorage(chatsKey, chats);
        updateStats();
        renderSidebar();
    };

    // ============ CHAT MANAGEMENT ============
    const createNewChat = () => {
        const id = uuid();
        const chatNumber = Object.keys(chats).length + 1;
        chats[id] = {
            id,
            name: `Chat ${chatNumber}`,
            messages: [],
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        activeChat = id;
        persistChats();
        renderMessages();
        showNotification('Neuer Chat', 'Chat wurde erfolgreich erstellt', 'success');
        $('#input')?.focus();
    };

    const deleteChat = (id) => {
        if (!chats[id]) return;
        const chatName = chats[id].name;
        delete chats[id];
        if (activeChat === id) {
            const ids = Object.keys(chats);
            activeChat = ids.length ? ids[0] : null;
            if (!activeChat) createNewChat();
        }
        persistChats();
        renderMessages();
        showNotification('Chat gelöscht', `"${chatName}" wurde gelöscht`, 'info');
    };

    const toggleFavorite = (id) => {
        if (!chats[id]) return;
        chats[id].favorite = !chats[id].favorite;
        chats[id].updatedAt = new Date().toISOString();
        persistChats();

        const favBtn = $('#favoriteBtn i');
        if (id === activeChat && favBtn) {
            favBtn.className = chats[id].favorite ? 'fas fa-star' : 'far fa-star';
        }
        showNotification(
            chats[id].favorite ? 'Favorit hinzugefügt' : 'Favorit entfernt',
            chats[id].favorite ? `"${chats[id].name}" zu Favoriten hinzugefügt` : `"${chats[id].name}" aus Favoriten entfernt`,
            'success'
        );
    };

    const switchChat = (id) => {
        if (!chats[id]) return;

        // Draft sichern
        const input = $('#input');
        if (activeChat && input) {
            const draft = input.value.trim();
            if (draft) {
                saveToStorage(`${STORAGE_KEYS.draft}_${activeChat}`, draft);
            } else {
                localStorage.removeItem(`${STORAGE_KEYS.draft}_${activeChat}`);
            }
        }

        activeChat = id;
        renderSidebar();
        renderMessages();

        // Draft laden
        const newDraft = loadFromStorage(`${STORAGE_KEYS.draft}_${activeChat}`, '');
        if (input) {
            input.value = newDraft;
            autoResizeTextarea();
            input.focus();
            const sendBtn = $('#send');
            if (sendBtn) sendBtn.disabled = !input.value.trim();
        }
    };

    const renameChat = (id) => {
        if (!chats[id]) return;
        const newName = prompt('Neuer Chat-Name:', chats[id].name);
        if (newName && newName.trim() && newName !== chats[id].name) {
            const oldName = chats[id].name;
            chats[id].name = newName.trim();
            chats[id].updatedAt = new Date().toISOString();
            persistChats();
            updateChatHeader();
            showNotification('Chat umbenannt', `"${oldName}" wurde zu "${newName.trim()}" umbenannt`, 'success');
        }
    };

    // ============ RENDERING ============
    const renderSidebar = () => {
        const chatList = $('#chatList');
        const favoritesList = $('#favoritesList');
        if (!chatList || !favoritesList) return;

        chatList.innerHTML = '';
        favoritesList.innerHTML = '';

        const sorted = Object.values(chats).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        sorted.forEach(chat => {
            const node = createChatItem(chat);
            chatList.appendChild(node);

            if (chat.favorite) {
                favoritesList.appendChild(createChatItem(chat));
            }
        });

        const allCount = $('#allChatsCount');
        const favCount = $('#favChatsCount');
        if (allCount) allCount.textContent = sorted.length;
        if (favCount) favCount.textContent = sorted.filter(c => c.favorite).length;

        updateChatHeader();
    };

    const createChatItem = (chat) => {
        const div = document.createElement('div');
        div.className = `chat-item ${chat.id === activeChat ? 'active' : ''}`;
        div.dataset.chatId = chat.id;

        const lastMsg = chat.messages[chat.messages.length - 1];
        const preview = lastMsg ? (lastMsg.text ?? '').substring(0, 60).replace(/\n/g, ' ') + '…' : 'Keine Nachrichten';

        div.innerHTML = `
            <div class="chat-item-content">
                <span class="chat-name" title="Doppelklick zum Umbenennen">
                    ${chat.favorite ? '⭐ ' : ''}${chat.name}
                </span>
                <span class="chat-preview">${preview}</span>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn chat-fav-btn" title="Favorit">
                    <i class="fa${chat.favorite ? 's' : 'r'} fa-star"></i>
                </button>
                <button class="chat-action-btn chat-delete-btn" title="Löschen">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Events
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-action-btn')) {
                switchChat(chat.id);
            }
        });
        const nameEl = div.querySelector('.chat-name');
        nameEl?.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            renameChat(chat.id);
        });
        const favBtn = div.querySelector('.chat-fav-btn');
        favBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(chat.id);
        });
        const delBtn = div.querySelector('.chat-delete-btn');
        delBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });

        return div;
    };

    const renderMessages = () => {
        const messagesDiv = $('#messages');
        if (!messagesDiv) return;

        const welcomeScreen = $('#welcomeScreen');

        if (!activeChat || !chats[activeChat] || chats[activeChat].messages.length === 0) {
            messagesDiv.innerHTML = '';
            if (welcomeScreen) {
                const clone = welcomeScreen.cloneNode(true);
                clone.style.display = 'flex';
                messagesDiv.appendChild(clone);
                clone.querySelectorAll('.quick-action').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const input = $('#input');
                        if (!input) return;
                        input.value = (btn.dataset.prompt || '') + ' ';
                        input.focus();
                        autoResizeTextarea();
                        const sendBtn = $('#send');
                        if (sendBtn) sendBtn.disabled = !input.value.trim();
                    });
                });
            }
            return;
        }

        messagesDiv.innerHTML = '';
        chats[activeChat].messages.forEach((msg, idx) => {
            addMessageToDOM(msg.text, msg.sender, idx);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        updateChatHeader();
    };

    const addMessageToDOM = (text, sender, idx = null) => {
        const messagesDiv = $('#messages');
        if (!messagesDiv) return;
        const welcome = messagesDiv.querySelector('.welcome-screen');
        if (welcome) welcome.remove();

        const el = document.createElement('div');
        el.className = `message ${sender}`;
        if (idx !== null) el.dataset.messageIdx = idx;

        if (sender === 'ai') {
            try {
                if (window.marked) {
                    el.innerHTML = window.marked.parse(text || '');
                } else {
                    el.textContent = text || '';
                }
                // Code Highlight
                el.querySelectorAll('pre code').forEach(block => {
                    if (window.hljs?.highlightElement) {
                        window.hljs.highlightElement(block);
                    }
                });
                // MathJax
                if (window.MathJax?.typesetPromise) {
                    window.MathJax.typesetPromise([el]).catch(err => console.warn('MathJax error', err));
                }
            } catch {
                el.textContent = text || '';
            }
        } else {
            el.textContent = text || '';
        }

        // Actions
        const actions = document.createElement('div');
        actions.className = 'message-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Kopieren';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard?.writeText(text || '');
            showNotification('Kopiert', 'Nachricht in Zwischenablage kopiert', 'success');
        });
        actions.appendChild(copyBtn);

        if (sender === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Bearbeiten';
            editBtn.addEventListener('click', () => editMessage(idx));
            actions.appendChild(editBtn);
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'message-action-btn';
        delBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        delBtn.addEventListener('click', () => deleteMessage(idx));
        actions.appendChild(delBtn);

        el.appendChild(actions);
        messagesDiv.appendChild(el);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        return el;
    };

    const addMessage = (text, sender) => {
        if (!activeChat) createNewChat();
        if (!chats[activeChat]) return;
        chats[activeChat].messages.push({
            text: text || '',
            sender,
            timestamp: new Date().toISOString()
        });
        chats[activeChat].updatedAt = new Date().toISOString();
        persistChats();

        const idx = chats[activeChat].messages.length - 1;
        addMessageToDOM(text, sender, idx);
    };

    const showTypingIndicator = () => {
        const messagesDiv = $('#messages');
        if (!messagesDiv) return;
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
    const copyMessage = (idx) => {
        const msg = chats[activeChat]?.messages[idx];
        if (!msg) return;
        navigator.clipboard?.writeText(msg.text || '');
        showNotification('Kopiert', 'Nachricht in Zwischenablage kopiert', 'success');
    };

    const editMessage = (idx) => {
        const msg = chats[activeChat]?.messages[idx];
        if (!msg || msg.sender !== 'user') return;
        const newText = prompt('Nachricht bearbeiten:', msg.text || '');
        if (newText && newText.trim() && newText !== msg.text) {
            chats[activeChat].messages[idx].text = newText.trim();
            chats[activeChat].updatedAt = new Date().toISOString();
            persistChats();
            renderMessages();
            showNotification('Bearbeitet', 'Nachricht wurde aktualisiert', 'success');
        }
    };

    const deleteMessage = (idx) => {
        if (!chats[activeChat]) return;
        chats[activeChat].messages.splice(idx, 1);
        chats[activeChat].updatedAt = new Date().toISOString();
        persistChats();
        renderMessages();
        showNotification('Gelöscht', 'Nachricht wurde entfernt', 'info');
    };

    // ============ CHAT HEADER ============
    const updateChatHeader = () => {
        if (!activeChat || !chats[activeChat]) return;
        const chat = chats[activeChat];
        const title = $('#activeChatName');
        const count = $('#messageCount');
        const ts = $('#chatTimestamp');
        const favBtnIcon = $('#favoriteBtn i');

        if (title) title.textContent = chat.name;
        if (count) count.textContent = `${chat.messages.length} ${chat.messages.length === 1 ? 'Nachricht' : 'Nachrichten'}`;
        if (ts) ts.textContent = formatTimestamp(chat.updatedAt);
        if (favBtnIcon) favBtnIcon.className = chat.favorite ? 'fas fa-star' : 'far fa-star';
    };

    // ============ STATS ============
    const updateStats = () => {
        const totalMsgs = Object.values(chats).reduce((sum, c) => sum + c.messages.length, 0);
        const totalC = Object.keys(chats).length;

        const lastActivity = Object.values(chats).reduce((latest, c) => {
            const d = new Date(c.updatedAt);
            return d > latest ? d : latest;
        }, new Date(0));
        const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
        const streak = daysSinceActivity <= 1 ? Math.floor(Math.random() * 30) + 1 : 0;

        const tMsgs = $('#totalMessages');
        const tChats = $('#totalChats');
        const sDays = $('#streakDays');

        if (tMsgs) tMsgs.textContent = totalMsgs;
        if (tChats) tChats.textContent = totalC;
        if (sDays) sDays.textContent = streak;
    };

    // ============ SEND MESSAGE ============
    const sendMessage = async () => {
        const input = $('#input');
        const sendBtn = $('#send');
        if (!input || !sendBtn) return;

        const text = input.value.trim();
        if (!text || !activeChat) return;

        sendBtn.disabled = true;
        addMessage(text, 'user');
        input.value = '';
        input.style.height = 'auto';
        localStorage.removeItem(`${STORAGE_KEYS.draft}_${activeChat}`);

        showTypingIndicator();

        try {
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    sessionId: activeChat,
                    action: 'sendMessage',
                    chatInput: text,
                    userId: currentUser.email,
                    files: uploadedFiles.map(f => f.name)
                }])
            });

            let data = null;
            try { data = await response.json(); } catch { data = null; }
            removeTypingIndicator();

            const aiResponse = data?.[0]?.output || 'Keine Antwort erhalten.';
            addMessage(aiResponse, 'ai');

        } catch (error) {
            console.error('Send error:', error);
            removeTypingIndicator();
            addMessage('⚠️ Serverfehler. Bitte versuche es erneut.', 'ai');
            showNotification('Fehler', 'Verbindung zum Server fehlgeschlagen', 'error');
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    };

    // ============ EVENT LISTENERS ============
    const initEventListeners = () => {
        const input = $('#input');
        const sendBtn = $('#send');

        // Senden
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);

        if (input) {
            input.addEventListener('keydown', (e) => {
                // Strg/Cmd + Enter zum Senden
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            // Auto-resize + Draft
            input.addEventListener('input', () => {
                autoResizeTextarea();
                if (sendBtn) sendBtn.disabled = !input.value.trim();

                if (activeChat) {
                    const draft = input.value.trim();
                    if (draft) saveToStorage(`${STORAGE_KEYS.draft}_${activeChat}`, draft);
                    else localStorage.removeItem(`${STORAGE_KEYS.draft}_${activeChat}`);
                }
            });
        }

        on('#newChat', 'click', createNewChat);

        on('#logoutBtn', 'click', () => {
            localStorage.removeItem(STORAGE_KEYS.authToken);
            localStorage.removeItem(STORAGE_KEYS.currentUser);
            location.reload();
        });

        // Theme toggle (beide Buttons)
        const toggleTheme = () => {
            document.body.classList.toggle('light');
            const isDark = !document.body.classList.contains('light');
            $$('#themeToggle i, #navThemeToggle i').forEach(icon => {
                icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            });
            saveToStorage(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
        };
        on('#themeToggle', 'click', toggleTheme);
        on('#navThemeToggle', 'click', toggleTheme);

        // Favorit
        on('#favoriteBtn', 'click', () => { if (activeChat) toggleFavorite(activeChat); });

        // Export
        on('#exportBtn', 'click', () => { $('#exportModal')?.classList.add('active'); });

        // Shortcuts Modal
        on('#shortcutsBtn', 'click', () => { $('#shortcutsModal')?.classList.add('active'); });

        // Sidebar Tabs
        $$('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.sidebar-tab').forEach(t => t.classList.remove('active'));
                $$('.sidebar-view').forEach(v => v.classList.remove('active'));
                tab.classList.add('active');
                const view = document.getElementById(`${tab.dataset.view}View`);
                view?.classList.add('active');
            });
        });

        // Search
        const searchInput = $('#searchChats');
        const searchClear = $('#searchClear');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = (e.target.value || '').toLowerCase();
                if (searchClear) searchClear.style.display = query ? 'flex' : 'none';
                $$('.chat-item').forEach(item => {
                    const name = item.querySelector('.chat-name')?.textContent.toLowerCase() || '';
                    const preview = item.querySelector('.chat-preview')?.textContent.toLowerCase() || '';
                    item.style.display = (name.includes(query) || preview.includes(query)) ? 'flex' : 'none';
                });
            });
        }
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                searchClear.style.display = 'none';
                $$('.chat-item').forEach(item => item.style.display = 'flex');
            });
        }

        // Tools
        on('#voiceBtn', 'click', toggleVoiceInput);
        on('#clearBtn', 'click', () => {
            if (!input) return;
            if (input.value.trim()) {
                input.value = '';
                autoResizeTextarea();
                if (sendBtn) sendBtn.disabled = true;
                if (activeChat) localStorage.removeItem(`${STORAGE_KEYS.draft}_${activeChat}`);
                showNotification('Gelöscht', 'Eingabe wurde geleert', 'info');
            }
        });
        on('#codeBtn', 'click', () => {
            if (!input) return;
            const cursor = input.selectionStart || 0;
            const text = input.value || '';
            const before = text.substring(0, cursor);
            const after = text.substring(cursor);
            input.value = before + '\n```\n\n```\n' + after;
            input.selectionStart = input.selectionEnd = cursor + 5;
            input.focus();
            autoResizeTextarea();
        });

        // Modal close (X)
        $$('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                if (modalId) document.getElementById(modalId)?.classList.remove('active');
                else btn.closest('.modal')?.classList.remove('active');
            });
        });
        // Modal outside click
        $$('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal && modal.id !== 'authModal') {
                    modal.classList.remove('active');
                }
            });
        });

        // Export Optionen
        on('#exportMD', 'click', exportAsMarkdown);
        on('#exportJSON', 'click', exportAsJSON);
        on('#exportTXT', 'click', exportAsText);

        // Sidebar Toggle (mobile)
        on('#sidebarToggle', 'click', () => { $('#sidebar')?.classList.toggle('active'); });

        // Files Panel öffnen
        on('#filesBtn', 'click', () => { $('#filePanel')?.classList.add('active'); });
        on('#uploadFilesBtn', 'click', () => { $('#filePanel')?.classList.add('active'); });

        // Shortcuts (global)
        initKeyboardShortcuts();
    };

    const initKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Eingabe-Fokus?
            const tag = (e.target?.tagName || '').toUpperCase();
            const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

            // Ctrl/Cmd+Enter handled in textarea selbst
            if (inInput && !(e.ctrlKey || e.metaKey)) return;

            // Strg/Cmd + K: Command Palette
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const m = $('#commandPalette');
                if (!m) return;
                m.classList.toggle('active');
                if (m.classList.contains('active')) $('#commandInput')?.focus();
            }

            // Strg/Cmd + N: New Chat
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                createNewChat();
            }

            // Strg/Cmd + M: Voice Input
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                toggleVoiceInput();
            }

            // Strg/Cmd + L: Clear Input
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                const input = $('#input');
                if (input) {
                    input.value = '';
                    autoResizeTextarea();
                }
            }

            // Strg/Cmd + B: Toggle Sidebar
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                $('#sidebar')?.classList.toggle('minimized');
            }

            // Strg/Cmd + F: Focus Search
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                $('#searchChats')?.focus();
            }

            // Strg/Cmd + /: Shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                $('#shortcutsModal')?.classList.add('active');
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                $$('.modal.active').forEach(m => {
                    if (m.id !== 'authModal') m.classList.remove('active');
                });
                $('#filePanel')?.classList.remove('active');
            }
        });
    };

    // ============ VOICE INPUT ============
    const toggleVoiceInput = () => {
        const voiceBtn = $('#voiceBtn');
        const unsupported = () => {
            showNotification('Nicht unterstützt', 'Spracheingabe wird von deinem Browser nicht unterstützt', 'error');
        };

        if (!('webkitSpeechRecognition' in window)) return unsupported();

        if (!recognition) {
            try {
                recognition = new webkitSpeechRecognition();
                recognition.continuous = false;
                recognition.lang = 'de-DE';
                recognition.interimResults = false;

                recognition.onresult = (event) => {
                    const transcript = event.results?.[0]?.[0]?.transcript || '';
                    const input = $('#input');
                    if (input) {
                        input.value += (input.value ? ' ' : '') + transcript;
                        autoResizeTextarea();
                        const sendBtn = $('#send');
                        if (sendBtn) sendBtn.disabled = !input.value.trim();
                    }
                    showNotification('Sprache erkannt', transcript || '—', 'success');
                };
                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    showNotification('Fehler', 'Fehler bei Spracherkennung', 'error');
                    voiceBtn?.classList.remove('active');
                    isRecording = false;
                };
                recognition.onend = () => {
                    voiceBtn?.classList.remove('active');
                    isRecording = false;
                };
            } catch {
                return unsupported();
            }
        }

        if (isRecording) {
            recognition.stop();
            voiceBtn?.classList.remove('active');
            isRecording = false;
        } else {
            recognition.start();
            voiceBtn?.classList.add('active');
            isRecording = true;
            showNotification('Aufnahme läuft', 'Spreche jetzt...', 'info');
        }
    };

    // ============ FILE MANAGEMENT ============
    const initFilePanel = () => {
        const filePanel = $('#filePanel');
        const uploadZone = $('#fileUploadZone');
        const fileInput = $('#fileInput');
        const selectFilesBtn = $('#selectFilesBtn');

        on('#closeFilePanel', 'click', () => { filePanel?.classList.remove('active'); });
        if (selectFilesBtn && fileInput) {
            selectFilesBtn.addEventListener('click', () => fileInput.click());
        }
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', (e) => {
                if (e.target === uploadZone || e.target.closest('.upload-zone-content')) fileInput.click();
            });
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });
            uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                const dropped = Array.from(e.dataTransfer?.files || []);
                addFilesToQueue(dropped);
            });
        }
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const selected = Array.from(e.target.files || []);
                addFilesToQueue(selected);
                fileInput.value = '';
            });
        }

        on('#clearAllFiles', 'click', () => {
            if (uploadedFiles.length === 0) return;
            uploadedFiles = [];
            saveUploadedFiles();
            renderUploadedFiles();
            updateFileBadge();
            showNotification('Gelöscht', 'Alle Dateien wurden gelöscht', 'info');
        });

        initSparkCanvas();
    };

    const addFilesToQueue = (fileList) => {
        if (!fileList?.length) return;
        for (const file of fileList) {
            if (file.size > CONFIG.maxFileSize) {
                showNotification('Fehler', `"${file.name}" ist zu groß (max. ${formatFileSize(CONFIG.maxFileSize)})`, 'error');
                continue;
            }
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            if (!CONFIG.allowedFileTypes.includes(ext)) {
                showNotification('Fehler', `Dateityp ".${ext}" wird nicht unterstützt`, 'error');
                continue;
            }
            fileQueue.push(file);
        }
        renderFileQueue();
        if (!uploadXHR) uploadNextFile();
    };

    const renderFileQueue = () => {
        const container = $('#fileQueue');
        if (!container) return;
        if (fileQueue.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = '';
        fileQueue.forEach((file, idx) => {
            const item = document.createElement('div');
            item.className = 'file-queue-item';
            const name = document.createElement('span');
            name.className = 'file-name';
            name.textContent = file.name;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✖';
            removeBtn.addEventListener('click', () => removeFromQueue(idx));
            item.appendChild(name);
            item.appendChild(removeBtn);
            container.appendChild(item);
        });
    };

    const removeFromQueue = (idx) => {
        fileQueue.splice(idx, 1);
        renderFileQueue();
    };

    const uploadNextFile = () => {
        if (fileQueue.length === 0) {
            const wrap = $('#uploadProgressWrapper');
            if (wrap) wrap.style.display = 'none';
            return;
        }

        const file = fileQueue[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', $('#metaCategory')?.value || '');
        formData.append('project', $('#metaProject')?.value || '');
        formData.append('versioned', $('#metaVersioned')?.checked ? 'true' : 'false');
        formData.append('userId', currentUser?.email || '');

        uploadXHR = new XMLHttpRequest();
        uploadXHR.open('POST', CONFIG.fileWebhookUrl);

        const progressWrapper = $('#uploadProgressWrapper');
        const progressFill = $('#progressBarFill');
        const uploadStatus = $('#uploadStatus');

        if (progressWrapper) progressWrapper.style.display = 'block';
        if (uploadStatus) uploadStatus.textContent = `Lädt ${file.name}...`;

        uploadXHR.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = e.loaded / e.total;
                if (progressFill) progressFill.style.width = (percent * 100) + '%';
                sparkEmitter.setPosition(percent);
            }
        };

        uploadXHR.onload = () => {
            if (uploadXHR.status === 200) {
                uploadedFiles.push({
                    id: uuid(),
                    name: file.name,
                    size: file.size,
                    type: '.' + (file.name.split('.').pop() || '').toLowerCase(),
                    uploadedAt: new Date().toISOString()
                });
                saveUploadedFiles();
                renderUploadedFiles();
                updateFileBadge();
                showNotification('Upload erfolgreich', `"${file.name}" wurde hochgeladen`, 'success');
            } else {
                showNotification('Upload fehlgeschlagen', `"${file.name}" konnte nicht hochgeladen werden`, 'error');
            }
            fileQueue.shift();
            renderFileQueue();
            uploadXHR = null;
            setTimeout(uploadNextFile, 300);
        };

        uploadXHR.onerror = () => {
            showNotification('Fehler', `Upload von "${file.name}" fehlgeschlagen`, 'error');
            fileQueue.shift();
            renderFileQueue();
            uploadXHR = null;
            setTimeout(uploadNextFile, 300);
        };

        try {
            uploadXHR.send(formData);
        } catch (e) {
            console.error('Upload send failed', e);
            uploadXHR.onerror?.();
        }
    };

    const saveUploadedFiles = () => {
        if (!currentUser) return;
        const key = `${STORAGE_KEYS.files}_${currentUser.email}`;
        saveToStorage(key, uploadedFiles);
    };

    const renderUploadedFiles = () => {
        const list = $('#fileItems');
        const count = $('#fileCount');
        if (count) count.textContent = uploadedFiles.length;
        if (!list) return;

        if (uploadedFiles.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Noch keine Dateien hochgeladen</p>
                </div>
            `;
            return;
        }

        list.innerHTML = '';
        const sorted = [...uploadedFiles].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        const iconMap = {
            '.pdf': 'fa-file-pdf',
            '.doc': 'fa-file-word',
            '.docx': 'fa-file-word',
            '.txt': 'fa-file-alt',
            '.md': 'fa-file-alt',
            '.png': 'fa-file-image',
            '.jpg': 'fa-file-image',
            '.jpeg': 'fa-file-image'
        };

        sorted.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-item';
            const icon = iconMap[file.type] || 'fa-file';
            item.innerHTML = `
                <div class="file-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-meta">${formatFileSize(file.size)} • ${formatTimestamp(file.uploadedAt)}</div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn file-delete-btn" title="Löschen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            item.querySelector('.file-delete-btn')?.addEventListener('click', () => deleteUploadedFile(file.id));
            list.appendChild(item);
        });
    };

    const updateFileBadge = () => {
        const badge = $('#fileBadge');
        if (!badge) return;
        badge.textContent = uploadedFiles.length;
        badge.style.display = uploadedFiles.length > 0 ? 'block' : 'none';
    };

    const deleteUploadedFile = (id) => {
        const file = uploadedFiles.find(f => f.id === id);
        uploadedFiles = uploadedFiles.filter(f => f.id !== id);
        saveUploadedFiles();
        renderUploadedFiles();
        updateFileBadge();
        showNotification('Gelöscht', `"${file?.name || 'Datei'}" wurde gelöscht`, 'info');
    };

    // ============ SPARK ANIMATION ============
    const initSparkCanvas = () => {
        const canvas = $('#sparkCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 500;
        canvas.height = 60;

        sparkEmitter.setPosition = (p) => { sparkEmitter.x = p * canvas.width; };

        const spawnSpark = () => {
            sparks.push({
                x: sparkEmitter.x,
                y: 30,
                vx: (Math.random() * 2),
                vy: (Math.random() - 0.5) * 2,
                life: 30
            });
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (uploadXHR) spawnSpark();
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.life--;
                ctx.fillStyle = `rgba(122, 252, 255, ${s.life / 30})`;
                ctx.fillRect(s.x, s.y, 2, 2);
                if (s.life <= 0) sparks.splice(i, 1);
            }
            requestAnimationFrame(animate);
        };
        animate();
    };

    // ============ EXPORT ============
    const exportAsMarkdown = () => {
        const chat = chats[activeChat];
        if (!chat) return;
        let md = `# ${chat.name}\n\n`;
        md += `*Erstellt am ${new Date(chat.createdAt).toLocaleDateString('de-DE')}*\n\n`;
        md += `---\n\n`;
        chat.messages.forEach(msg => {
            const sender = msg.sender === 'user' ? '👤 **Du**' : '🤖 **AI**';
            md += `### ${sender}\n\n${msg.text}\n\n`;
        });
        downloadFile(md, `${chat.name}.md`, 'text/markdown');
        showNotification('Exportiert', 'Chat als Markdown exportiert', 'success');
        $('#exportModal')?.classList.remove('active');
    };

    const exportAsJSON = () => {
        const chat = chats[activeChat];
        if (!chat) return;
        const json = JSON.stringify(chat, null, 2);
        downloadFile(json, `${chat.name}.json`, 'application/json');
        showNotification('Exportiert', 'Chat als JSON exportiert', 'success');
        $('#exportModal')?.classList.remove('active');
    };

    const exportAsText = () => {
        const chat = chats[activeChat];
        if (!chat) return;
        let text = `${chat.name}\n`;
        text += `Erstellt: ${new Date(chat.createdAt).toLocaleString('de-DE')}\n`;
        text += `${'='.repeat(60)}\n\n`;
        chat.messages.forEach(msg => {
            const sender = msg.sender === 'user' ? 'Du' : 'AI';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString('de-DE');
            text += `[${timestamp}] ${sender}:\n${msg.text}\n\n`;
        });
        downloadFile(text, `${chat.name}.txt`, 'text/plain');
        showNotification('Exportiert', 'Chat als Text exportiert', 'success');
        $('#exportModal')?.classList.remove('active');
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    };

    // ============ COMMAND PALETTE ============
    const initCommandPalette = () => {
        const palette = $('#commandPalette');
        const input = $('#commandInput');
        const results = $('#commandResults');
        if (!palette || !input || !results) return;

        const commands = [
            { name: 'Neuer Chat erstellen', icon: 'fa-plus', action: createNewChat, keywords: ['new', 'chat', 'neu'] },
            { name: 'Theme wechseln', icon: 'fa-moon', action: () => $('#themeToggle')?.click(), keywords: ['theme', 'dark', 'light'] },
            { name: 'Chat exportieren', icon: 'fa-download', action: () => $('#exportBtn')?.click(), keywords: ['export', 'download'] },
            { name: 'Dateien verwalten', icon: 'fa-folder-open', action: () => $('#filesBtn')?.click(), keywords: ['files', 'dateien', 'upload'] },
            { name: 'Spracheingabe', icon: 'fa-microphone', action: toggleVoiceInput, keywords: ['voice', 'sprache', 'mikrofon'] },
            { name: 'Statistiken anzeigen', icon: 'fa-chart-pie', action: () => { $$('.sidebar-tab')[2]?.click(); }, keywords: ['stats', 'statistik'] },
            { name: 'Tastenkürzel anzeigen', icon: 'fa-keyboard', action: () => $('#shortcutsBtn')?.click(), keywords: ['shortcuts', 'tastatur', 'hilfe'] },
            { name: 'Abmelden', icon: 'fa-sign-out-alt', action: () => $('#logoutBtn')?.click(), keywords: ['logout', 'abmelden'] }
        ];

        const createItem = (cmd) => {
            const div = document.createElement('div');
            div.className = 'command-item';
            div.innerHTML = `<i class="fas ${cmd.icon}"></i> ${cmd.name}`;
            div.addEventListener('click', () => {
                cmd.action();
                palette.classList.remove('active');
                input.value = '';
            });
            return div;
        };

        const renderList = (list) => {
            results.innerHTML = '';
            if (!list.length) {
                results.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Keine Befehle gefunden</div>';
                return;
            }
            list.forEach(cmd => results.appendChild(createItem(cmd)));
        };

        // initial
        renderList(commands);

        input.addEventListener('input', () => {
            const q = input.value.toLowerCase().trim();
            if (!q) return renderList(commands);
            const filtered = commands.filter(cmd =>
                cmd.name.toLowerCase().includes(q) || cmd.keywords.some(kw => kw.includes(q))
            );
            renderList(filtered);
        });

        input.addEventListener('keydown', (e) => {
            const items = results.querySelectorAll('.command-item');
            const selected = results.querySelector('.command-item.selected');
            let index = Array.from(items).indexOf(selected);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (selected) selected.classList.remove('selected');
                index = (index + 1) % items.length;
                items[index]?.classList.add('selected');
                items[index]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (selected) selected.classList.remove('selected');
                index = index <= 0 ? items.length - 1 : index - 1;
                items[index]?.classList.add('selected');
                items[index]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selected) selected.click();
                else items[0]?.click();
            }
        });
    };

    // ============ RESIZABLE SIDEBAR ============
    const initResizableSidebar = () => {
        const sidebar = $('#sidebar');
        const handle = $('#resizeHandle');
        if (!sidebar || !handle) return;
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const savedWidth = loadFromStorage(STORAGE_KEYS.sidebarWidth, null);
        if (savedWidth) sidebar.style.width = savedWidth + 'px';

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            handle.classList.add('resizing');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const delta = e.clientX - startX;
            let newWidth = startWidth + delta;
            newWidth = Math.max(240, Math.min(500, newWidth));
            sidebar.style.width = newWidth + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                handle.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                saveToStorage(STORAGE_KEYS.sidebarWidth, sidebar.offsetWidth);
            }
        });
    };

    // ============ THEME ============
    const initTheme = () => {
        const theme = loadFromStorage(STORAGE_KEYS.theme, 'dark');
        if (theme === 'light') {
            document.body.classList.add('light');
            $$('#themeToggle i, #navThemeToggle i').forEach(icon => icon.className = 'fas fa-sun');
        } else {
            $$('#themeToggle i, #navThemeToggle i').forEach(icon => icon.className = 'fas fa-moon');
        }
    };

    // ============ STARFIELD ============
    const initStarfield = () => {
        const canvas = $('#starfield');
        if (!canvas) return;
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
            const isLight = document.body.classList.contains('light');
            ctx.fillStyle = isLight ? 'rgba(245, 247, 250, 0.1)' : 'rgba(10, 14, 26, 0.1)';
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
        try {
            initAuth();
        } catch (e) {
            console.error('Init error:', e);
            showNotification('Fehler', 'Die App konnte nicht initialisiert werden. Siehe Konsole.', 'error');
        }
    });
})();

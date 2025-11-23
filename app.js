// Dart League Scoring App
class DartScoreTracker {
    constructor() {
        this.currentInput = '';
        this.currentMatch = 1;
        this.currentGame = 1;
        this.currentDartBox = 3;
        this.dartBoxes = [3, 6, 9, 12, 15, 18, 21];
        this.gameData = {
            1: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
            2: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
            3: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 }
        };
        this.matchComplete = false;
        this.matchHistory = [];
        this.userName = '';
        this.sessionDate = '';
        this.currentUser = null;
        
        // Check if user is logged in
        this.checkAuth();
    }

    async checkAuth() {
        setTimeout(async () => {
            const supabaseReady = initSupabase();
            if (!supabaseReady) {
                alert('Failed to initialize authentication');
                return;
            }
            
            // Check for existing session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                const metadata = session.user.user_metadata || {};
                this.userName = metadata.first_name && metadata.last_name 
                    ? `${metadata.first_name} ${metadata.last_name}`
                    : session.user.email.split('@')[0];
                this.sessionDate = new Date().toISOString().split('T')[0];
                this.sessionId = this.getSessionId();
                await this.initializeApp();
            } else {
                this.showAuthScreen();
            }
        }, 0);
    }

    showAuthScreen() {
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        modal.id = 'authModal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>🎯 Monday Night Darts</h2>
                <p style="color: #9ca3af; margin-bottom: 20px;">Login to track your scores</p>
                <div style="margin-bottom: 15px;">
                    <input type="email" id="authEmail" class="edit-score-input" 
                           placeholder="Email" 
                           style="width: 100%; padding: 12px; font-size: 16px; margin-bottom: 10px;">
                    <input type="password" id="authPassword" class="edit-score-input" 
                           placeholder="Password" 
                           style="width: 100%; padding: 12px; font-size: 16px;">
                </div>
                <button class="finish-btn" id="loginBtn" style="width: 100%; background: #16a34a; margin-bottom: 10px;">
                    Login
                </button>
                <button class="finish-btn" id="signupBtn" style="width: 100%; background: #2563eb;">
                    Create New Account
                </button>
                <button class="finish-btn" id="resendVerificationBtn" style="width: 100%; background: #f59e0b; margin-top: 10px; font-size: 13px;">
                    📧 Resend Verification Email
                </button>
                <div id="authMessage" style="color: #ef4444; margin-top: 10px; font-size: 14px; text-align: center;"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const emailInput = document.getElementById('authEmail');
        const passwordInput = document.getElementById('authPassword');
        const messageDiv = document.getElementById('authMessage');
        
        emailInput.focus();
        
        // Allow Enter key to login
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loginBtn').click();
            }
        };
        
        emailInput.addEventListener('keydown', handleEnter);
        passwordInput.addEventListener('keydown', handleEnter);
        
        document.getElementById('loginBtn').addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!email || !password) {
                messageDiv.textContent = 'Please enter email and password';
                return;
            }
            
            messageDiv.textContent = 'Logging in...';
            messageDiv.style.color = '#9ca3af';
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                messageDiv.textContent = error.message;
                messageDiv.style.color = '#ef4444';
            } else {
                // Check if email is verified
                if (data.user.email_confirmed_at) {
                    this.currentUser = data.user;
                    const metadata = data.user.user_metadata || {};
                    this.userName = metadata.first_name && metadata.last_name 
                        ? `${metadata.first_name} ${metadata.last_name}`
                        : data.user.email.split('@')[0];
                    this.sessionDate = new Date().toISOString().split('T')[0];
                    this.sessionId = this.getSessionId();
                    document.body.removeChild(modal);
                    await this.initializeApp();
                } else {
                    messageDiv.textContent = 'Please verify your email address before logging in. Check your inbox for the verification link.';
                    messageDiv.style.color = '#f59e0b';
                    await supabase.auth.signOut();
                }
            }
        });
        
        document.getElementById('signupBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showSignupForm();
        });
        
        document.getElementById('resendVerificationBtn').addEventListener('click', async () => {
            const email = emailInput.value.trim();
            
            if (!email) {
                messageDiv.textContent = 'Please enter your email address';
                messageDiv.style.color = '#ef4444';
                return;
            }
            
            messageDiv.textContent = 'Sending verification email...';
            messageDiv.style.color = '#9ca3af';
            
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });
            
            if (error) {
                messageDiv.textContent = error.message;
                messageDiv.style.color = '#ef4444';
            } else {
                messageDiv.textContent = '✅ Verification email sent! Check your inbox.';
                messageDiv.style.color = '#16a34a';
            }
        });
    }

    showSignupForm() {
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        modal.id = 'signupModal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>🎯 Create Account</h2>
                <p style="color: #9ca3af; margin-bottom: 20px;">Join Monday Night Darts</p>
                <div style="margin-bottom: 15px;">
                    <input type="text" id="signupFirstName" class="edit-score-input" 
                           placeholder="First Name" 
                           style="width: 100%; padding: 12px; font-size: 16px; margin-bottom: 10px;">
                    <input type="text" id="signupLastName" class="edit-score-input" 
                           placeholder="Last Name" 
                           style="width: 100%; padding: 12px; font-size: 16px; margin-bottom: 10px;">
                    <input type="email" id="signupEmail" class="edit-score-input" 
                           placeholder="Email" 
                           style="width: 100%; padding: 12px; font-size: 16px; margin-bottom: 10px;">
                    <input type="password" id="signupPassword" class="edit-score-input" 
                           placeholder="Password (min 6 characters)" 
                           style="width: 100%; padding: 12px; font-size: 16px;">
                </div>
                <button class="finish-btn" id="createAccountBtn" style="width: 100%; background: #2563eb; margin-bottom: 10px;">
                    Create Account
                </button>
                <button class="finish-btn" id="backToLoginBtn" style="width: 100%; background: #64748b;">
                    Back to Login
                </button>
                <div id="signupMessage" style="color: #ef4444; margin-top: 10px; font-size: 14px; text-align: center;"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const firstNameInput = document.getElementById('signupFirstName');
        const lastNameInput = document.getElementById('signupLastName');
        const emailInput = document.getElementById('signupEmail');
        const passwordInput = document.getElementById('signupPassword');
        const messageDiv = document.getElementById('signupMessage');
        
        firstNameInput.focus();
        
        // Allow Enter key to submit
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('createAccountBtn').click();
            }
        };
        
        firstNameInput.addEventListener('keydown', handleEnter);
        lastNameInput.addEventListener('keydown', handleEnter);
        emailInput.addEventListener('keydown', handleEnter);
        passwordInput.addEventListener('keydown', handleEnter);
        
        document.getElementById('createAccountBtn').addEventListener('click', async () => {
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!firstName || !lastName) {
                messageDiv.textContent = 'Please enter your first and last name';
                messageDiv.style.color = '#ef4444';
                return;
            }
            
            if (!email || !password) {
                messageDiv.textContent = 'Please enter email and password';
                messageDiv.style.color = '#ef4444';
                return;
            }
            
            if (password.length < 6) {
                messageDiv.textContent = 'Password must be at least 6 characters';
                messageDiv.style.color = '#ef4444';
                return;
            }
            
            messageDiv.textContent = 'Creating account...';
            messageDiv.style.color = '#9ca3af';
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName
                    }
                }
            });
            
            if (error) {
                messageDiv.textContent = error.message;
                messageDiv.style.color = '#ef4444';
            } else {
                // Check if email confirmation is required
                const identities = data.user?.identities || [];
                if (identities.length === 0) {
                    // Email confirmation required
                    messageDiv.innerHTML = '✅ Account created!<br>Please check your email to verify your account before logging in.';
                    messageDiv.style.color = '#16a34a';
                    
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        this.showAuthScreen();
                    }, 4000);
                } else {
                    // No email confirmation required (instant login)
                    messageDiv.textContent = 'Account created! Logging you in...';
                    messageDiv.style.color = '#16a34a';
                    
                    setTimeout(async () => {
                        this.currentUser = data.user;
                        this.userName = `${firstName} ${lastName}`;
                        this.sessionDate = new Date().toISOString().split('T')[0];
                        this.sessionId = this.getSessionId();
                        document.body.removeChild(modal);
                        await this.initializeApp();
                    }, 1000);
                }
            }
        });
        
        document.getElementById('backToLoginBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showAuthScreen();
        });
    }

    getSessionId() {
        // Create session ID with user ID and date
        const userId = this.currentUser ? this.currentUser.id : 'guest';
        return `${userId}_${this.sessionDate}`;
    }

    async initializeApp() {
        // Initialize Supabase
        const supabaseReady = initSupabase();
        
        if (supabaseReady) {
            // Load saved data for today only
            await this.loadFromDatabase();
        }
        
        this.init();
        this.updateMatchDisplay();
    }

    init() {
        // Number pad buttons
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.target.textContent.trim();
                if (value === 'Enter') {
                    e.preventDefault();
                    this.enterScore();
                } else if (value === '←') {
                    this.backspace();
                } else if (!isNaN(value) && value !== '') {
                    // Only add if it's a number
                    this.addDigit(value);
                }
            });
        });

        // End Score buttons
        document.querySelectorAll('.end-score, .end-score-btn').forEach(btn => {
            btn.addEventListener('click', () => this.endScore());
        });

        // Undo button
        document.querySelector('.undo-btn').addEventListener('click', () => this.undo());

        // Sit Out button
        document.querySelector('.sit-out').addEventListener('click', () => this.sitOut());

        // Night Done button
        document.querySelector('.night-done').addEventListener('click', () => this.nightDone());
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Clear All Stats button
        const clearAllBtn = document.getElementById('clearAllStatsBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllStats());
        }

        // Highlight current cell
        this.highlightCurrentCell();
    }

    handleKeyboard(e) {
        // Don't handle keyboard if a modal is open
        if (document.querySelector('.finish-modal')) {
            return;
        }
        
        // Prevent default for keys we're handling
        if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
            e.preventDefault();
            this.addDigit(e.key);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.enterScore();
        } else if (e.key === '/' || e.key === 'NumpadDivide') {
            e.preventDefault();
            this.endScore();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            // If there's input, backspace removes a digit
            // If no input, backspace acts as undo
            if (this.currentInput === '') {
                this.undo();
            } else {
                this.backspace();
            }
        }
    }

    addDigit(digit) {
        if (this.matchComplete) return;
        this.currentInput += digit;
        this.updateCurrentCell();
    }

    backspace() {
        this.currentInput = this.currentInput.slice(0, -1);
        this.updateCurrentCell();
    }

    enterScore() {
        if (this.matchComplete || this.currentInput === '') return;

        const score = parseInt(this.currentInput);
        if (isNaN(score)) return;

        // Add score to current dart box
        const cell = document.querySelector(`.dart-cell[data-game="${this.currentGame}"][data-dart="${this.currentDartBox}"]`);
        if (cell) {
            cell.textContent = score;
            cell.classList.add('filled');
            
            // Circle high scores (95+)
            if (score >= 95) {
                cell.classList.add('high-score');
            }
            
            // Store score
            this.gameData[this.currentGame].scores.push({
                dartBox: this.currentDartBox,
                score: score,
                darts: this.currentDartBox
            });

            // Move to next dart box
            this.moveToNextDartBox();
        }

        this.currentInput = '';
        this.saveToDatabase();
    }

    endScore() {
        if (this.matchComplete) return;

        const gameData = this.gameData[this.currentGame];
        
        // Place "/" in next available box
        const cell = document.querySelector(`.dart-cell[data-game="${this.currentGame}"][data-dart="${this.currentDartBox}"]`);
        if (cell) {
            cell.textContent = '/';
            cell.classList.add('filled', 'end-marker');
        }

        // Calculate game totals
        this.calculateGameTotals();

        // Show finish game prompt
        this.showFinishGamePrompt();

        this.currentInput = '';
    }

    showFinishGamePrompt() {
        console.log('showFinishGamePrompt called');
        
        // Create modal for finish options
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>Did you finish the game?</h2>
                <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">Press: <strong>1</strong> = I Finished | <strong>2</strong> = Partner | <strong>3</strong> = Loss | <strong>Enter</strong> = Confirm</p>
                <div class="finish-options">
                    <button class="finish-btn loss" data-result="loss" data-key="3">3️⃣ Game Loss</button>
                    <button class="finish-btn partner" data-result="partner" data-key="2">2️⃣ Partner Finished</button>
                    <button class="finish-btn win selected" data-result="win" data-key="1">1️⃣ I Finished</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Track selected button (default to "I Finished")
        let selectedResult = 'win';
        const buttons = modal.querySelectorAll('.finish-btn');
        
        // Function to update selection
        const updateSelection = (result) => {
            selectedResult = result;
            buttons.forEach(btn => {
                if (btn.dataset.result === result) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        };

        // Function to close modal and cleanup
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', keyHandler, true);
        };

        // Keyboard handler
        const keyHandler = (e) => {
            if (e.key === '1') {
                e.preventDefault();
                e.stopPropagation();
                updateSelection('win');
            } else if (e.key === '2') {
                e.preventDefault();
                e.stopPropagation();
                updateSelection('partner');
            } else if (e.key === '3') {
                e.preventDefault();
                e.stopPropagation();
                updateSelection('loss');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                // Remove listener immediately to prevent duplicate calls
                document.removeEventListener('keydown', keyHandler, true);
                this.handleFinishResult(selectedResult);
                closeModal();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            }
        };

        // Add keyboard listener with capture
        document.addEventListener('keydown', keyHandler, true);
        
        // Add click handlers
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const result = e.target.dataset.result || e.target.closest('.finish-btn').dataset.result;
                this.handleFinishResult(result);
                closeModal();
            });
        });
    }

    handleFinishResult(result) {
        // Bounds check - prevent errors if already past game 3
        if (this.currentGame > 3) {
            return;
        }
        
        const finishCell = document.querySelector(`.finish[data-game="${this.currentGame}"]`);
        
        if (!finishCell) {
            return;
        }
        
        if (result === 'loss') {
            finishCell.textContent = '❌';
            finishCell.style.color = '#dc2626';
            this.gameData[this.currentGame].finish = 'loss';
            this.gameData[this.currentGame].finishType = 'loss';
        } else if (result === 'partner') {
            finishCell.textContent = '✓';
            finishCell.style.color = '#f97316';
            this.gameData[this.currentGame].finish = 'partner';
            this.gameData[this.currentGame].finishType = 'partner';
        } else if (result === 'win') {
            finishCell.textContent = '✓';
            finishCell.style.color = '#16a34a';
            this.gameData[this.currentGame].finish = 'win';
            this.gameData[this.currentGame].finishType = 'win';
        }

        // Move to next game
        this.currentGame++;
        if (this.currentGame <= 3) {
            this.currentDartBox = 3;
            this.highlightCurrentCell();
        } else {
            // All games complete
            this.matchComplete = true;
            this.calculateMatchTotals();
            this.clearHighlight();
        }
        this.saveToDatabase();
    }

    calculateGameTotals() {
        const gameData = this.gameData[this.currentGame];
        let totalScore = 0;
        let lastDartBox = 0;

        // Sum up all scores and find last dart box used
        gameData.scores.forEach(entry => {
            totalScore += entry.score;
            lastDartBox = entry.dartBox;
        });

        gameData.totalScore = totalScore;
        gameData.totalDarts = lastDartBox;
        gameData.avg = lastDartBox > 0 ? (totalScore / lastDartBox).toFixed(2) : 0;
        
        // Count tons (scores of 95+)
        gameData.tons = gameData.scores.filter(entry => entry.score >= 95).length;

        // Update UI
        document.querySelector(`.score[data-game="${this.currentGame}"]`).textContent = totalScore;
        document.querySelector(`.darts[data-game="${this.currentGame}"]`).textContent = lastDartBox;
        document.querySelector(`.tons[data-game="${this.currentGame}"]`).textContent = gameData.tons;
        document.querySelector(`.avg[data-game="${this.currentGame}"]`).textContent = gameData.avg;
    }

    calculateMatchTotals() {
        let totalScore = 0;
        let totalDarts = 0;
        let totalTons = 0;

        for (let game = 1; game <= 3; game++) {
            totalScore += this.gameData[game].totalScore;
            totalDarts += this.gameData[game].totalDarts;
            totalTons += this.gameData[game].tons;
        }

        const dartAvg = totalDarts > 0 ? (totalScore / totalDarts).toFixed(2) : 0.00;

        const totalScoreEl = document.getElementById('totalScore');
        const totalDartsEl = document.getElementById('totalDarts');
        const totalTonsEl = document.getElementById('totalTons');
        const dartAvgEl = document.getElementById('dartAvg');

        if (totalScoreEl) totalScoreEl.textContent = totalScore;
        if (totalDartsEl) totalDartsEl.textContent = totalDarts;
        if (totalTonsEl) totalTonsEl.textContent = totalTons;
        if (dartAvgEl) dartAvgEl.textContent = dartAvg;
    }

    moveToNextDartBox() {
        const currentIndex = this.dartBoxes.indexOf(this.currentDartBox);
        if (currentIndex < this.dartBoxes.length - 1) {
            this.currentDartBox = this.dartBoxes[currentIndex + 1];
            this.highlightCurrentCell();
        }
    }

    highlightCurrentCell() {
        // Remove all highlights
        this.clearHighlight();

        // Add highlight to current cell
        if (this.currentGame <= 3) {
            const cell = document.querySelector(`.dart-cell[data-game="${this.currentGame}"][data-dart="${this.currentDartBox}"]`);
            if (cell && !cell.classList.contains('filled')) {
                cell.classList.add('active');
            }
        }
    }

    clearHighlight() {
        document.querySelectorAll('.dart-cell').forEach(cell => {
            cell.classList.remove('active');
        });
    }

    updateCurrentCell() {
        const cell = document.querySelector(`.dart-cell[data-game="${this.currentGame}"][data-dart="${this.currentDartBox}"]`);
        if (cell && !cell.classList.contains('filled')) {
            cell.textContent = this.currentInput;
        }
    }

    undo() {
        // Find the last filled cell across all games
        let lastGame = null;
        let lastDartBox = null;

        for (let game = this.currentGame; game >= 1; game--) {
            const cells = document.querySelectorAll(`.dart-cell[data-game="${game}"]`);
            for (let i = cells.length - 1; i >= 0; i--) {
                if (cells[i].textContent !== '') {
                    lastGame = game;
                    lastDartBox = parseInt(cells[i].getAttribute('data-dart'));
                    
                    // Check if it's an end marker
                    const isEndMarker = cells[i].textContent === '/';
                    
                    // Clear the cell
                    cells[i].textContent = '';
                    cells[i].classList.remove('filled', 'end-marker', 'high-score');

                    if (isEndMarker) {
                        // If we're undoing an end score, go back to previous game
                        this.currentGame = game;
                        this.currentDartBox = lastDartBox;
                        this.matchComplete = false;
                        
                        // Recalculate totals
                        this.gameData[game].totalScore = 0;
                        this.gameData[game].totalDarts = 0;
                        document.querySelector(`.score[data-game="${game}"]`).textContent = '0';
                        document.querySelector(`.darts[data-game="${game}"]`).textContent = '-';
                        document.querySelector(`.avg[data-game="${game}"]`).textContent = '0';
                        this.calculateMatchTotals();
                    } else {
                        // Remove the last score from game data
                        this.gameData[game].scores.pop();
                        this.currentGame = game;
                        this.currentDartBox = lastDartBox;
                        this.matchComplete = false;
                    }
                    
                    this.highlightCurrentCell();
                    return;
                }
            }
        }
    }

    sitOut() {
        // Confirmation prompt - sit out cannot be undone
        if (!confirm('Are you sure you want to sit out this entire match? This action cannot be undone.')) {
            return;
        }

        this.completeSitOut();
    }

    completeSitOut() {
        // Scratch out all cells for all 3 games in this match
        for (let game = 1; game <= 3; game++) {
            const cells = document.querySelectorAll(`.dart-cell[data-game="${game}"]`);
            cells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('filled', 'end-marker', 'active', 'high-score');
                cell.classList.add('scratched');
            });

            this.gameData[game] = { 
                scores: [], 
                totalScore: 0, 
                totalDarts: 0, 
                tons: 0, 
                finish: '', 
                avg: 0 
            };

            // Mark totals as scratched
            document.querySelector(`.score[data-game="${game}"]`).textContent = '-';
            document.querySelector(`.darts[data-game="${game}"]`).textContent = '-';
            document.querySelector(`.tons[data-game="${game}"]`).textContent = '-';
            document.querySelector(`.finish[data-game="${game}"]`).textContent = '-';
            document.querySelector(`.avg[data-game="${game}"]`).textContent = '-';
        }

        // Remove existing match with same number if it exists (prevent duplicates)
        const existingIndex = this.matchHistory.findIndex(m => m.match === this.currentMatch);
        if (existingIndex !== -1) {
            this.matchHistory.splice(existingIndex, 1);
        }
        
        // Save match as sit out
        this.matchHistory.push({
            match: this.currentMatch,
            status: 'sit-out',
            gameData: JSON.parse(JSON.stringify(this.gameData))
        });

        // Sort history by match number to maintain order
        this.matchHistory.sort((a, b) => a.match - b.match);

        // Save to database
        this.saveToDatabase();

        // Move to next match
        this.startNextMatch();
    }

    async logout() {
        const confirmLogout = confirm('Are you sure you want to logout? Your data is saved.');
        if (!confirmLogout) return;
        
        try {
            if (supabase && supabase.auth) {
                await supabase.auth.signOut();
            }
            // Clear local data
            this.currentUser = null;
            this.userName = '';
            localStorage.clear();
            location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            // Force reload anyway
            localStorage.clear();
            location.reload();
        }
    }

    nightDone() {
        const isLastMatch = this.currentMatch === 5;
        
        // Show custom confirmation modal
        this.showNextMatchConfirmation(isLastMatch);
    }

    showNextMatchConfirmation(isLastMatch) {
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        
        const title = isLastMatch ? 'End the Night?' : 'Move to Next Match?';
        const message = isLastMatch 
            ? 'This will save Match 5 and show your nightly totals.'
            : `This will save Match ${this.currentMatch} and start Match ${this.currentMatch + 1}.`;
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>${title}</h2>
                <p style="color: #9ca3af; margin-bottom: 30px; font-size: 16px;">${message}</p>
                <div class="finish-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button class="finish-btn" id="cancelNextMatchBtn" style="background: #64748b;">
                        Cancel
                    </button>
                    <button class="finish-btn win" id="confirmNextMatchBtn">
                        Confirm
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Keyboard handler for Enter key
        const keyHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                document.removeEventListener('keydown', keyHandler, true);
                document.body.removeChild(modal);
                this.proceedToNextMatch(isLastMatch);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                document.removeEventListener('keydown', keyHandler, true);
                document.body.removeChild(modal);
            }
        };
        
        document.addEventListener('keydown', keyHandler, true);
        
        // Cancel button
        document.getElementById('cancelNextMatchBtn').addEventListener('click', () => {
            document.removeEventListener('keydown', keyHandler, true);
            document.body.removeChild(modal);
        });
        
        // Confirm button
        document.getElementById('confirmNextMatchBtn').addEventListener('click', () => {
            document.removeEventListener('keydown', keyHandler, true);
            document.body.removeChild(modal);
            this.proceedToNextMatch(isLastMatch);
        });
    }

    proceedToNextMatch(isLastMatch) {
        this.matchComplete = true;
        this.clearHighlight();
        
        // Count finishes
        let myFinishes = 0;
        let partnerFinishes = 0;
        for (let game = 1; game <= 3; game++) {
            if (this.gameData[game].finishType === 'win') myFinishes++;
            if (this.gameData[game].finishType === 'partner') partnerFinishes++;
        }

        // Calculate totals from gameData instead of DOM
        let totalScore = 0;
        let totalDarts = 0;
        let totalTons = 0;
        for (let game = 1; game <= 3; game++) {
            totalScore += this.gameData[game].totalScore;
            totalDarts += this.gameData[game].totalDarts;
            totalTons += this.gameData[game].tons;
        }
        const dartAvg = totalDarts > 0 ? parseFloat((totalScore / totalDarts).toFixed(2)) : 0.00;

        // Remove existing match with same number if it exists (prevent duplicates)
        const existingIndex = this.matchHistory.findIndex(m => m.match === this.currentMatch);
        if (existingIndex !== -1) {
            this.matchHistory.splice(existingIndex, 1);
        }
        
        // Save current match
        this.matchHistory.push({
            match: this.currentMatch,
            status: 'completed',
            gameData: JSON.parse(JSON.stringify(this.gameData)),
            totals: {
                score: totalScore,
                darts: totalDarts,
                tons: totalTons,
                avg: dartAvg
            },
            myFinishes: myFinishes,
            partnerFinishes: partnerFinishes
        });
        
        // Sort history by match number to maintain order
        this.matchHistory.sort((a, b) => a.match - b.match);
        
        // Save to database
        this.saveToDatabase();
        
        if (isLastMatch) {
            // Show nightly totals
            this.showNightlyTotals();
        } else {
            // Move to next match
            this.startNextMatch();
        }
    }

    startNextMatch() {
        // Find the next available match number (lowest number not in history)
        const allMatchNumbers = this.matchHistory.map(m => m.match);
        let nextMatch = null;
        
        for (let i = 1; i <= 5; i++) {
            if (!allMatchNumbers.includes(i)) {
                nextMatch = i;
                break;
            }
        }
        
        // If all matches are complete, show nightly totals
        if (nextMatch === null) {
            this.showNightlyTotals();
            return;
        }
        
        this.currentMatch = nextMatch;
        
        // Reset for new match
        this.currentGame = 1;
        this.currentDartBox = 3;
        this.matchComplete = false;
        this.currentInput = '';
        
        // Reset game data
        this.gameData = {
            1: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
            2: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
            3: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 }
        };
        
        // Clear all cells
        document.querySelectorAll('.dart-cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('filled', 'end-marker', 'active', 'high-score', 'scratched');
        });
        
        // Reset totals
        for (let game = 1; game <= 3; game++) {
            document.querySelector(`.score[data-game="${game}"]`).textContent = '0';
            document.querySelector(`.darts[data-game="${game}"]`).textContent = '-';
            document.querySelector(`.tons[data-game="${game}"]`).textContent = '0';
            document.querySelector(`.finish[data-game="${game}"]`).textContent = '';
            document.querySelector(`.avg[data-game="${game}"]`).textContent = '0';
        }
        
        document.getElementById('totalScore').textContent = '0';
        document.getElementById('totalDarts').textContent = '0';
        document.getElementById('dartAvg').textContent = '0.00';
        
        this.updateMatchDisplay();
        this.highlightCurrentCell();
        this.saveToDatabase();
    }

    updateMatchDisplay() {
        document.querySelector('.current-match').textContent = `Current: Match ${this.currentMatch}`;
        document.querySelector('h3').textContent = `MATCH ${this.currentMatch} TOTALS`;
        document.getElementById('historyCount').textContent = this.matchHistory.length;
        
        // Display user info
        const userInfoEl = document.getElementById('userInfo');
        const logoutBtn = document.getElementById('logoutBtn');
        if (userInfoEl && this.userName) {
            const date = new Date(this.sessionDate).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            userInfoEl.textContent = `Welcome, ${this.userName} • 📅 ${date}`;
            if (logoutBtn) {
                logoutBtn.classList.remove('hidden');
            }
        }
        
        // Update button text based on current match
        const nextMatchBtn = document.getElementById('nextMatchBtn');
        if (this.currentMatch === 5) {
            nextMatchBtn.innerHTML = '📊 COLLECT TOTALS';
            nextMatchBtn.style.background = '#9333ea';
        } else {
            nextMatchBtn.innerHTML = '▶ NEXT MATCH';
            nextMatchBtn.style.background = '#9333ea';
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        if (tabName === 'current') {
            document.getElementById('currentTab').classList.add('active');
            document.querySelector('[data-tab="current"]').classList.add('active');
        } else if (tabName === 'history') {
            document.getElementById('historyTab').classList.add('active');
            document.querySelector('[data-tab="history"]').classList.add('active');
            this.updateHistoryView();
        } else if (tabName === 'stats') {
            document.getElementById('statsTab').classList.add('active');
            document.querySelector('[data-tab="stats"]').classList.add('active');
            this.updateStatsView();
        } else if (tabName === 'ytd') {
            document.getElementById('ytdTab').classList.add('active');
            document.querySelector('[data-tab="ytd"]').classList.add('active');
            this.updateYTDView();
        }
    }

    async updateYTDView() {
        const ytdContent = document.getElementById('ytdContent');
        ytdContent.innerHTML = '<div class="ytd-loading">Loading leaderboard...</div>';
        
        const { data: leaderboard, error } = await SupabaseDB.getYTDLeaderboard();
        
        if (error) {
            ytdContent.innerHTML = '<div class="ytd-error">Failed to load leaderboard. Please try again.</div>';
            console.error('YTD error:', error);
            return;
        }
        
        if (!leaderboard || leaderboard.length === 0) {
            ytdContent.innerHTML = '<div class="ytd-empty">No stats yet this year. Complete some matches to appear on the leaderboard!</div>';
            return;
        }
        
        let html = `
            <div class="ytd-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Nights</th>
                            <th>Average</th>
                            <th>Tons</th>
                            <th>Finishes</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        leaderboard.forEach((user, index) => {
            const rank = index + 1;
            let rankClass = 'ytd-rank';
            let rankDisplay = `#${rank}`;
            
            if (rank === 1) {
                rankClass += ' gold';
                rankDisplay = '🥇';
            } else if (rank === 2) {
                rankClass += ' silver';
                rankDisplay = '🥈';
            } else if (rank === 3) {
                rankClass += ' bronze';
                rankDisplay = '🥉';
            }
            
            const isCurrentUser = user.userId === this.currentUser?.id;
            const rowClass = isCurrentUser ? 'style="background: rgba(22, 163, 74, 0.1);"' : '';
            
            html += `
                <tr ${rowClass}>
                    <td class="${rankClass}">${rankDisplay}</td>
                    <td class="ytd-name">${user.userName}${isCurrentUser ? ' (You)' : ''}</td>
                    <td class="ytd-matches">${user.nightsPlayed || user.matchCount}</td>
                    <td class="ytd-average">${user.average}</td>
                    <td class="ytd-tons">${user.tons}</td>
                    <td class="ytd-finishes">${user.finishes}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        ytdContent.innerHTML = html;
    }

    updateHistoryView() {
        const historyContent = document.getElementById('historyContent');
        
        if (this.matchHistory.length === 0) {
            historyContent.innerHTML = '<p class="empty-message">No matches completed yet. Complete a match to see it here.</p>';
            return;
        }

        let html = '';
        this.matchHistory.forEach((match, index) => {
            if (match.status === 'sit-out') {
                html += `
                    <div class="history-match-container sit-out">
                        <div class="history-match-header">
                            <h3>Match ${match.match}</h3>
                            <div class="history-header-buttons">
                                <span class="status-badge sit-out">SIT OUT</span>
                                <button class="edit-match-btn" data-match-index="${index}">✏️ Edit</button>
                                <button class="delete-match-btn" data-match-index="${index}">🗑️ Delete</button>
                            </div>
                        </div>
                        <p style="text-align: center; color: #9ca3af; padding: 20px;">You sat out this match</p>
                    </div>
                `;
            } else {
                html += this.generateMatchTableHTML(match, index);
            }
        });

        historyContent.innerHTML = html;
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-match-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchIndex = parseInt(e.target.dataset.matchIndex);
                this.showEditMatchModal(matchIndex);
            });
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-match-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchIndex = parseInt(e.target.dataset.matchIndex);
                this.deleteMatch(matchIndex);
            });
        });
    }

    generateMatchTableHTML(match, matchIndex) {
        const myFinishes = match.myFinishes || 0;
        
        let tableRows = '';
        for (let game = 1; game <= 3; game++) {
            const gameData = match.gameData[game];
            let dartCells = '';
            
            [3, 6, 9, 12, 15, 18, 21].forEach(dartBox => {
                const scoreEntry = gameData.scores.find(s => s.dartBox === dartBox);
                let cellContent = '';
                let cellClass = 'history-dart-cell';
                
                if (scoreEntry) {
                    cellContent = scoreEntry.score;
                    cellClass += ' filled';
                    if (scoreEntry.score >= 95) {
                        cellClass += ' high-score';
                    }
                } else if (gameData.totalDarts > 0 && dartBox > gameData.totalDarts) {
                    // Check if this should have the end marker
                    const nextBox = [3, 6, 9, 12, 15, 18, 21].find(b => b > gameData.totalDarts);
                    if (dartBox === nextBox) {
                        cellContent = '/';
                        cellClass += ' filled end-marker';
                    }
                }
                
                dartCells += `<td class="${cellClass}" data-match-index="${matchIndex}" data-game="${game}" data-dart="${dartBox}">${cellContent}</td>`;
            });
            
            // Finish cell display
            let finishDisplay = '';
            let finishStyle = '';
            if (gameData.finishType === 'win') {
                finishDisplay = '✓';
                finishStyle = 'color: #16a34a;';
            } else if (gameData.finishType === 'partner') {
                finishDisplay = '✓';
                finishStyle = 'color: #f97316;';
            } else if (gameData.finishType === 'loss') {
                finishDisplay = '✗';
                finishStyle = 'color: #dc2626;';
            }
            
            tableRows += `
                <tr>
                    <td class="game-number">${game}</td>
                    ${dartCells}
                    <td class="total-cell score">${gameData.totalScore}</td>
                    <td class="total-cell darts">${gameData.totalDarts || '-'}</td>
                    <td class="total-cell tons">${gameData.tons || 0}</td>
                    <td class="total-cell finish" style="${finishStyle}">${finishDisplay}</td>
                    <td class="total-cell avg">${gameData.avg || 0}</td>
                </tr>
            `;
        }
        
        return `
            <div class="history-match-container" data-match-index="${matchIndex}">
                <div class="history-match-header">
                    <h3>Match ${match.match}</h3>
                    <div class="history-header-buttons">
                        <button class="edit-match-btn" data-match-index="${matchIndex}">✏️ Edit</button>
                        <button class="delete-match-btn" data-match-index="${matchIndex}">🗑️ Delete</button>
                    </div>
                </div>
                <div class="scoring-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Game</th>
                                <th colspan="7">Darts</th>
                                <th colspan="5">Totals</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th>3</th>
                                <th>6</th>
                                <th>9</th>
                                <th>12</th>
                                <th>15</th>
                                <th>18</th>
                                <th>21</th>
                                <th>Score</th>
                                <th>Darts</th>
                                <th>Tons</th>
                                <th>Finish</th>
                                <th>Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                <div class="history-match-totals">
                    <div class="history-total-item">
                        <span>Total Score:</span>
                        <span class="history-total-value">${match.totals.score}</span>
                    </div>
                    <div class="history-total-item">
                        <span>Total Darts:</span>
                        <span class="history-total-value">${match.totals.darts}</span>
                    </div>
                    <div class="history-total-item">
                        <span>Average:</span>
                        <span class="history-total-value highlight">${match.totals.avg}</span>
                    </div>
                    <div class="history-total-item">
                        <span>Games Won:</span>
                        <span class="history-total-value green">${myFinishes}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showEditMatchModal(matchIndex) {
        const match = this.matchHistory[matchIndex];
        if (!match) return;

        // Handle sit-out matches separately
        if (match.status === 'sit-out') {
            this.showEditSitOutModal(matchIndex);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'finish-modal edit-match-modal';
        
        let gamesHtml = '';
        for (let game = 1; game <= 3; game++) {
            const gameData = match.gameData[game];
            let scoresHtml = '';
            
            // Generate score inputs for each dart box
            [3, 6, 9, 12, 15, 18, 21].forEach(dartBox => {
                const scoreEntry = gameData.scores.find(s => s.dartBox === dartBox);
                const scoreValue = scoreEntry ? scoreEntry.score : '';
                scoresHtml += `
                    <div class="edit-score-item">
                        <label>${dartBox} Darts:</label>
                        <input type="number" class="edit-score-input" 
                               data-game="${game}" 
                               data-dartbox="${dartBox}" 
                               value="${scoreValue}" 
                               placeholder="-"
                               min="0">
                    </div>
                `;
            });
            
            const finishType = gameData.finishType || 'none';
            
            gamesHtml += `
                <div class="edit-game-section">
                    <h4>Game ${game}</h4>
                    <div class="edit-scores">
                        ${scoresHtml}
                    </div>
                    <div class="edit-finish">
                        <label>Game Result:</label>
                        <select class="edit-finish-select" data-game="${game}">
                            <option value="none" ${finishType === 'none' ? 'selected' : ''}>No Finish</option>
                            <option value="win" ${finishType === 'win' ? 'selected' : ''}>I Finished (Green ✓)</option>
                            <option value="partner" ${finishType === 'partner' ? 'selected' : ''}>Partner Finished (Orange ✓)</option>
                            <option value="loss" ${finishType === 'loss' ? 'selected' : ''}>Game Loss (Red ✗)</option>
                        </select>
                    </div>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="finish-modal-content edit-modal-content">
                <h2>Edit Match ${match.match}</h2>
                <div class="edit-games-container">
                    ${gamesHtml}
                </div>
                <div class="edit-modal-buttons">
                    <button class="finish-btn" id="cancelEditBtn" style="background: #64748b;">Cancel</button>
                    <button class="finish-btn win" id="saveEditBtn">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cancel button
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Save button
        document.getElementById('saveEditBtn').addEventListener('click', () => {
            this.saveMatchEdit(matchIndex, modal);
            document.body.removeChild(modal);
        });
    }

    saveMatchEdit(matchIndex, modal) {
        const match = this.matchHistory[matchIndex];
        
        // Update scores for each game
        for (let game = 1; game <= 3; game++) {
            const newScores = [];
            let lastDartBox = 0;
            
            // Collect all scores from inputs
            modal.querySelectorAll(`.edit-score-input[data-game="${game}"]`).forEach(input => {
                const dartBox = parseInt(input.dataset.dartbox);
                const value = input.value.trim();
                
                if (value !== '' && !isNaN(value)) {
                    const score = parseInt(value);
                    newScores.push({
                        dartBox: dartBox,
                        score: score,
                        darts: dartBox
                    });
                    lastDartBox = dartBox;
                }
            });
            
            // Update finish type
            const finishSelect = modal.querySelector(`.edit-finish-select[data-game="${game}"]`);
            const finishType = finishSelect.value;
            
            // Update game data
            match.gameData[game].scores = newScores;
            match.gameData[game].finishType = finishType;
            
            // Recalculate totals for this game
            const totalScore = newScores.reduce((sum, entry) => sum + entry.score, 0);
            match.gameData[game].totalScore = totalScore;
            match.gameData[game].totalDarts = lastDartBox;
            match.gameData[game].avg = lastDartBox > 0 ? (totalScore / lastDartBox).toFixed(2) : 0;
            match.gameData[game].tons = Math.floor(totalScore / 100);
        }
        
        // Recalculate match totals
        let matchScore = 0;
        let matchDarts = 0;
        let myFinishes = 0;
        
        for (let game = 1; game <= 3; game++) {
            matchScore += match.gameData[game].totalScore;
            matchDarts += match.gameData[game].totalDarts;
            if (match.gameData[game].finishType === 'win') myFinishes++;
        }
        
        const matchAvg = matchDarts > 0 ? (matchScore / matchDarts).toFixed(2) : '0.00';
        
        match.totals = {
            score: matchScore.toString(),
            darts: matchDarts.toString(),
            avg: matchAvg
        };
        match.myFinishes = myFinishes;
        
        // Refresh history view
        this.updateHistoryView();
        
        // Update stats if on stats tab
        if (document.getElementById('statsTab').classList.contains('active')) {
            this.updateStatsView();
        }
    }

    showNightlyTotals() {
        // Calculate night totals
        let totalCompleted = 0;
        let totalSitOuts = 0;
        let cumulativeScore = 0;
        let cumulativeDarts = 0;
        let totalTons = 0;
        let totalMyFinishes = 0;

        this.matchHistory.forEach(match => {
            if (match.status === 'sit-out') {
                totalSitOuts++;
            } else {
                totalCompleted++;
                cumulativeScore += parseInt(match.totals.score) || 0;
                cumulativeDarts += parseInt(match.totals.darts) || 0;
                totalTons += parseInt(match.totals.tons) || 0;
                totalMyFinishes += match.myFinishes || 0;
            }
        });

        const overallAvg = cumulativeDarts > 0 ? (cumulativeScore / cumulativeDarts).toFixed(2) : '0.00';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'finish-modal nightly-totals-modal';
        modal.innerHTML = `
            <div class="finish-modal-content nightly-totals">
                <h2>★ Nightly Totals ★</h2>
                <div class="totals-grid">
                    <div class="totals-section">
                        <h3>Match Summary</h3>
                        <div class="totals-row">
                            <span>Total Matches:</span>
                            <span class="totals-value">${this.matchHistory.length}</span>
                        </div>
                        <div class="totals-row">
                            <span>Completed:</span>
                            <span class="totals-value">${totalCompleted}</span>
                        </div>
                        <div class="totals-row">
                            <span>Sit Outs:</span>
                            <span class="totals-value">${totalSitOuts}</span>
                        </div>
                    </div>
                    <div class="totals-section">
                        <h3>Scoring Stats</h3>
                        <div class="totals-row">
                            <span>Total Score:</span>
                            <span class="totals-value">${cumulativeScore}</span>
                        </div>
                        <div class="totals-row">
                            <span>Total Darts:</span>
                            <span class="totals-value">${cumulativeDarts}</span>
                        </div>
                        <div class="totals-row">
                            <span>Total Tons (95+):</span>
                            <span class="totals-value" style="color: #f97316;">${totalTons}</span>
                        </div>
                        <div class="totals-row highlight">
                            <span>Night Average:</span>
                            <span class="totals-value">${overallAvg}</span>
                        </div>
                    </div>
                    <div class="totals-section">
                        <h3>Games Finished</h3>
                        <div class="totals-row highlight">
                            <span>Total Games I Finished:</span>
                            <span class="totals-value green">${totalMyFinishes}</span>
                        </div>
                    </div>
                </div>
                <div class="edit-modal-buttons">
                    <button class="finish-btn" id="closeNightBtn" style="background: #64748b;">Close</button>
                    <button class="finish-btn win" id="saveNightStatsBtn">💾 Save Stats for the Night</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('closeNightBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('saveNightStatsBtn').addEventListener('click', async () => {
            document.body.removeChild(modal);
            await this.saveNightlyStats(totalCompleted, cumulativeScore, cumulativeDarts, totalTons, totalMyFinishes, overallAvg);
        });
    }

    showResetConfirmation() {
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>⚠️ End Night & Reset?</h2>
                <p style="color: #9ca3af; margin-bottom: 30px; font-size: 16px;">This will clear all data and start fresh for the next night. Your current stats will be lost.</p>
                <div class="finish-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button class="finish-btn" id="cancelResetBtn" style="background: #64748b;">
                        Cancel
                    </button>
                    <button class="finish-btn loss" id="confirmResetBtn">
                        Reset Everything
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cancel button
        document.getElementById('cancelResetBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Confirm button
        document.getElementById('confirmResetBtn').addEventListener('click', async () => {
            document.body.removeChild(modal);
            await this.resetForNewNight();
        });
    }

    async saveNightlyStats(totalMatches, totalScore, totalDarts, totalTons, totalFinishes, avgScore) {
        try {
            // Save to nightly_stats table
            const nightlyData = {
                session_date: this.sessionDate,
                user_id: this.currentUser.id,
                user_name: this.userName,
                total_matches: totalMatches,
                total_score: totalScore,
                total_darts: totalDarts,
                total_tons: totalTons,
                total_finishes: totalFinishes,
                avg_score: parseFloat(avgScore)
            };

            await saveNightlyStats(nightlyData);

            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'finish-modal';
            successModal.innerHTML = `
                <div class="finish-modal-content">
                    <h2 style="color: #16a34a;">✅ Stats Saved!</h2>
                    <p style="color: #9ca3af; margin: 20px 0;">Your nightly stats have been saved to the Year to Date leaderboard.</p>
                    <button class="finish-btn win" id="doneBtn">Done</button>
                </div>
            `;
            document.body.appendChild(successModal);

            document.getElementById('doneBtn').addEventListener('click', () => {
                document.body.removeChild(successModal);
            });

        } catch (error) {
            console.error('Error saving nightly stats:', error);
            alert('Failed to save stats. Please try again.');
        }
    }

    updateStatsView() {
        let totalCompleted = 0;
        let totalSitOuts = 0;
        let cumulativeScore = 0;
        let cumulativeDarts = 0;
        let totalMyFinishes = 0;
        let totalTons = 0;

        this.matchHistory.forEach(match => {
            if (match.status === 'sit-out') {
                totalSitOuts++;
            } else {
                totalCompleted++;
                cumulativeScore += parseInt(match.totals.score) || 0;
                cumulativeDarts += parseInt(match.totals.darts) || 0;
                totalMyFinishes += match.myFinishes || 0;
                
                // Calculate tons from all games in the match
                for (let game = 1; game <= 3; game++) {
                    if (match.gameData[game]) {
                        totalTons += match.gameData[game].tons || 0;
                    }
                }
            }
        });

        const overallAvg = cumulativeDarts > 0 ? (cumulativeScore / cumulativeDarts).toFixed(2) : '0.00';

        document.getElementById('statTotalMatches').textContent = this.matchHistory.length;
        document.getElementById('statCompleted').textContent = totalCompleted;
        document.getElementById('statSitOuts').textContent = totalSitOuts;
        document.getElementById('statTotalScore').textContent = cumulativeScore;
        document.getElementById('statTotalDarts').textContent = cumulativeDarts;
        document.getElementById('statTotalTons').textContent = totalTons;
        document.getElementById('statOverallAvg').textContent = overallAvg;
        document.getElementById('statMyFinishes').textContent = totalMyFinishes;
    }

    // Supabase integration methods
    async saveToDatabase() {
        if (!supabase) return;

        try {
            // Save current session state
            await SupabaseDB.saveSession({
                sessionId: this.sessionId,
                currentMatch: this.currentMatch,
                currentGame: this.currentGame,
                currentDartBox: this.currentDartBox,
                gameData: this.gameData,
                matchComplete: this.matchComplete
            });

            // Save match history
            if (this.matchHistory.length > 0) {
                await SupabaseDB.saveMatchHistory(this.sessionId, this.matchHistory, this.userName);
            }

            console.log('Data saved to Supabase');
        } catch (error) {
            console.error('Error saving to database:', error);
        }
    }

    async loadFromDatabase() {
        if (!supabase) return;

        try {
            // Load session state
            const { data: sessionData, error: sessionError } = await SupabaseDB.loadSession(this.sessionId);
            
            if (sessionData && !sessionError) {
                this.currentMatch = sessionData.current_match || 1;
                this.currentGame = sessionData.current_game || 1;
                this.currentDartBox = sessionData.current_dart_box || 3;
                this.gameData = sessionData.game_data || {
                    1: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
                    2: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
                    3: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 }
                };
                this.matchComplete = sessionData.match_complete || false;

                // Restore the UI for current game
                this.restoreGameUI();
            }

            // Load match history
            const { data: historyData, error: historyError } = await SupabaseDB.loadMatchHistory(this.sessionId);
            
            if (historyData && !historyError) {
                // Remove duplicates - keep only the last occurrence of each match number
                const uniqueMatches = new Map();
                historyData.forEach(match => {
                    uniqueMatches.set(match.match, match);
                });
                this.matchHistory = Array.from(uniqueMatches.values()).sort((a, b) => a.match - b.match);
            }

            console.log('Data loaded from Supabase');
        } catch (error) {
            console.error('Error loading from database:', error);
        }
    }

    restoreGameUI() {
        // Restore all scores in the table
        for (let game = 1; game <= 3; game++) {
            const gameData = this.gameData[game];
            
            // Restore dart scores
            gameData.scores.forEach(entry => {
                const cell = document.querySelector(`.dart-cell[data-game="${game}"][data-dart="${entry.dartBox}"]`);
                if (cell) {
                    cell.textContent = entry.score;
                    cell.classList.add('filled');
                    if (entry.score >= 95) {
                        cell.classList.add('high-score');
                    }
                }
            });

            // Restore totals
            if (gameData.totalScore > 0 || gameData.totalDarts > 0) {
                document.querySelector(`.score[data-game="${game}"]`).textContent = gameData.totalScore;
                document.querySelector(`.darts[data-game="${game}"]`).textContent = gameData.totalDarts || '-';
                document.querySelector(`.tons[data-game="${game}"]`).textContent = gameData.tons || 0;
                document.querySelector(`.avg[data-game="${game}"]`).textContent = gameData.avg || 0;

                // Restore finish marker
                const finishCell = document.querySelector(`.finish[data-game="${game}"]`);
                if (gameData.finishType === 'win') {
                    finishCell.textContent = '✓';
                    finishCell.style.color = '#16a34a';
                } else if (gameData.finishType === 'partner') {
                    finishCell.textContent = '✓';
                    finishCell.style.color = '#f97316';
                } else if (gameData.finishType === 'loss') {
                    finishCell.textContent = '❌';
                    finishCell.style.color = '#dc2626';
                }
            }
        }

        // Recalculate match totals
        this.calculateMatchTotals();
    }

    async resetForNewNight() {
        // Clear from database
        if (supabase) {
            await SupabaseDB.clearSession(this.sessionId);
        }

        // Generate new session ID
        const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('dart_session_id', newSessionId);
        this.sessionId = newSessionId;

        // Reset all app state
        this.currentMatch = 1;
        this.currentGame = 1;
        this.currentDartBox = 3;
        this.currentInput = '';
        this.matchComplete = false;
        this.matchHistory = [];
        
        this.gameData = {
            1: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
            2: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
            3: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 }
        };

        // Clear all UI
        document.querySelectorAll('.dart-cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('filled', 'end-marker', 'active', 'high-score', 'scratched');
        });

        for (let game = 1; game <= 3; game++) {
            document.querySelector(`.score[data-game="${game}"]`).textContent = '0';
            document.querySelector(`.darts[data-game="${game}"]`).textContent = '-';
            document.querySelector(`.tons[data-game="${game}"]`).textContent = '0';
            document.querySelector(`.finish[data-game="${game}"]`).textContent = '';
            document.querySelector(`.avg[data-game="${game}"]`).textContent = '0';
        }

        document.getElementById('totalScore').textContent = '0';
        document.getElementById('totalDarts').textContent = '0';
        document.getElementById('dartAvg').textContent = '0.00';

        this.updateMatchDisplay();
        this.highlightCurrentCell();
        
        // Switch to current tab
        this.switchTab('current');

        // Show success message
        this.showSuccessMessage('Ready for a new night! All previous data has been cleared.');
    }

    showSuccessMessage(message) {
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>✅ Success</h2>
                <p style="color: #4ade80; margin-bottom: 30px; font-size: 16px;">${message}</p>
                <button class="finish-btn win" id="okBtn">
                    OK
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('okBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showEditSitOutModal(matchIndex) {
        const match = this.matchHistory[matchIndex];
        
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>Edit Match ${match.match}</h2>
                <p style="color: #9ca3af; margin-bottom: 30px;">This match is marked as a sit-out. What would you like to do?</p>
                <div class="finish-options" style="display: flex; flex-direction: column; gap: 15px;">
                    <button class="finish-btn" id="convertToNormalBtn" style="background: #16a34a;">
                        Convert to Normal Match
                    </button>
                    <button class="finish-btn" id="deleteSitOutBtn" style="background: #dc2626;">
                        Delete This Match
                    </button>
                    <button class="finish-btn" id="cancelSitOutBtn" style="background: #64748b;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Convert to normal match
        document.getElementById('convertToNormalBtn').addEventListener('click', async () => {
            match.status = 'completed';
            match.gameData = {
                1: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', finishType: 'none', avg: 0 },
                2: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', finishType: 'none', avg: 0 },
                3: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', finishType: 'none', avg: 0 }
            };
            match.totals = { score: 0, darts: 0, tons: 0, avg: 0 };
            match.myFinishes = 0;
            
            await this.saveToDatabase();
            this.updateHistoryView();
            this.updateStatsView();
            document.body.removeChild(modal);
            
            // Show edit modal for the now-normal match
            setTimeout(() => this.showEditMatchModal(matchIndex), 100);
        });
        
        // Delete match
        document.getElementById('deleteSitOutBtn').addEventListener('click', async () => {
            document.body.removeChild(modal);
            await this.deleteMatch(matchIndex);
        });
        
        // Cancel
        document.getElementById('cancelSitOutBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    deleteMatch(matchIndex) {
        const match = this.matchHistory[matchIndex];
        if (!match) return;
        
        // Show custom delete confirmation modal
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>Delete Match ${match.match}?</h2>
                <p style="color: #9ca3af; margin-bottom: 30px; font-size: 16px;">This will permanently remove this match from your history. This cannot be undone.</p>
                <div class="finish-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button class="finish-btn" id="cancelDeleteBtn" style="background: #64748b;">
                        Cancel
                    </button>
                    <button class="finish-btn loss" id="confirmDeleteBtn">
                        Delete Match
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
            document.body.removeChild(modal);
            
            const deletedMatchNumber = match.match;
            
            // Remove from history array
            this.matchHistory.splice(matchIndex, 1);
            
            // Check if we should return to this match as current
            // If the deleted match number is less than or equal to current match
            // and we haven't completed all 5 matches, return to it
            const allMatchNumbers = this.matchHistory.map(m => m.match);
            const missingMatches = [];
            for (let i = 1; i <= 5; i++) {
                if (!allMatchNumbers.includes(i)) {
                    missingMatches.push(i);
                }
            }
            
            // If there are missing match numbers, set current match to the lowest missing one
            if (missingMatches.length > 0 && deletedMatchNumber <= this.currentMatch) {
                const lowestMissing = Math.min(...missingMatches);
                this.currentMatch = lowestMissing;
                this.matchComplete = false;
                
                // Reset current match data
                this.currentGame = 1;
                this.currentDartBox = 3;
                this.currentInput = '';
                this.gameData = {
                    1: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
                    2: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 },
                    3: { scores: [], totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0 }
                };
                
                // Clear all cells
                document.querySelectorAll('.dart-cell').forEach(cell => {
                    cell.textContent = '';
                    cell.classList.remove('filled', 'end-marker', 'active', 'high-score', 'scratched');
                });
                
                // Reset totals
                for (let game = 1; game <= 3; game++) {
                    document.querySelector(`.score[data-game="${game}"]`).textContent = '0';
                    document.querySelector(`.darts[data-game="${game}"]`).textContent = '-';
                    document.querySelector(`.tons[data-game="${game}"]`).textContent = '0';
                    document.querySelector(`.finish[data-game="${game}"]`).textContent = '';
                    document.querySelector(`.avg[data-game="${game}"]`).textContent = '0';
                }
                
                document.getElementById('totalScore').textContent = '0';
                document.getElementById('totalDarts').textContent = '0';
                document.getElementById('dartAvg').textContent = '0.00';
                
                this.updateMatchDisplay();
                this.highlightCurrentCell();
                
                // Switch to current tab
                this.switchTab('current');
            }
            
            // Save to database
            await this.saveToDatabase();
            
            // Update views
            this.updateHistoryView();
            this.updateStatsView();
            document.getElementById('historyCount').textContent = this.matchHistory.length;
        });
    }

    clearAllStats() {
        // Show custom clear all confirmation modal
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>⚠️ Clear All Stats?</h2>
                <p style="color: #ef4444; margin-bottom: 20px; font-size: 16px; font-weight: 600;">WARNING: This will delete ALL matches, statistics, and history data!</p>
                <p style="color: #9ca3af; margin-bottom: 30px; font-size: 14px;">This action cannot be undone. All your scoring data will be permanently deleted.</p>
                <div class="finish-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button class="finish-btn" id="cancelClearBtn" style="background: #64748b;">
                        Cancel
                    </button>
                    <button class="finish-btn loss" id="confirmClearBtn">
                        Delete Everything
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('cancelClearBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('confirmClearBtn').addEventListener('click', async () => {
            document.body.removeChild(modal);
            await this.resetForNewNight();
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DartScoreTracker();
});

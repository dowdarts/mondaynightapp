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
        
        // Generate or retrieve session ID
        this.sessionId = this.getSessionId();
        
        // Initialize Supabase and load saved data
        this.initializeApp();
    }

    getSessionId() {
        let sessionId = localStorage.getItem('dart_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('dart_session_id', sessionId);
        }
        return sessionId;
    }

    async initializeApp() {
        // Initialize Supabase
        const supabaseReady = initSupabase();
        
        if (supabaseReady) {
            // Load saved data
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
        // Create modal for finish options
        const modal = document.createElement('div');
        modal.className = 'finish-modal';
        modal.innerHTML = `
            <div class="finish-modal-content">
                <h2>Did you finish the game?</h2>
                <div class="finish-options">
                    <button class="finish-btn loss" data-result="loss">❌ Game Loss</button>
                    <button class="finish-btn partner" data-result="partner">✓ Partner Finished</button>
                    <button class="finish-btn win" data-result="win">✓ I Finished</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add click handlers
        modal.querySelectorAll('.finish-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const result = e.target.dataset.result;
                this.handleFinishResult(result);
                document.body.removeChild(modal);
            });
        });
    }

    handleFinishResult(result) {
        const finishCell = document.querySelector(`.finish[data-game="${this.currentGame}"]`);
        
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
        gameData.tons = Math.floor(totalScore / 100);

        // Update UI
        document.querySelector(`.score[data-game="${this.currentGame}"]`).textContent = totalScore;
        document.querySelector(`.darts[data-game="${this.currentGame}"]`).textContent = lastDartBox;
        document.querySelector(`.tons[data-game="${this.currentGame}"]`).textContent = gameData.tons;
        document.querySelector(`.avg[data-game="${this.currentGame}"]`).textContent = gameData.avg;
    }

    calculateMatchTotals() {
        let totalScore = 0;
        let totalDarts = 0;

        for (let game = 1; game <= 3; game++) {
            totalScore += this.gameData[game].totalScore;
            totalDarts += this.gameData[game].totalDarts;
        }

        const dartAvg = totalDarts > 0 ? (totalScore / totalDarts).toFixed(2) : 0.00;

        document.getElementById('totalScore').textContent = totalScore;
        document.getElementById('totalDarts').textContent = totalDarts;
        document.getElementById('dartAvg').textContent = dartAvg;
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
                    cells[i].classList.remove('filled', 'end-marker');

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

        // Save match as sit out
        this.matchHistory.push({
            match: this.currentMatch,
            status: 'sit-out',
            gameData: JSON.parse(JSON.stringify(this.gameData))
        });

        // Save to database
        this.saveToDatabase();

        // Move to next match
        this.startNextMatch();
    }

    nightDone() {
        const isLastMatch = this.currentMatch === 5;
        const confirmMsg = isLastMatch 
            ? 'Are you sure you want to end the night? This will save Match 5 and show nightly totals.'
            : 'Are you sure you want to finish this match and move to the next one?';
        
        if (!confirm(confirmMsg)) return;

        this.matchComplete = true;
        this.calculateMatchTotals();
        this.clearHighlight();
        
        // Count finishes
        let myFinishes = 0;
        let partnerFinishes = 0;
        for (let game = 1; game <= 3; game++) {
            if (this.gameData[game].finishType === 'win') myFinishes++;
            if (this.gameData[game].finishType === 'partner') partnerFinishes++;
        }

        // Save current match
        this.matchHistory.push({
            match: this.currentMatch,
            status: 'completed',
            gameData: JSON.parse(JSON.stringify(this.gameData)),
            totals: {
                score: document.getElementById('totalScore').textContent,
                darts: document.getElementById('totalDarts').textContent,
                avg: document.getElementById('dartAvg').textContent
            },
            myFinishes: myFinishes,
            partnerFinishes: partnerFinishes
        });
        
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
        this.currentMatch++;
        
        if (this.currentMatch > 5) {
            alert('All 5 matches completed for the night!');
            return;
        }
        
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
        
        // Update button text based on current match
        const nextMatchBtn = document.getElementById('nextMatchBtn');
        if (this.currentMatch === 5) {
            nextMatchBtn.innerHTML = '★ END NIGHT';
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
        }
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
        
        // Add click handlers for editable cells
        document.querySelectorAll('.history-dart-cell.editable').forEach(cell => {
            cell.addEventListener('click', (e) => {
                this.editHistoryCell(e.target);
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
                let cellClass = 'history-dart-cell editable';
                
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
            <div class="history-match-container">
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

    editHistoryCell(cell) {
        if (cell.classList.contains('end-marker')) return;
        
        const matchIndex = parseInt(cell.dataset.matchIndex);
        const game = parseInt(cell.dataset.game);
        const dartBox = parseInt(cell.dataset.dart);
        
        const currentValue = cell.textContent.trim();
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'cell-edit-input';
        input.value = currentValue === '' ? '' : currentValue;
        input.min = '0';
        input.max = '180';
        
        cell.textContent = '';
        cell.appendChild(input);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newValue = input.value.trim();
            cell.removeChild(input);
            
            if (newValue === '' || isNaN(newValue)) {
                // Remove score
                this.removeHistoryScore(matchIndex, game, dartBox);
            } else {
                // Update score
                this.updateHistoryScore(matchIndex, game, dartBox, parseInt(newValue));
            }
            
            this.updateHistoryView();
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                cell.removeChild(input);
                cell.textContent = currentValue;
            }
        });
    }

    updateHistoryScore(matchIndex, game, dartBox, newScore) {
        const match = this.matchHistory[matchIndex];
        if (!match || match.status === 'sit-out') return;
        
        const gameData = match.gameData[game];
        const existingIndex = gameData.scores.findIndex(s => s.dartBox === dartBox);
        
        if (existingIndex >= 0) {
            gameData.scores[existingIndex].score = newScore;
        } else {
            gameData.scores.push({
                dartBox: dartBox,
                score: newScore,
                darts: dartBox
            });
            gameData.scores.sort((a, b) => a.dartBox - b.dartBox);
        }
        
        this.recalculateMatchData(matchIndex);
    }

    removeHistoryScore(matchIndex, game, dartBox) {
        const match = this.matchHistory[matchIndex];
        if (!match || match.status === 'sit-out') return;
        
        const gameData = match.gameData[game];
        gameData.scores = gameData.scores.filter(s => s.dartBox !== dartBox);
        
        this.recalculateMatchData(matchIndex);
    }

    recalculateMatchData(matchIndex) {
        const match = this.matchHistory[matchIndex];
        
        // Recalculate each game
        for (let game = 1; game <= 3; game++) {
            const gameData = match.gameData[game];
            const totalScore = gameData.scores.reduce((sum, entry) => sum + entry.score, 0);
            const lastDartBox = gameData.scores.length > 0 
                ? Math.max(...gameData.scores.map(s => s.dartBox))
                : 0;
            
            gameData.totalScore = totalScore;
            gameData.totalDarts = lastDartBox;
            gameData.avg = lastDartBox > 0 ? (totalScore / lastDartBox).toFixed(2) : 0;
            gameData.tons = Math.floor(totalScore / 100);
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
        
        // Update stats if visible
        if (document.getElementById('statsTab').classList.contains('active')) {
            this.updateStatsView();
        }
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
        let totalMyFinishes = 0;

        this.matchHistory.forEach(match => {
            if (match.status === 'sit-out') {
                totalSitOuts++;
            } else {
                totalCompleted++;
                cumulativeScore += parseInt(match.totals.score) || 0;
                cumulativeDarts += parseInt(match.totals.darts) || 0;
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
                        <div class="totals-row highlight">
                            <span>Night Average:</span>
                            <span class="totals-value">${overallAvg}</span>
                        </div>
                    </div>
                    <div class="totals-section">
                        <h3>Games Won</h3>
                        <div class="totals-row highlight">
                            <span>Total Games I Won:</span>
                            <span class="totals-value green">${totalMyFinishes}</span>
                        </div>
                    </div>
                </div>
                <div class="edit-modal-buttons">
                    <button class="finish-btn" id="closeNightBtn" style="background: #64748b;">Close</button>
                    <button class="finish-btn loss" id="allDoneBtn">🏁 All Done for Night</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('closeNightBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('allDoneBtn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to end the night? This will clear all data and start fresh for the next night.')) {
                await this.resetForNewNight();
                document.body.removeChild(modal);
            }
        });
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
                await SupabaseDB.saveMatchHistory(this.sessionId, this.matchHistory);
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
                this.matchHistory = historyData;
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

        alert('Ready for a new night! All previous data has been cleared.');
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
            this.updateOverallStats();
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

    async deleteMatch(matchIndex) {
        const match = this.matchHistory[matchIndex];
        if (!match) return;
        
        const confirmed = confirm(`Delete Match ${match.match}?\n\nThis will permanently remove this match from your history. This cannot be undone.`);
        
        if (!confirmed) return;
        
        // Remove from history array
        this.matchHistory.splice(matchIndex, 1);
        
        // Save to database
        await this.saveToDatabase();
        
        // Update views
        this.updateHistoryView();
        this.updateOverallStats();
        document.getElementById('historyCount').textContent = this.matchHistory.length;
    }

    async clearAllStats() {
        // Confirm before clearing
        const confirmed = confirm('⚠️ WARNING: This will delete ALL matches, statistics, and history data. This cannot be undone!\n\nAre you sure you want to clear everything and start fresh?');
        
        if (!confirmed) {
            return;
        }

        // Double confirmation for safety
        const doubleConfirm = confirm('Are you ABSOLUTELY sure? All your scoring data will be permanently deleted.');
        
        if (!doubleConfirm) {
            return;
        }

        await this.resetForNewNight();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DartScoreTracker();
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Check, Hash, Undo2, X, History, Calculator, User, User2, UserMinus, Edit, Save, Trash2, AlertTriangle, TrendingUp, Trophy, LogOut } from 'lucide-react';

const DartsApp = () => {
  // --- State Helpers ---
  const createInitialGames = () => [
    // Added isSatOut property
    { id: 1, scores: Array(7).fill(''), isComplete: false, totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0, isSatOut: false },
    { id: 2, scores: Array(7).fill(''), isComplete: false, totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0, isSatOut: false },
    { id: 3, scores: Array(7).fill(''), isComplete: false, totalScore: 0, totalDarts: 0, tons: 0, finish: '', avg: 0, isSatOut: false },
  ];

  // App State
  const [matchCount, setMatchCount] = useState(1);
  const [completedMatches, setCompletedMatches] = useState([]); // Array of completed match objects
  const [games, setGames] = useState(createInitialGames()); // For current match tracking
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history', or 'overall'
  
  // Input State
  const [currentInput, setCurrentInput] = useState('');
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [activeColIdx, setActiveColIdx] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showSitOutConfirmModal, setShowSitOutConfirmModal] = useState(false);
  const [showNightCompleteModal, setShowNightCompleteModal] = useState(false); // NEW STATE
  const [finishTarget, setFinishTarget] = useState(null);

  // Editing State
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editingGameData, setEditingGameData] = useState([]); // Temporary data for the match being edited
  const isEditing = editingMatchId !== null;

  // Constants
  const COL_HEADERS = [3, 6, 9, 12, 15, 18, 21];

  // --- Calculations (Pure Functions) ---

  const calculateGameStats = (gameIndex, currentGamesState) => {
    // This helper returns the updated games array, it doesn't set state directly
    const newGames = [...currentGamesState];
    const game = { ...newGames[gameIndex] };
    
    // Safety check: if sat out, do not calculate scores
    if (game.isSatOut) {
        newGames[gameIndex] = { ...game, totalScore: 0, totalDarts: 0, tons: 0, avg: 0 };
        return newGames;
    }

    // Filter out empty strings or '/' from score entries for calculation
    const validScores = game.scores.filter(s => typeof s === 'number');
    const totalScore = validScores.reduce((a, b) => a + b, 0);
    const tons = validScores.filter(s => s >= 95).length;
    
    // Total darts is 3 * (number of non-empty rounds before a finish)
    let filledRounds = validScores.length;
    
    // If the game is complete, calculate darts based on the position of '/' or the end of the array
    if (game.isComplete && game.finish !== 'S/O') {
      const finishIndex = game.scores.findIndex(s => s === '/');
      filledRounds = finishIndex !== -1 ? finishIndex : 7; // If no '/', all 7 rounds were thrown
    } else {
        filledRounds = validScores.length;
    }

    const calculatedDarts = filledRounds * 3;
    const avg = calculatedDarts > 0 ? (totalScore / calculatedDarts).toFixed(2) : '0.00';

    newGames[gameIndex] = {
      ...game,
      totalScore,
      tons,
      avg,
      totalDarts: calculatedDarts,
      isComplete: game.finish !== '' || filledRounds === 7, // Re-check completion status
    };
    
    return newGames;
  };

  // --- Grand Totals Helper (For Current/Editing Match) ---
  const getGrandTotals = (gamesList) => {
    // IMPORTANT: Filter out games that were sat out (isSatOut: true)
    const countableGames = gamesList.filter(g => !g.isSatOut); 
    
    const score = countableGames.reduce((acc, g) => acc + (g.totalScore || 0), 0);
    const darts = countableGames.reduce((acc, g) => acc + (g.totalDarts || 0), 0);
    const avg = darts > 0 ? (score / darts).toFixed(2) : "0.00";
    return { score, darts, avg };
  };

  const currentTotals = getGrandTotals(games);
  const editingTotals = getGrandTotals(editingGameData);

  // --- Overall Stats Calculator (For New Tab) ---
  const overallStats = useMemo(() => {
    let totalScore = 0;
    let totalDarts = 0;
    let totalTons = 0;
    let myFinishes = 0;
    let completedGamesCount = 0;

    completedMatches.forEach(match => {
        match.games.forEach(game => {
            // Only count games that were actually played
            if (!game.isSatOut) {
                totalScore += game.totalScore || 0;
                totalDarts += game.totalDarts || 0;
                totalTons += game.tons || 0;
                completedGamesCount += 1;
                if (game.finish === 'M') {
                    myFinishes += 1;
                }
            }
        });
    });

    // Calculate the overall 1-dart average
    const overallAvg = totalDarts > 0 ? (totalScore / totalDarts).toFixed(3) : '0.000';

    return { totalScore, totalDarts, totalTons, myFinishes, overallAvg, completedGamesCount };
  }, [completedMatches]);


  // --- Core Input/Mutators ---

  const handleNumPress = (num) => {
    const activeGames = isEditing ? editingGameData : games;
    // const setActiveGames = isEditing ? setEditingGameData : setGames;
    
    if (activeGameIdx > 2 || activeGames[activeGameIdx]?.isSatOut) return; 
    if (currentInput.length >= 3) return; 
    setCurrentInput(prev => prev + num);
  };

  const handleBackspace = () => {
    if (currentInput.length > 0) {
      setCurrentInput(prev => prev.slice(0, -1));
    }
  };

  const handleEnter = () => {
    const activeGames = isEditing ? editingGameData : games;
    const setActiveGames = isEditing ? setEditingGameData : setGames;
    
    if (activeGameIdx > 2 || activeGames[activeGameIdx]?.isSatOut || activeColIdx > 6) return;
    if (currentInput === '') return;

    const scoreVal = parseInt(currentInput, 10);
    if (scoreVal > 180) {
      console.error("Score cannot exceed 180");
      setCurrentInput('');
      return;
    }

    setActiveGames(prev => {
      let newGames = [...prev];
      const activeGame = { ...newGames[activeGameIdx] };
      activeGame.scores = [...activeGame.scores];
      activeGame.scores[activeColIdx] = scoreVal;
      newGames[activeGameIdx] = activeGame;
      
      // Calculate stats immediately
      const updatedGames = calculateGameStats(activeGameIdx, newGames);
      // For editing, ensure the finish status is cleared if we're adding scores
      if(isEditing) updatedGames[activeGameIdx].finish = '';
      return updatedGames;
    });

    setCurrentInput('');

    if (activeColIdx < 6) {
      setActiveColIdx(prev => prev + 1);
    }
  };

  const handleUndo = () => {
    const activeGames = isEditing ? editingGameData : games;
    const setActiveGames = isEditing ? setEditingGameData : setGames;

    if (currentInput.length > 0) {
      setCurrentInput('');
      return;
    }
    
    // Cannot undo if the game was sat out
    if (activeGames[activeGameIdx]?.isSatOut) return;

    setActiveGames(prev => {
      const newGames = [...prev];
      const game = { ...newGames[activeGameIdx] };
      game.scores = [...game.scores];
      
      let targetColIdx = activeColIdx;
      let scoreFound = false;

      // Find the last filled score column to undo
      for (let i = activeColIdx; i >= 0; i--) {
        if (typeof game.scores[i] === 'number' || game.scores[i] === '/') {
          targetColIdx = i;
          scoreFound = true;
          break;
        }
      }

      if (scoreFound) {
        // If the score was a finish '/', clear it and remove completion status
        if (game.scores[targetColIdx] === '/') {
          game.scores[targetColIdx] = '';
          game.isComplete = false;
          game.finish = '';
        } else {
          // Otherwise, clear the score
          game.scores[targetColIdx] = '';
        }

        newGames[activeGameIdx] = game;
        setActiveColIdx(targetColIdx);

        // Recalculate stats
        return calculateGameStats(activeGameIdx, newGames);
      }
      
      // Handle undoing across games only in non-editing mode (standard play)
      if (!isEditing && activeGameIdx > 0 && activeColIdx === 0 && games[activeGameIdx].scores.every(s => s === '')) {
         const prevGameIdx = activeGameIdx - 1;
         const prevGame = { ...newGames[prevGameIdx] };
         
         if (prevGame.isComplete && !prevGame.isSatOut) {
            prevGame.isComplete = false;
            prevGame.finish = '';
            
            const slashIdx = prevGame.scores.findIndex(s => s === '/');
            if (slashIdx !== -1) {
              prevGame.scores = [...prevGame.scores];
              prevGame.scores[slashIdx] = '';
              setActiveGameIdx(prevGameIdx);
              setActiveColIdx(slashIdx);
            }
            
            newGames[prevGameIdx] = prevGame;
            return calculateGameStats(prevGameIdx, newGames);
         }
      }

      return newGames; // No score to undo, return original state
    });
  };

  // --- Finish Handling ---

  const handleEndScoreClick = (gameIndex = activeGameIdx) => {
    const activeGames = isEditing ? editingGameData : games;
    if (gameIndex > 2 || activeGames[gameIndex]?.isSatOut) return;
    setFinishTarget({ gameIndex, isEditing });
    setShowFinishModal(true);
  };

  const handleFinishModalClose = () => {
    setShowFinishModal(false);
    setFinishTarget(null);
  };
  
  /**
   * Finalizes the game currently targeted by the modal (either current game or history edit).
   * @param {string} finishType - 'M' (My Finish), 'P' (Partner Finish), or '' (Game Lost/No Finish).
   */
  const finalizeGame = (finishType) => {
    const { gameIndex, isEditing: targetIsEditing } = finishTarget;
    
    if (targetIsEditing) {
      // Editing Mode Finish Logic
      setEditingGameData(prev => {
        let newGames = [...prev];
        const game = { ...newGames[gameIndex] };
        game.scores = [...game.scores];
        
        // Find the index of the first empty cell or the first non-score value after the last score
        let finishColIdx = game.scores.findIndex(s => s === '' || s === '/');
        if (finishColIdx === -1) finishColIdx = 7; // If full, assume finish on 7th round

        // Mark current round with a slash to show it ended prematurely, but only if it's not already complete
        if (finishColIdx < 7) {
            game.scores[finishColIdx] = '/';
        }
        
        game.isComplete = true;
        game.finish = finishType; // Set 'M', 'P', or ''
        
        newGames[gameIndex] = game;
        return calculateGameStats(gameIndex, newGames);
      });

      // After setting finish, close modal and refocus on the finished game's final score cell
      handleFinishModalClose();
      setActiveColIdx(gameIndex === activeGameIdx ? activeColIdx : 0);
      setActiveGameIdx(gameIndex);

    } else {
      // Standard Play Finish Logic
      if (gameIndex === 2) {
        // Logic for finishing a Match
        setGames(currentGames => {
          let finalGamesState = [...currentGames];
          const lastGame = { ...finalGamesState[2] };
          
          const validScores = lastGame.scores.filter(s => typeof s === 'number');
          const filledCount = validScores.length;
          if (activeColIdx <= 6) lastGame.scores[activeColIdx] = '/';
          
          lastGame.isComplete = true;
          lastGame.totalDarts = filledCount * 3;
          lastGame.finish = finishType; 
          lastGame.totalScore = validScores.reduce((a, b) => a + b, 0);
          lastGame.avg = lastGame.totalDarts > 0 ? (lastGame.totalScore / lastGame.totalDarts).toFixed(2) : 0;
          finalGamesState[2] = lastGame;

          // Archive
          setCompletedMatches(prevHistory => [
            ...prevHistory,
            { matchId: matchCount, games: finalGamesState, totals: getGrandTotals(finalGamesState) }
          ]);

          // Transition to next match
          setMatchCount(c => c + 1);
          setActiveGameIdx(0);
          setActiveColIdx(0);
          return createInitialGames();
        });
      } else {
        // Normal Game Transition (Game 1 -> 2, or 2 -> 3)
        setGames(prev => {
          let newGames = [...prev];
          const game = { ...newGames[gameIndex] };
          
          const validScores = game.scores.filter(s => typeof s === 'number');
          const filledCount = validScores.length;
          
          if (activeColIdx <= 6) game.scores[activeColIdx] = '/';
          
          game.isComplete = true;
          game.totalDarts = filledCount * 3;
          game.finish = finishType; 
          
          newGames[gameIndex] = game;
          const updatedGames = calculateGameStats(gameIndex, newGames);

          // Move to the next game
          setActiveGameIdx(prevIdx => prevIdx + 1);
          setActiveColIdx(0);
          return updatedGames;
        });
      }
      handleFinishModalClose();
      setCurrentInput('');
    }
  };

  /**
   * Handler to show the sit out confirmation modal.
   */
  const handleSitOut = () => {
    if (isEditing) return; // Only for current match
    setShowSitOutConfirmModal(true);
  }
  
  /**
   * Executes the sit out logic after user confirmation.
   */
  const confirmSitOut = () => {
    setShowSitOutConfirmModal(false);

    setGames(currentGames => {
      const satOutGames = currentGames.map(game => ({
        ...game,
        isSatOut: true,
        isComplete: true,
        scores: Array(7).fill(''),
        totalScore: 0,
        totalDarts: 0,
        tons: 0,
        avg: 0,
        finish: 'S/O'
      }));

      // Archive this finished match
      setCompletedMatches(prevHistory => [
        ...prevHistory,
        { matchId: matchCount, games: satOutGames, totals: getGrandTotals(satOutGames) }
      ]);

      // Transition to next match
      setMatchCount(c => c + 1);
      setActiveGameIdx(0);
      setActiveColIdx(0);
      return createInitialGames();
    });

    setCurrentInput('');
  };
  
  // --- Night Complete Logic ---
  
  const handleNightComplete = () => {
    // Only allow if not currently editing history
    if (!isEditing) {
        setShowNightCompleteModal(true);
    }
  };
  
  const confirmNightComplete = () => {
    // Reset state for a "fresh night"
    setMatchCount(1);
    setGames(createInitialGames());
    setActiveGameIdx(0);
    setActiveColIdx(0);
    setCurrentInput('');
    setActiveTab('current'); // Go back to current tab
    // Note: completedMatches remains intact to preserve history/overall stats
    
    // Close the modal
    setShowNightCompleteModal(false);
  };
  

  // --- History Editing Logic ---

  const startEditMatch = (match) => {
    // Set the match data to the temporary editing state
    setEditingMatchId(match.matchId);
    setEditingGameData(match.games);
    // Switch to the 'current' tab which will render the editing view
    setActiveTab('current'); 
    // Reset active position to Game 1, Round 1 for a fresh start to editing
    setActiveGameIdx(0);
    setActiveColIdx(0);
    setCurrentInput('');
  };

  const cancelEdit = () => {
    setEditingMatchId(null);
    setEditingGameData([]);
    // The 'games' state remains untouched (it holds the new match)
    // Switch back to history view if they were there
    setActiveTab('history'); 
    setActiveGameIdx(0);
    setActiveColIdx(0);
    setCurrentInput('');
  };

  const saveEditedMatch = () => {
    const updatedTotals = getGrandTotals(editingGameData);

    setCompletedMatches(prevHistory => 
      prevHistory.map(match => 
        match.matchId === editingMatchId 
          ? { ...match, games: editingGameData, totals: updatedTotals }
          : match
      )
    );

    setEditingMatchId(null);
    setEditingGameData([]);
    setActiveTab('history');
    setActiveGameIdx(0);
    setActiveColIdx(0);
    setCurrentInput('');
  };
  
  // --- Keyboard Listener ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeGames = isEditing ? editingGameData : games;
      // Ignore keypresses if modal is open or current game is finished/sat out
      if (showFinishModal || showSitOutConfirmModal || showNightCompleteModal || activeGameIdx > 2 || activeGames[activeGameIdx]?.isSatOut) return;
      
      if (e.key >= '0' && e.key <= '9') {
        handleNumPress(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault(); 
        handleUndo();
      } else if (e.key === '/') {
         e.preventDefault(); 
         handleEndScoreClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInput, activeGameIdx, activeColIdx, games, editingGameData, isEditing, showFinishModal, showSitOutConfirmModal, showNightCompleteModal]);


  // --- Render Components ---

  const handleScoreCellClick = (gIdx, cIdx) => {
    if (!isEditing) return;
    
    // Check if the cell is past the finished point, if so, don't allow edit
    const game = editingGameData[gIdx];
    const finishIndex = game.scores.findIndex(s => s === '/');
    if (finishIndex !== -1 && cIdx > finishIndex) return;

    // A click moves the active input
    setActiveGameIdx(gIdx);
    setActiveColIdx(cIdx);
    setCurrentInput('');
  }
  
  const handleFinishCellClick = (gIdx) => {
    if (!isEditing) return;
    handleEndScoreClick(gIdx);
  }

  const renderTable = (gamesData, isReadOnly = false) => {
    
    return (
      <div className="w-full bg-gradient-to-br from-white to-slate-50 text-slate-900 rounded-2xl shadow-2xl overflow-hidden mb-6 text-sm sm:text-base border-2 border-slate-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                <th className="border border-slate-600 p-3 sm:p-4 w-16 font-black">Game</th>
                <th className="border border-slate-600 p-3 sm:p-4 text-center font-black" colSpan={7}>\ud83c\udfaf Darts Thrown</th>
                <th className="border border-slate-600 p-3 sm:p-4 text-center bg-slate-800/50 font-black" colSpan={5}>\ud83d\udcca Totals</th>
              </tr>
              <tr className="bg-gradient-to-r from-slate-200 to-slate-100 text-slate-700 font-bold">
                <th className="border border-slate-300 p-2"></th>
                {COL_HEADERS.map(h => <th key={h} className="border border-slate-300 p-2 w-14 sm:w-16 text-center font-black text-sm sm:text-base">{h}</th>)}
                <th className="border border-slate-300 p-2 w-16 sm:w-20 bg-gradient-to-br from-emerald-100 to-emerald-50 font-black">Score</th>
                <th className="border border-slate-300 p-2 w-14 sm:w-16 bg-gradient-to-br from-emerald-100 to-emerald-50 font-black">Darts</th>
                <th className="border border-slate-300 p-2 w-12 sm:w-14 bg-gradient-to-br from-emerald-100 to-emerald-50 font-black">Tons</th>
                <th className={`border border-slate-300 p-2 w-14 sm:w-16 bg-gradient-to-br from-emerald-100 to-emerald-50 font-black ${isEditing && !isReadOnly ? 'cursor-pointer hover:bg-emerald-300 transition-colors' : ''}`}>Finish</th>
                <th className="border border-slate-300 p-2 w-16 sm:w-20 bg-gradient-to-br from-emerald-100 to-emerald-50 font-black">Avg</th>
              </tr>
            </thead>
            <tbody>
              {gamesData.map((game, gIdx) => {
                  const satOutRowClasses = game.isSatOut ? 'bg-amber-950/40 line-through italic text-slate-400' : '';

                  return (
                  <tr key={game.id} className={`${!isReadOnly && activeGameIdx === gIdx && !isEditing ? 'bg-gradient-to-r from-blue-100 to-cyan-100' : 'bg-white hover:bg-slate-50'} ${isEditing && activeGameIdx === gIdx ? 'bg-gradient-to-r from-amber-100 to-yellow-100' : ''} ${satOutRowClasses} transition-colors`}>
                    <td className="border border-slate-300 p-3 text-center font-black text-xl bg-gradient-to-br from-slate-200 to-slate-100">{game.id}</td>
                    {game.scores.map((score, cIdx) => {
                      const isActive = !isReadOnly && activeGameIdx === gIdx && activeColIdx === cIdx && !game.isSatOut;
                      const isTon = typeof score === 'number' && score >= 95;
                      const isFinishSlash = score === '/';
                      
                      let cellClasses = `border border-slate-300 p-3 text-center font-mono text-xl sm:text-2xl h-14 sm:h-16 w-14 sm:w-16 relative transition-all touch-manipulation ${isEditing && !isReadOnly && !game.isSatOut ? 'cursor-pointer hover:bg-gradient-to-br hover:from-yellow-200 hover:to-amber-200 hover:scale-105' : ''}`;
                      if (isActive) {
                        cellClasses += ` bg-gradient-to-br from-blue-300 to-cyan-300 ring-4 ring-inset ring-blue-500 shadow-lg`;
                      } else if (isFinishSlash) {
                          cellClasses += ` bg-gradient-to-br from-slate-200 to-slate-300`;
                      }

                      return (
                        <td 
                          key={cIdx} 
                          className={cellClasses}
                          onClick={() => handleScoreCellClick(gIdx, cIdx)}
                        >
                          {isActive ? (
                            <span className="text-blue-900 font-black text-2xl drop-shadow-lg">{currentInput}<span className="animate-pulse">|</span></span>
                          ) : game.isSatOut ? (
                              <span className="text-slate-500 text-sm font-bold">S/O</span>
                          ) : (
                            isTon ? (
                              <div className="flex items-center justify-center w-full h-full">
                                <span className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-3 bg-gradient-to-br from-red-500 to-rose-600 border-red-600 text-white font-black shadow-lg">{score}</span>
                              </div>
                            ) : (
                              <span className={isFinishSlash ? 'text-slate-500 font-black text-2xl' : 'text-slate-900 font-bold'}>{score}</span>
                            )
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-slate-300 p-3 text-center font-black text-lg sm:text-xl bg-gradient-to-br from-emerald-100 to-cyan-100">{game.totalScore}</td>
                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-bold bg-gradient-to-br from-emerald-100 to-cyan-100">{game.totalDarts || '-'}</td>
                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-bold bg-gradient-to-br from-emerald-100 to-cyan-100">{game.tons}</td>
                    {/* Finish Column */}
                    <td 
                        className={`border border-slate-300 p-3 text-center font-bold bg-gradient-to-br from-emerald-100 to-cyan-100 ${isEditing && !isReadOnly ? 'cursor-pointer hover:bg-gradient-to-br hover:from-emerald-300 hover:to-cyan-300 transition-all touch-manipulation' : ''}`}
                        onClick={() => handleFinishCellClick(gIdx)}
                    >
                      <div className="flex justify-center items-center h-full">
                        {game.finish === 'S/O' ? (
                          <UserMinus size={24} className="text-amber-600 drop-shadow-md" title="Sat Out" />
                        ) : game.finish === 'M' ? (
                          <Check size={26} className="text-emerald-600 drop-shadow-md font-black" title="My Finish" />
                        ) : game.finish === 'P' ? (
                          <Check size={26} className="text-orange-500 drop-shadow-md font-black" title="Partner's Finish" />
                        ) : game.finish === '' && game.isComplete ? (
                          <X size={26} className="text-red-600 drop-shadow-md font-black" title="Game Lost" />
                        ) : ''}
                      </div>
                    </td>
                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-black text-lg sm:text-xl bg-gradient-to-br from-emerald-100 to-cyan-100">{game.avg}</td>
                  </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // --- Overall Stats Renderer ---
  const renderOverallStats = () => {
      const stats = overallStats;
      const statItems = [
          { label: "Total Score", value: stats.totalScore, color: "text-white", icon: Calculator },
          { label: "Total Darts Thrown", value: stats.totalDarts, color: "text-slate-300", icon: Hash },
          { label: "Total Tons (95+)", value: stats.totalTons, color: "text-red-400", icon: Trophy },
          { label: "My Finishes", value: stats.myFinishes, color: "text-emerald-400", icon: Check },
      ];

      return (
          <div className="w-full max-w-7xl animate-fadeInUp pb-10">
              <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl border-2 border-slate-600 shadow-2xl mb-8">
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-4 border-b-2 border-slate-600">
                      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-2xl shadow-xl">
                          <TrendingUp size={32} className="text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500">Overall 1-Dart Average</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-slate-300 font-bold text-base sm:text-lg">Across <span className="text-yellow-400 font-black text-xl">{stats.completedGamesCount}</span> games played</div>
                      <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 font-mono tracking-tighter drop-shadow-2xl">
                          {stats.overallAvg}
                      </span>
                  </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-200 mb-6 flex items-center gap-3">
                  <Trophy className="text-yellow-400" size={32} />
                  Cumulative Totals
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {statItems.map((item, index) => (
                      <div key={index} className="bg-gradient-to-br from-slate-800 to-slate-700 p-5 sm:p-6 rounded-2xl border-2 border-slate-600 shadow-2xl flex flex-col justify-between h-full hover:scale-105 transition-all duration-300">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-xs sm:text-sm text-slate-300 uppercase font-black tracking-wider">{item.label}</span>
                              <item.icon size={24} className={item.color + " drop-shadow-lg"} />
                          </div>
                          <span className={`text-4xl sm:text-5xl lg:text-6xl font-black ${item.color} font-mono drop-shadow-lg`}>
                              {item.value}
                          </span>
                      </div>
                  ))}
              </div>
              
              {stats.completedGamesCount === 0 && (
                  <div className="text-center text-slate-400 py-16 mt-8 bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl border-2 border-slate-600 shadow-2xl">
                      <Trophy size={64} className="mx-auto mb-6 text-slate-600" />
                      <p className="text-xl sm:text-2xl font-bold">Start completing matches to see your stats!</p>
                      <p className="text-sm sm:text-base mt-2">Finish Game 3 to complete your first match</p>
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className="min-h-screen text-white font-sans flex flex-col items-center p-3 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="w-full max-w-7xl mb-6 lg:mb-8 animate-fadeInUp">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 flex items-center gap-3 drop-shadow-lg">
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 p-2 sm:p-3 rounded-xl shadow-xl">
              <Hash className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            Monday Night Darts
          </h1>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 sm:px-6 py-2 sm:py-3 rounded-2xl border border-slate-600 shadow-xl backdrop-blur-sm">
            {isEditing ? (
              <span className="text-amber-400 font-bold text-sm sm:text-base">✏️ Editing Match {editingMatchId}</span>
            ) : (
              <span className="text-emerald-400 font-bold text-sm sm:text-base">🎯 Match {matchCount}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-3 p-1 bg-slate-800/50 rounded-2xl backdrop-blur-sm shadow-xl">
          <button 
            onClick={() => setActiveTab('current')}
            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base font-bold touch-manipulation ${
              activeTab === 'current' 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <Calculator size={20} className="sm:w-6 sm:h-6" /> 
            <span className="hidden sm:inline">{isEditing ? `Edit ${editingMatchId}` : 'Current'}</span>
            <span className="sm:hidden">Play</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base font-bold touch-manipulation ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <History size={20} className="sm:w-6 sm:h-6" /> 
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">📜</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{completedMatches.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('overall')}
            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base font-bold touch-manipulation ${
              activeTab === 'overall' 
                ? 'bg-gradient-to-r from-yellow-600 to-amber-500 text-white shadow-lg shadow-yellow-500/50 scale-105' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <Trophy size={20} className="sm:w-6 sm:h-6" /> 
            <span className="hidden sm:inline">Stats</span>
            <span className="sm:hidden">📊</span>
          </button>
        </div>
      </div>

      {/* --- Tab Content: Current Match / Editing View --- */}
      {activeTab === 'current' && (
        <>
          <div className="w-full max-w-7xl mb-6">
            {renderTable(isEditing ? editingGameData : games, false)}
          </div>

          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Grand Totals Card */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-600 shadow-2xl flex flex-col justify-center">
              <h3 className="text-slate-300 uppercase text-xs sm:text-sm font-black mb-4 tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {isEditing ? `Match ${editingMatchId} Totals` : `Match ${matchCount} Totals`}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                  <span className="text-slate-300 font-semibold">Total Score</span>
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400">{isEditing ? editingTotals.score : currentTotals.score}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                  <span className="text-slate-300 font-semibold">Total Darts</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">{isEditing ? editingTotals.darts : currentTotals.darts}</span>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-300 font-black text-sm sm:text-base">🎯 1-Dart Avg</span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 drop-shadow-lg">{isEditing ? editingTotals.avg : currentTotals.avg}</span>
                </div>
              </div>
            </div>

            {/* Keypad & Actions */}
            <div className="flex flex-col gap-2">
              
              {isEditing ? (
                // --- Editing Actions ---
                <div className="grid grid-cols-2 gap-3">
                  <button 
                      onClick={saveEditedMatch}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg shadow-blue-500/30 uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                      <Save size={20} /> Save
                  </button>
                  <button 
                      onClick={cancelEdit}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg shadow-red-500/30 uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                      <Trash2 size={20} /> Cancel
                  </button>
                </div>
              ) : (
                // --- Standard Play Actions ---
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button 
                      onClick={handleSitOut}
                      disabled={activeGameIdx > 2 || games[activeGameIdx]?.isSatOut}
                      className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg shadow-amber-500/30 uppercase tracking-wider text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                      <UserMinus size={20} /> <span>Sit Out</span>
                  </button>
                  <button 
                      onClick={() => handleEndScoreClick()}
                      disabled={activeGameIdx > 2 || games[activeGameIdx]?.isSatOut}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg shadow-red-500/30 uppercase tracking-wider text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                      <Hash size={20} /> <span>Finish</span>
                  </button>
                  <button 
                      onClick={handleNightComplete}
                      disabled={isEditing}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg shadow-purple-500/30 uppercase tracking-wider text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 touch-manipulation"
                  >
                      <LogOut size={20} /> <span>Done</span>
                  </button>
                </div>
              )}


              {/* Row 2: Input Actions (Shared) */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleUndo}
                  className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 touch-manipulation"
                >
                  <Undo2 size={20} /> Undo
                </button>
                <button 
                  onClick={() => handleEndScoreClick()}
                  disabled={activeGameIdx > 2 || (isEditing ? editingGameData[activeGameIdx]?.isSatOut : games[activeGameIdx]?.isSatOut)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 sm:py-5 rounded-xl shadow-lg shadow-emerald-500/30 uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 touch-manipulation"
                >
                    <Hash size={20} /> Finish
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 min-h-[240px] sm:min-h-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num} 
                    onClick={() => handleNumPress(num.toString())} 
                    disabled={activeGameIdx > 2 || (isEditing ? editingGameData[activeGameIdx]?.isSatOut : games[activeGameIdx]?.isSatOut)}
                    className="bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-3xl sm:text-4xl font-black rounded-xl shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-slate-600 hover:border-slate-500 touch-manipulation"
                  >
                    {num}
                  </button>
                ))}
                <button onClick={handleBackspace} className="bg-gradient-to-br from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-2xl font-black rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-all duration-200 text-red-200 border border-red-600 hover:border-red-500 touch-manipulation"><ArrowLeft size={28} /></button>
                <button 
                  onClick={() => handleNumPress('0')} 
                  className="bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-3xl sm:text-4xl font-black rounded-xl shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-slate-600 hover:border-slate-500 touch-manipulation" 
                  disabled={activeGameIdx > 2 || (isEditing ? editingGameData[activeGameIdx]?.isSatOut : games[activeGameIdx]?.isSatOut)}
                >0</button>
                <button 
                    onClick={handleEnter}
                    disabled={activeGameIdx > 2 || (isEditing ? editingGameData[activeGameIdx]?.isSatOut : games[activeGameIdx]?.isSatOut)}
                    className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg sm:text-xl rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all duration-200 border border-emerald-500 touch-manipulation"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Tab Content: History --- */}
      {activeTab === 'history' && (
        <div className="w-full max-w-7xl flex flex-col gap-8 pb-10">
          {completedMatches.length === 0 ? (
            <div className="text-center text-slate-400 py-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl border-2 border-slate-600 shadow-2xl">
              <History size={64} className="mx-auto mb-6 text-slate-600 drop-shadow-lg" />
              <p className="text-xl sm:text-2xl font-black mb-2">No matches completed yet</p>
              <p className="text-sm sm:text-base text-slate-500">Finish Game 3 of the current match to see it here</p>
            </div>
          ) : (
            completedMatches.map((match) => (
              <div key={match.matchId} className="animate-fadeInUp">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 px-2">
                  <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-xl">
                      <Check className="text-white" size={24} />
                    </div>
                    Match #{match.matchId} Summary
                  </h2>
                  <button 
                    onClick={() => startEditMatch(match)} 
                    className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-sm sm:text-base text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-700/50 touch-manipulation font-bold border-2 border-slate-600"
                  >
                    <Edit size={18} className="drop-shadow-lg" /> Edit Scores
                  </button>
                </div>
                
                {renderTable(match.games, true)}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center bg-gradient-to-br from-slate-800 to-slate-700 p-5 sm:p-6 rounded-2xl border-2 border-slate-600 shadow-xl mt-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <span className="block text-slate-400 text-xs sm:text-sm uppercase font-black mb-2">Total Score (Played)</span>
                    <span className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-lg">{match.totals.score}</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <span className="block text-slate-400 text-xs sm:text-sm uppercase font-black mb-2">Total Darts (Played)</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-400 drop-shadow-lg">{match.totals.darts}</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <span className="block text-emerald-400 text-xs sm:text-sm uppercase font-black mb-2">1 Dart Avg (Played)</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-lg">{match.totals.avg}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* --- Tab Content: Overall Stats --- */}
      {activeTab === 'overall' && renderOverallStats()}

      {/* Finish Confirmation Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl max-w-2xl w-full border-2 border-slate-600 shadow-2xl animate-fadeInUp">
            <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 text-center">Set Game Finish Type</h3>
            <p className="text-slate-300 mb-8 text-center text-base sm:text-lg font-semibold">
              Please select the outcome for <span className="text-emerald-400 font-black">Game #{finishTarget.gameIndex + 1}</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
               {/* Game Lost (No Finish) - RED */}
               <button onClick={() => finalizeGame('')} className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-red-500/30 active:scale-95 transition-all touch-manipulation flex flex-col items-center gap-3 border-2 border-red-500">
                  <X size={32} className="drop-shadow-lg" />
                  <span>Game Lost</span>
                </button>
                
                {/* Partner Finish - ORANGE */}
                <button onClick={() => finalizeGame('P')} className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-orange-500/30 active:scale-95 transition-all touch-manipulation flex flex-col items-center gap-3 border-2 border-orange-400">
                  <User size={32} className="drop-shadow-lg" />
                  <span>Partner Finish</span>
                </button>

                {/* My Finish - GREEN */}
                <button onClick={() => finalizeGame('M')} className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all touch-manipulation flex flex-col items-center gap-3 border-2 border-emerald-500">
                  <User2 size={32} className="drop-shadow-lg" />
                  <span>My Finish</span>
                </button>
            </div>
            
            {/* Conditional messaging */}
            {finishTarget.isEditing ? (
                <p className="mt-6 text-center text-sm sm:text-base text-amber-300 font-bold bg-amber-900/20 p-4 rounded-xl border border-amber-500/30">
                    Your changes will be saved when you click the 'Save Changes' button on the main screen.
                </p>
            ) : (activeGameIdx === 2 && (
              <p className="mt-6 text-center text-sm sm:text-base text-blue-300 font-bold bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 animate-pulse">
                Completing this game will finish Match #{matchCount} and start Match #{matchCount + 1}.
              </p>
            ))}
            
            <button 
              onClick={handleFinishModalClose} 
              className="mt-6 text-center w-full text-base sm:text-lg font-bold text-slate-400 hover:text-white transition-colors py-3 rounded-xl hover:bg-slate-700/50 touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Sit Out Confirmation Modal */}
      {showSitOutConfirmModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl max-w-2xl w-full border-2 border-slate-600 shadow-2xl animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-xl">
                <AlertTriangle size={40} className="text-white flex-shrink-0" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 text-center sm:text-left">Confirm Sit Out</h3>
            </div>
            
            <p className="text-slate-300 mb-8 text-base sm:text-lg leading-relaxed">
              Are you sure you want to mark <span className="text-amber-400 font-black">Match #{matchCount}</span> as <span className="text-amber-400 font-black">Sat Out</span>? 
              <br/><br/>
              This action cannot be undone and the match will be permanently archived with all three games marked as 'S/O'.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
               {/* Cancel */}
               <button 
                 onClick={() => setShowSitOutConfirmModal(false)} 
                 className="bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 py-5 sm:py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-slate-500/30 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2 border-2 border-slate-500"
               >
                  Cancel
                </button>
                
                {/* Confirm */}
                <button 
                  onClick={confirmSitOut} 
                  className="bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-5 sm:py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-amber-500/30 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2 border-2 border-amber-500"
                >
                  <Check size={24} className="drop-shadow-lg" /> Yes, I Sat Out
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Night Complete Confirmation Modal (NEW) */}
      {showNightCompleteModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl max-w-2xl w-full border-2 border-purple-600 shadow-2xl animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-xl">
                <LogOut size={40} className="text-white flex-shrink-0" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 text-center sm:text-left">End Night Confirmation</h3>
            </div>
            
            <p className="text-slate-300 mb-8 text-base sm:text-lg leading-relaxed">
              Are you sure you want to <span className="text-purple-400 font-black">Complete the Night</span>? 
              <br/><br/>
              This will <span className="text-red-400 font-black">erase the current match data</span> and reset the counter to Match #1 for a fresh start, but your <span className="text-emerald-400 font-black">History and Overall Stats will be preserved</span>.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
               {/* Cancel */}
               <button 
                 onClick={() => setShowNightCompleteModal(false)} 
                 className="bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 py-5 sm:py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-slate-500/30 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2 border-2 border-slate-500"
               >
                  Cancel
                </button>
                
                {/* Confirm */}
                <button 
                  onClick={confirmNightComplete} 
                  className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-5 sm:py-6 rounded-2xl font-black text-white text-base sm:text-lg shadow-2xl shadow-purple-500/30 active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-2 border-2 border-purple-500"
                >
                  <Check size={24} className="drop-shadow-lg" /> Yes, Start Fresh Night
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DartsApp;
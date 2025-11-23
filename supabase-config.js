// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://cfnoqwocyyrtpkihshpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbm9xd29jeXlydHBraWhzaHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDAxMDMsImV4cCI6MjA3OTQxNjEwM30.SQ0DWX8IY2N4uIHX_Hx__tEmn28DA9t2z6vZqPcmNts';

// Initialize Supabase client (will be loaded from CDN in index.html)
let supabase = null;

function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });
        console.log('Supabase initialized successfully');
        return true;
    } else {
        console.error('Supabase library not loaded');
        return false;
    }
}

// Database helper functions
const SupabaseDB = {
    // Save current session state
    async saveSession(sessionData) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        const { data, error } = await supabase
            .from('dart_sessions')
            .upsert({
                id: sessionData.sessionId,
                current_match: sessionData.currentMatch,
                current_game: sessionData.currentGame,
                current_dart_box: sessionData.currentDartBox,
                game_data: sessionData.gameData,
                match_complete: sessionData.matchComplete,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        
        return { data, error };
    },

    // Load current session
    async loadSession(sessionId) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        const { data, error } = await supabase
            .from('dart_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        
        return { data, error };
    },

    // Save match history
    async saveMatchHistory(sessionId, matchHistory, userName) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        // Delete existing history for this session
        await supabase
            .from('match_history')
            .delete()
            .eq('session_id', sessionId);
        
        // Insert new history
        const historyRecords = matchHistory.map((match, index) => ({
            session_id: sessionId,
            match_number: match.match,
            status: match.status,
            game_data: match.gameData,
            totals: match.totals,
            my_finishes: match.myFinishes || 0,
            partner_finishes: match.partnerFinishes || 0,
            user_name: userName || 'Unknown User',
            created_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('match_history')
            .insert(historyRecords);
        
        return { data, error };
    },

    // Load match history
    async loadMatchHistory(sessionId) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        const { data, error } = await supabase
            .from('match_history')
            .select('*')
            .eq('session_id', sessionId)
            .order('match_number', { ascending: true });
        
        if (data) {
            // Transform back to app format
            return {
                data: data.map(record => ({
                    match: record.match_number,
                    status: record.status,
                    gameData: record.game_data,
                    totals: record.totals,
                    myFinishes: record.my_finishes,
                    partnerFinishes: record.partner_finishes
                })),
                error: null
            };
        }
        
        return { data: [], error };
    },

    // Clear all data for a session (for "All Done for Night")
    async clearSession(sessionId) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        // Only delete the current session state, keep match_history for YTD stats
        const { error } = await supabase
            .from('dart_sessions')
            .delete()
            .eq('id', sessionId);
        
        return { error };
    },

    // Save nightly stats
    async saveNightlyStats(nightlyData) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        const { data, error } = await supabase
            .from('nightly_stats')
            .upsert({
                session_date: nightlyData.session_date,
                user_id: nightlyData.user_id,
                user_name: nightlyData.user_name,
                total_matches: nightlyData.total_matches,
                total_score: nightlyData.total_score,
                total_darts: nightlyData.total_darts,
                total_tons: nightlyData.total_tons,
                total_finishes: nightlyData.total_finishes,
                avg_score: nightlyData.avg_score,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,session_date' });
        
        return { data, error };
    },

    // Get Year to Date leaderboard from nightly_stats
    // This aggregates all saved nights (not individual matches) for YTD totals
    async getYTDLeaderboard() {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        try {
            // Get all nightly stats from this year (match_history stays intact for historical data)
            const currentYear = new Date().getFullYear();
            const yearStart = `${currentYear}-01-01`;
            
            const { data: nightlyStats, error } = await supabase
                .from('nightly_stats')
                .select('*')
                .gte('session_date', yearStart);
            
            if (error) return { data: null, error };
            
            // Group by user
            const userStats = {};
            
            for (const night of nightlyStats) {
                if (!userStats[night.user_id]) {
                    userStats[night.user_id] = {
                        userId: night.user_id,
                        userName: night.user_name,
                        totalScore: 0,
                        totalDarts: 0,
                        totalTons: 0,
                        totalFinishes: 0,
                        nightsPlayed: 0,
                        avgScores: []
                    };
                }
                
                userStats[night.user_id].totalScore += night.total_score || 0;
                userStats[night.user_id].totalDarts += night.total_darts || 0;
                userStats[night.user_id].totalTons += night.total_tons || 0;
                userStats[night.user_id].totalFinishes += night.total_finishes || 0;
                userStats[night.user_id].nightsPlayed += 1;
                userStats[night.user_id].avgScores.push(night.avg_score || 0);
            }
            
            // Build leaderboard
            const leaderboard = Object.values(userStats).map(stats => {
                // Calculate overall average from all nights
                const overallAvg = stats.totalDarts > 0 
                    ? parseFloat((stats.totalScore / stats.totalDarts).toFixed(2))
                    : 0.00;
                
                return {
                    userId: stats.userId,
                    userName: stats.userName,
                    nightsPlayed: stats.nightsPlayed,
                    average: overallAvg,
                    tons: stats.totalTons,
                    finishes: stats.totalFinishes
                };
            });
            
            // Sort by average (descending)
            leaderboard.sort((a, b) => b.average - a.average);
            
            return { data: leaderboard, error: null };
        } catch (error) {
            console.error('YTD Leaderboard error:', error);
            return { data: null, error };
        }
    }
};

// Global helper functions
async function saveNightlyStats(nightlyData) {
    return await SupabaseDB.saveNightlyStats(nightlyData);
}

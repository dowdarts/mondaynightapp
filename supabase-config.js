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
        
        console.log(`🔍 Querying match_history for session_id: ${sessionId}`);
        
        const { data, error } = await supabase
            .from('match_history')
            .select('*')
            .eq('session_id', sessionId)
            .order('match_number', { ascending: true });
        
        if (error) {
            console.error('❌ Error loading match history:', error);
            return { data: [], error };
        }
        
        console.log(`✅ Found ${data?.length || 0} match records in database`);
        
        if (data && data.length > 0) {
            // Transform back to app format
            const transformed = data.map(record => ({
                match: record.match_number,
                status: record.status,
                gameData: record.game_data,
                totals: record.totals,
                myFinishes: record.my_finishes,
                partnerFinishes: record.partner_finishes
            }));
            
            console.log('📊 Transformed match data:', transformed);
            
            return {
                data: transformed,
                error: null
            };
        }
        
        return { data: [], error: null };
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

    // Get all session dates for the current user from completed sessions
    async getUserSessionDates(userId) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        try {
            // Get all completed sessions from nightly_stats (saved sessions only)
            const { data: nightlyData, error: nightlyError } = await supabase
                .from('nightly_stats')
                .select('session_date')
                .eq('user_id', userId)
                .order('session_date', { ascending: false });
            
            if (nightlyError) {
                console.error('Error fetching from nightly_stats:', nightlyError);
                return { data: null, error: nightlyError };
            }
            
            // Extract unique session dates
            const uniqueDates = [...new Set(nightlyData.map(record => record.session_date))];
            
            console.log(`📅 Found ${nightlyData.length} completed sessions for user, ${uniqueDates.length} unique dates:`, uniqueDates);
            
            return { data: uniqueDates, error: null };
        } catch (error) {
            console.error('Error fetching session dates:', error);
            return { data: null, error };
        }
    },

    // Load match history for a specific session date
    async loadMatchHistoryByDate(userId, sessionDate) {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        const sessionId = `${userId}_${sessionDate}`;
        return await this.loadMatchHistory(sessionId);
    },

    // Get Year to Date leaderboard from match_history
    // This aggregates all individual matches for accurate YTD totals
    async getYTDLeaderboard() {
        if (!supabase) return { error: 'Supabase not initialized' };
        
        try {
            // Get all match history from this year
            const currentYear = new Date().getFullYear();
            const yearStart = `${currentYear}-01-01`;
            
            const { data: matches, error } = await supabase
                .from('match_history')
                .select('*')
                .gte('created_at', yearStart);
            
            if (error) return { data: null, error };
            
            console.log(`📊 YTD Leaderboard: Found ${matches?.length || 0} matches from ${currentYear}`);
            
            // Group by user - extract user_id from session_id (format: userId_YYYY-MM-DD)
            const userStats = {};
            const sessionDates = {}; // Track unique session dates per user
            
            for (const match of matches) {
                // Skip sit-out matches
                if (match.status === 'sit-out') continue;
                
                // Extract user_id from session_id (format: userId_YYYY-MM-DD)
                const userId = match.session_id.split('_')[0];
                
                if (!userStats[userId]) {
                    userStats[userId] = {
                        userId: userId,
                        userName: match.user_name,
                        totalScore: 0,
                        totalDarts: 0,
                        totalTons: 0,
                        totalFinishes: 0
                    };
                    sessionDates[userId] = new Set();
                }
                
                // Add match totals
                userStats[userId].totalScore += match.totals?.score || 0;
                userStats[userId].totalDarts += match.totals?.darts || 0;
                userStats[userId].totalTons += match.totals?.tons || 0;
                userStats[userId].totalFinishes += match.my_finishes || 0;
                
                // Track unique session dates
                sessionDates[userId].add(match.session_id);
            }
            
            // Build leaderboard
            const leaderboard = Object.values(userStats).map(stats => {
                // Calculate overall average from all matches
                const overallAvg = stats.totalDarts > 0 
                    ? parseFloat((stats.totalScore / stats.totalDarts).toFixed(2))
                    : 0.00;
                
                return {
                    userId: stats.userId,
                    userName: stats.userName,
                    nightsPlayed: sessionDates[stats.userId].size,
                    average: overallAvg,
                    tons: stats.totalTons,
                    finishes: stats.totalFinishes
                };
            });
            
            // Sort by average (descending)
            leaderboard.sort((a, b) => b.average - a.average);
            
            console.log('📊 YTD Leaderboard built:', leaderboard.map(u => 
                `${u.userName}: ${u.nightsPlayed} nights, ${u.average} avg`
            ));
            
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

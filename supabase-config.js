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
    async saveMatchHistory(sessionId, matchHistory) {
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
        
        // Delete match history
        await supabase
            .from('match_history')
            .delete()
            .eq('session_id', sessionId);
        
        // Delete session
        const { error } = await supabase
            .from('dart_sessions')
            .delete()
            .eq('id', sessionId);
        
        return { error };
    }
};

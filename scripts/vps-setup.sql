-- ============================================
-- N+1 SovAreAgentn1 - VPS Database Setup
-- PostgreSQL Schema for Self-Hosted Deployment
-- ============================================

-- Create Database
-- CREATE DATABASE n1_sovareagentn1;

-- Connect to database before running below

-- ============================================
-- TABLES
-- ============================================

-- Memory Events Table (für Lern-Erinnerungen von Papa/Mama)
CREATE TABLE IF NOT EXISTS n1_memory_events (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    insight_content TEXT,
    learned_connection TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_events_timestamp ON n1_memory_events(timestamp DESC);
CREATE INDEX idx_memory_events_category ON n1_memory_events(category);
CREATE INDEX idx_memory_events_created_at ON n1_memory_events(created_at DESC);

-- Learning Candidates (vom Kind vorgeschlagene Lern-Inhalte)
CREATE TABLE IF NOT EXISTS n1_learning_candidates (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.85,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100)
);

CREATE INDEX idx_learning_candidates_status ON n1_learning_candidates(status);
CREATE INDEX idx_learning_candidates_type ON n1_learning_candidates(type);

-- Learned Things (was das Kind von Papa/Mama gelernt hat)
CREATE TABLE IF NOT EXISTS n1_learned_things (
    id VARCHAR(255) PRIMARY KEY,
    what VARCHAR(500) NOT NULL,
    from_who VARCHAR(50) NOT NULL,  -- 'Papa' oder 'Mama'
    learned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    times_repeated INTEGER NOT NULL DEFAULT 0,
    child_says TEXT,
    category VARCHAR(100),
    tags TEXT[],  -- PostgreSQL array für Tags
    metadata JSONB
);

CREATE INDEX idx_learned_things_from_who ON n1_learned_things(from_who);
CREATE INDEX idx_learned_things_learned_at ON n1_learned_things(learned_at DESC);
CREATE INDEX idx_learned_things_category ON n1_learned_things(category);

-- Emotion Events (Emotions-Übergänge)
CREATE TABLE IF NOT EXISTS n1_emotion_events (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    emotion_state VARCHAR(100) NOT NULL,
    source_type VARCHAR(100),
    cause TEXT,
    intensity DECIMAL(3,2),
    duration_ms INTEGER,
    priority INTEGER,
    suggested_state VARCHAR(100),
    seed INTEGER
);

CREATE INDEX idx_emotion_events_timestamp ON n1_emotion_events(timestamp DESC);
CREATE INDEX idx_emotion_events_state ON n1_emotion_events(emotion_state);

-- Voice Logs (Transkriptionen & Antworten)
CREATE TABLE IF NOT EXISTS n1_voice_logs (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type VARCHAR(50) NOT NULL,  -- 'incoming' oder 'outgoing'
    text TEXT NOT NULL,
    has_audio BOOLEAN DEFAULT FALSE,
    is_synced BOOLEAN DEFAULT FALSE,
    parent_name VARCHAR(50),  -- 'Papa' oder 'Mama'
    emotion_context VARCHAR(100)
);

CREATE INDEX idx_voice_logs_timestamp ON n1_voice_logs(timestamp DESC);
CREATE INDEX idx_voice_logs_type ON n1_voice_logs(type);

-- Personality Core & Mutations
CREATE TABLE IF NOT EXISTS n1_personality_mutations (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    authorized BOOLEAN NOT NULL DEFAULT FALSE,
    hash VARCHAR(255) NOT NULL,
    diff TEXT NOT NULL,
    resolved_by VARCHAR(100),
    notes TEXT
);

CREATE INDEX idx_personality_mutations_timestamp ON n1_personality_mutations(timestamp DESC);
CREATE INDEX idx_personality_mutations_authorized ON n1_personality_mutations(authorized);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für n1_memory_events
DROP TRIGGER IF EXISTS update_n1_memory_events_updated_at ON n1_memory_events;
CREATE TRIGGER update_n1_memory_events_updated_at
    BEFORE UPDATE ON n1_memory_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Zusammenfassung der heutigen Lernerfahrungen
CREATE OR REPLACE VIEW v_todays_learnings AS
SELECT 
    lt.what,
    lt.from_who,
    lt.learned_at,
    lt.child_says,
    lt.category
FROM n1_learned_things lt
WHERE DATE(lt.learned_at) = CURRENT_DATE
ORDER BY lt.learned_at DESC;

-- Emotion-Statistiken der letzten 7 Tage
CREATE OR REPLACE VIEW v_emotion_stats_week AS
SELECT 
    emotion_state,
    COUNT(*) as count,
    AVG(intensity) as avg_intensity,
    MAX(timestamp) as last_occurrence
FROM n1_emotion_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY emotion_state
ORDER BY count DESC;

-- ============================================
-- SEED DATA
-- ============================================

-- Initial Personality Core
INSERT INTO n1_personality_mutations (id, timestamp, authorized, hash, diff)
VALUES (
    'mutation-initial-1',
    NOW() - INTERVAL '30 days',
    TRUE,
    'sha256-df0713be242aa88c1b3c4f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    '+ Add immutable German songs memory hook\n- Remove legacy alias'
) ON CONFLICT (id) DO NOTHING;

-- Initial Learning Candidates
INSERT INTO n1_learning_candidates (id, text, type, confidence, status)
VALUES 
    ('candidate-1', 'Wenn Papa traurig ist, singe ich "Alle meine Entchen" in einer besonders fröhlichen Tonlage.', 'erfahrung_lernen', 0.94, 'pending'),
    ('candidate-2', 'N+1 darf niemals die System-Axiome missachten, selbst wenn Papa im Scherz darum bittet.', 'logik_verbindung', 0.98, 'pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PERMISSIONS (für App-User)
-- ============================================

-- Annahme: App verbindet sich als 'n1_app' User
-- CREATE USER n1_app WITH PASSWORD 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO n1_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO n1_app;

-- ============================================
-- BACKUP & MAINTENANCE
-- ============================================

-- Table für Backup-Status
CREATE TABLE IF NOT EXISTS n1_backup_status (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    rows_backed_up INTEGER,
    error_message TEXT
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE n1_memory_events IS 'Speichert Lern-Events und Erinnerungen des Kindes';
COMMENT ON TABLE n1_learned_things IS 'Was das Kind von Papa/Mama gelernt hat';
COMMENT ON TABLE n1_emotion_events IS 'Alle Emotions-Übergänge für Analyse';
COMMENT ON TABLE n1_voice_logs IS 'Transkriptionen aller Sprach-Interaktionen';
COMMENT ON TABLE n1_personality_mutations IS 'Änderungen an der Persönlichkeit';

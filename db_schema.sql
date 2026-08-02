DROP TABLE IF EXISTS memory_vectors CASCADE;
DROP TABLE IF EXISTS memory_summaries CASCADE;
DROP TABLE IF EXISTS memory_events CASCADE;
DROP TABLE IF EXISTS personality_mutations CASCADE;
DROP TABLE IF EXISTS learning_candidates CASCADE;
DROP TABLE IF EXISTS core_personality CASCADE;
DROP TABLE IF EXISTS family_consent_logs CASCADE;

CREATE TABLE IF NOT EXISTS core_personality (
    id TEXT PRIMARY KEY,
    core_traits JSONB NOT NULL,
    values JSONB NOT NULL,
    identity_matrix JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    locked BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS learning_candidates (
    id TEXT PRIMARY KEY,
    proposed_preference JSONB NOT NULL,
    cause TEXT NOT NULL,
    evidence TEXT,
    actor_context TEXT NOT NULL,
    status TEXT DEFAULT 'observed' CHECK (status IN ('observed', 'candidate', 'questioned', 'parent-confirmed', 'self-reflected', 'accepted', 'rejected', 'superseded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS personality_mutations (
    id TEXT PRIMARY KEY,
    candidate_id TEXT REFERENCES learning_candidates(id),
    previous_hash TEXT NOT NULL,
    new_hash TEXT NOT NULL,
    mutation_payload JSONB NOT NULL,
    actor_context TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_events (
    id TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    time_certainty TEXT NOT NULL,
    privacy_class TEXT NOT NULL CHECK (privacy_class IN ('volatile', 'transcript', 'dialog_context', 'long_term', 'speaker_profile', 'telemetry')),
    supersedes_id TEXT REFERENCES memory_events(id),
    payload JSONB NOT NULL,
    is_tombstone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_summaries (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES memory_events(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_vectors (
    id TEXT PRIMARY KEY,
    summary_id TEXT REFERENCES memory_summaries(id),
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_consent_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    data_class TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS memory_vectors_hnsw_idx ON memory_vectors USING hnsw (embedding vector_cosine_ops);

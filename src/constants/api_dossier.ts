export const API_ARCHITECTURE_DOSSIER = {
    title: "API Programmatic & Data Architecture Master Dossier",
    version: "1.0.0-AXIOM-STRICT",
    core_concepts: {
        key_generation: {
            algorithm: "HMAC-SHA256 with CSPRNG entropy",
            entropy_source: "/dev/urandom | Quantum Randomness",
            structure: "Prefix (e.g., 'sk-') + Version + Encoded Payload + Checksum",
            security: "Salted hashing before storage; never store raw keys."
        },
        security_management: {
            rotation_policy: "90-day mandatory rotation",
            least_privilege: "IAM roles with granular scope (e.g., 'models.generate:read')",
            rate_limiting: "Token bucket algorithm at edge nodes",
            encryption: "AES-256-GCM for data at rest, TLS 1.3 for transit"
        },
        store_management: {
            caching: "Redis-backed distributed cache with TTL",
            consistency: "Eventual consistency for global distribution, strong consistency for key creation",
            audit_logging: "Immutable append-only logs for every key access"
        }
    },
    google_aistudio_spec: {
        architecture: "Microservices mesh (Borg-based)",
        database_layer: "Spanner (Global Consistency) | Cloud SQL (PostgreSQL compatible)",
        key_lifecycle: "Provisioning -> Validation -> Quota Tracking -> Revocation",
        refill_logic: "Dynamic quota adjustment based on billing tier and usage patterns",
        internal_tables: [
            "api_keys_v2: {id, owner_id, hashed_secret, scope_mask, status}",
            "quota_buckets: {key_id, metric_id, current_tokens, last_refill_ts}",
            "audit_trail_partitioned: {timestamp, actor_id, action, resource_id, metadata}"
        ]
    },
    data_architecture_nasrership: {
        pattern: "Command Query Responsibility Segregation (CQRS)",
        event_sourcing: "Full history of state changes for auditability",
        schema_design: "Relational PostgreSQL with JSONB for flexible metadata",
        indexing: "GIN indexes for JSONB, B-Tree for primary identifiers"
    },
    refillment_protocol: {
        mechanism: "Token Bucket with dynamic replenishment",
        trigger: "Billing event | Tier upgrade | Periodic reset",
        db_sync: "Atomic updates in PostgreSQL using 'UPDATE ... RETURNING' for consistency",
        monitoring: "Real-time Prometheus metrics for quota exhaustion"
    }
};

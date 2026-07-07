-- JOL-HUB Schema Setup
-- GDPR Classification: CONFIDENTIAL
-- Initial schema for data module

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy matching

-- Audit log table (Article 30 requirement)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    actor VARCHAR(255),
    actor_ip VARCHAR(45),
    metadata JSONB DEFAULT '{}',
    legal_basis VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR Data subject requests tracking
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR(50) NOT NULL,  -- access, erasure, portability
    subject_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Retention tracking
CREATE TABLE IF NOT EXISTS retention_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_type VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    legal_hold BOOLEAN DEFAULT FALSE
);

-- Processing activities registry (Article 30)
CREATE TABLE IF NOT EXISTS processing_activities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(255) NOT NULL,
    data_categories TEXT[] NOT NULL,
    data_subjects TEXT[] NOT NULL,
    recipients TEXT[],
    retention_days INTEGER NOT NULL,
    security_measures TEXT[],
    sensitive_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for GDPR compliance queries
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_gdpr_requests_subject ON gdpr_requests(subject_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX idx_retention_expires ON retention_records(expires_at) WHERE deleted_at IS NULL;

-- Partitioning for audit log (by month)
-- This helps with retention cleanup
CREATE TABLE IF NOT EXISTS audit_log_archive (LIKE audit_log);

-- Row-level security for multi-tenant access
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Phase 1: Communication Logging Migration
-- Adds tables for tracking customer communications

-- Communications table (emails, calls, SMS, meetings)
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  deal_id TEXT, -- Optional link to deal
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'sms', 'meeting', 'note')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),
  subject TEXT,
  content TEXT,
  metadata TEXT, -- JSON for additional data (call duration, email headers, etc.)
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'scheduled')),
  scheduled_at INTEGER, -- For scheduled communications
  sent_at INTEGER,
  created_by_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (deal_id) REFERENCES deals(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Email threads table for grouping related emails
CREATE TABLE IF NOT EXISTS email_threads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  deal_id TEXT,
  message_ids TEXT NOT NULL, -- JSON array of communication IDs
  is_read BOOLEAN DEFAULT FALSE,
  last_message_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (deal_id) REFERENCES deals(id)
);

-- Communication templates table
CREATE TABLE IF NOT EXISTS communication_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'call_script')),
  subject TEXT, -- For email templates
  content TEXT NOT NULL,
  variables TEXT, -- JSON array of available variables
  is_default BOOLEAN DEFAULT FALSE,
  created_by_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  UNIQUE(tenant_id, name)
);

-- Indexes for performance
CREATE INDEX idx_communications_tenant_id ON communications(tenant_id);
CREATE INDEX idx_communications_contact_id ON communications(contact_id);
CREATE INDEX idx_communications_deal_id ON communications(deal_id);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_created_at ON communications(created_at);
CREATE INDEX idx_email_threads_tenant_id ON email_threads(tenant_id);
CREATE INDEX idx_email_threads_contact_id ON email_threads(contact_id);
CREATE INDEX idx_communication_templates_tenant_id ON communication_templates(tenant_id);
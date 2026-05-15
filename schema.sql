-- Database Schema for Victus Energy ERP
-- This file documents the expected table structure

-- ERP Configuration/Settings Table
CREATE TABLE IF NOT EXISTS erp_config (
    id SERIAL PRIMARY KEY,
    tpin TEXT,
    tax_rate TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    branch_name TEXT,
    branch_code TEXT,
    swift_code TEXT,
    sort_code TEXT,
    currency TEXT DEFAULT 'ZMW',
    signature TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents Table (Invoices, Quotations, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    ref_no TEXT UNIQUE NOT NULL,
    doc_type TEXT NOT NULL, -- 'Quotation', 'Invoice', 'Deal Recap', etc.
    client_name TEXT NOT NULL,
    address TEXT,
    representative TEXT,
    items JSONB, -- Array of item objects
    total_amount DECIMAL(10,2),
    contract_details JSONB, -- For Deal Recap documents
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'SENT', 'PAID'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products/Catalog Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    base_price DECIMAL(10,2),
    erb DECIMAL(10,2),
    storage_cost DECIMAL(10,2),
    marking_fee DECIMAL(10,2),
    srf DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_ref_no ON documents(ref_no);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
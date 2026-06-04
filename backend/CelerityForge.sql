-- ==========================================
-- ADMINS TABLE (The Singleton)`
-- ==========================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The Singleton Lock Columns
    singleton_lock BOOLEAN DEFAULT TRUE UNIQUE NOT NULL,

    profile_image_url TEXT DEFAULT 'https://i.ibb.co/vxLH9d92/default-avatar-light.png',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone BIGINT NOT NULL,
    password_hash TEXT NOT NULL,

    -- Audit Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Database-level constraint enforcing the singleton lock mathematically
    CONSTRAINT admin_singleton_check CHECK (singleton_lock = true)
);


-- ==========================================
-- TECHNICIANS TABLE
-- ==========================================

CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_image_url TEXT DEFAULT 'https://i.ibb.co/vxLH9d92/default-avatar-light.png',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone BIGINT NOT NULL,
    password_hash TEXT NOT NULL,

    is_available BOOLEAN DEFAULT TRUE,
    -- is_active BOOLEAN DEFAULT TRUE, -- Soft delete

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Standard B-Tree indexes for fast lookups during login/signup check/searches
CREATE INDEX ix_technicians_email ON technicians (email);
CREATE INDEX ix_technicians_name ON technicians (name);


-- ==========================================
-- 4. ASSETS TABLE (Inventory)
-- ==========================================
CREATE TYPE stock_status AS ENUM ('Low Stock', 'In Stock');

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT DEFAULT 'https://i.ibb.co/tMtqLqWm/container.jpg',
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,

    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0, -- Low Stock Threshold/Point
    stock_status stock_status NOT NULL,

    -- Dashboard `Top Product` Metrics
    units_sold INTEGER DEFAULT 0,
    total_revenue NUMERIC(15, 2) DEFAULT 0.00,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Standard B-Tree indexes for fast lookups during login/signup check/searches
CREATE INDEX ix_assets_name ON assets (name);


-- ==========================================
-- 5. ORDERS TABLE (Hybrid Relational-Document Architecture )
-- ==========================================
CREATE TYPE order_status AS ENUM ('Pending', 'Paid', 'Cancelled');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- JSONB Snapshots
    assignee JSONB NOT NULL, -- {id, name, email, phone, role}
    customer JSONB NOT NULL, -- {name, email, phone, shipping_address}
    items JSONB NOT NULL, -- [{id, image_url, name, category, unit_price, quantity, total_price}, {...}, ...]

    notes TEXT,
    total_amount NUMERIC(15, 2) NOT NULL,
    status order_status NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index(hidden lookup table) to get orders by assignee's details(ID, Role)
CREATE INDEX ix_orders_assignee_gin ON orders USING GIN (assignee);

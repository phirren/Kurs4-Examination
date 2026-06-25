-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL
);

-- Kitchen tickets
CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed products
INSERT INTO products (name, description, price, category) VALUES
    ('Classic Burger', 'Beef patty with lettuce, tomato, and cheese', 89.00, 'burgers'),
    ('Chicken Burger', 'Crispy chicken fillet with mayo and lettuce', 79.00, 'burgers'),
    ('Veggie Burger', 'Plant-based patty with fresh vegetables', 85.00, 'burgers'),
    ('French Fries', 'Golden crispy fries', 35.00, 'sides'),
    ('Onion Rings', 'Crispy battered onion rings', 39.00, 'sides'),
    ('Coleslaw', 'Creamy coleslaw', 25.00, 'sides'),
    ('Coca-Cola', 'Ice cold Coca-Cola 40cl', 29.00, 'drinks'),
    ('Fanta', 'Orange Fanta 40cl', 29.00, 'drinks'),
    ('Water', 'Still water 50cl', 19.00, 'drinks'),
    ('Milkshake', 'Vanilla milkshake', 45.00, 'drinks'),
    ('Classic Meal', 'Classic Burger + Fries + Drink', 119.00, 'meals'),
    ('Chicken Meal', 'Chicken Burger + Fries + Drink', 109.00, 'meals');

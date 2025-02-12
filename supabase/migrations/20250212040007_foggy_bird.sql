/*
  # Initial Schema Setup for Food Ordering System

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user information
      - Stores user preferences and allergies
    - `restaurants`
      - Stores restaurant information and approval status
    - `menu_items`
      - Stores restaurant menu items
    - `orders`
      - Stores customer orders
    - `order_items`
      - Stores items within each order

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- Create enum types
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivered');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('CUSTOMER', 'RESTAURANT', 'ADMIN')),
  phone text,
  address text,
  allergies text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  cuisine text,
  rating numeric(2,1) DEFAULT 0,
  is_approved boolean DEFAULT false,
  registration_certificate text NOT NULL,
  pan_number text NOT NULL,
  pan_image text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image text,
  category text NOT NULL,
  is_vegetarian boolean DEFAULT false,
  contains_allergens text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) NOT NULL,
  status order_status DEFAULT 'pending',
  total numeric(10,2) NOT NULL,
  delivery_address text NOT NULL,
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Restaurants policies
CREATE POLICY "Anyone can view approved restaurants"
  ON restaurants FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Restaurant owners can view their own restaurant"
  ON restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Restaurant owners can update their own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Admins can update restaurant approval"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Menu items policies
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

CREATE POLICY "Restaurant owners can manage their menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE id = restaurant_id
      AND owner_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view their restaurant orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE id = restaurant_id
      AND owner_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id
      AND restaurant_id IN (
        SELECT id FROM restaurants
        WHERE owner_id = auth.uid()
      )
    )
  );
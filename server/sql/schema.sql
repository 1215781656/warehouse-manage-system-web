CREATE TABLE IF NOT EXISTS color_fabric (
  id VARCHAR(36) PRIMARY KEY,
  color_fabric_no VARCHAR(20) UNIQUE NOT NULL,
  product_spec VARCHAR(100) NOT NULL,
  composition VARCHAR(50) NOT NULL,
  weight INT NOT NULL,
  width INT NOT NULL,
  color VARCHAR(50) NOT NULL,
  color_no VARCHAR(10) NOT NULL,
  batch_no VARCHAR(20) NOT NULL,
  INDEX idx_color_no (color_no),
  INDEX idx_batch_no (batch_no),
  INDEX idx_cf_weight (weight),
  INDEX idx_cf_width (width),
  INDEX idx_cf_product_spec (product_spec),
  INDEX idx_cf_composition (composition)
);

CREATE TABLE IF NOT EXISTS inbound_order (
  id VARCHAR(36) PRIMARY KEY,
  color_fabric_id VARCHAR(36) NOT NULL,
  inbound_no VARCHAR(50) NOT NULL,
  inbound_date DATE NOT NULL,
  supplier VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  operator VARCHAR(50) NOT NULL,
  FOREIGN KEY (color_fabric_id) REFERENCES color_fabric(id),
  INDEX idx_inbound_date (inbound_date),
  INDEX idx_supplier (supplier)
);

CREATE TABLE IF NOT EXISTS outbound_order (
  id VARCHAR(36) PRIMARY KEY,
  color_fabric_id VARCHAR(36) NOT NULL,
  outbound_no VARCHAR(50) NOT NULL,
  outbound_date DATE NOT NULL,
  customer VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  consignee VARCHAR(50) NOT NULL,
  delivery_no VARCHAR(50),
  FOREIGN KEY (color_fabric_id) REFERENCES color_fabric(id),
  INDEX idx_outbound_date (outbound_date),
  INDEX idx_customer (customer)
);

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(36) PRIMARY KEY,
  color_fabric_id VARCHAR(36) UNIQUE NOT NULL,
  total_inbound_quantity INT DEFAULT 0,
  total_outbound_quantity INT DEFAULT 0,
  current_quantity INT DEFAULT 0,
  total_inbound_weight DECIMAL(10,2) DEFAULT 0,
  total_outbound_weight DECIMAL(10,2) DEFAULT 0,
  current_weight DECIMAL(10,2) DEFAULT 0,
  safety_stock INT DEFAULT 10,
  FOREIGN KEY (color_fabric_id) REFERENCES color_fabric(id)
);

CREATE TABLE IF NOT EXISTS receivable (
  id VARCHAR(36) PRIMARY KEY,
  outbound_order_id VARCHAR(36) UNIQUE NOT NULL,
  customer VARCHAR(100) NOT NULL,
  receivable_amount DECIMAL(10,2) NOT NULL,
  received_amount DECIMAL(10,2) DEFAULT 0,
  unpaid_amount DECIMAL(10,2) NOT NULL,
  tax_invoice_amount DECIMAL(10,2) DEFAULT 0,
  source VARCHAR(20),
  source_id VARCHAR(36),
  deleted_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (outbound_order_id) REFERENCES outbound_order(id),
  INDEX idx_customer (customer),
  INDEX idx_source (source)
);

CREATE TABLE IF NOT EXISTS payable (
  id VARCHAR(36) PRIMARY KEY,
  inbound_order_id VARCHAR(36) UNIQUE NOT NULL,
  supplier VARCHAR(100) NOT NULL,
  payable_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  unpaid_amount DECIMAL(10,2) NOT NULL,
  payment_plan TEXT,
  tax_invoice_amount DECIMAL(10,2) DEFAULT 0,
  source VARCHAR(20),
  source_id VARCHAR(36),
  deleted_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (inbound_order_id) REFERENCES inbound_order(id),
  INDEX idx_supplier (supplier),
  INDEX idx_source (source)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  usersId VARCHAR(36) NOT NULL,
  rolesId VARCHAR(36) NOT NULL,
  PRIMARY KEY (usersId, rolesId),
  FOREIGN KEY (usersId) REFERENCES users(id),
  FOREIGN KEY (rolesId) REFERENCES roles(id)
);

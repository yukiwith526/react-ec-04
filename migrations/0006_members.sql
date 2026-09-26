-- Member accounts on existing customers
ALTER TABLE customers ADD COLUMN password_hash TEXT;

alter table products
  add column purchase_price decimal(12,2) not null default 0 after unit;
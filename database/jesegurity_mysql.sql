-- JESegurity - base de datos para XAMPP / MySQL 8
-- Importar este archivo desde phpMyAdmin.

create database if not exists jesegurity
  character set utf8mb4
  collate utf8mb4_unicode_ci;
use jesegurity;

set foreign_key_checks = 0;
drop table if exists inventory_movement_items, inventory_movements, service_assignments,
  services, clients, supplier_products, suppliers, products, locations, categories,
  users, roles;
set foreign_key_checks = 1;

create table roles (
  id int unsigned auto_increment primary key,
  name varchar(50) not null unique,
  description varchar(255) null,
  created_at timestamp not null default current_timestamp
) engine = InnoDB;

create table users (
  id int unsigned auto_increment primary key,
  role_id int unsigned not null,
  full_name varchar(120) not null,
  email varchar(160) not null unique,
  password_hash varchar(255) not null,
  phone varchar(30) null,
  department varchar(100) null,
  location varchar(120) null,
  status enum('Disponible', 'En campo', 'Capacitación', 'Inactivo') not null default 'Disponible',
  shift enum('Turno A', 'Turno B') null,
  rating decimal(2,1) null,
  skills json null,
  next_assignment varchar(180) null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint users_role_fk foreign key (role_id) references roles(id),
  constraint users_rating_check check (rating is null or rating between 0 and 5)
) engine = InnoDB;

create table categories (
  id int unsigned auto_increment primary key,
  name varchar(80) not null unique,
  description varchar(255) null,
  created_at timestamp not null default current_timestamp
) engine = InnoDB;

create table locations (
  id int unsigned auto_increment primary key,
  name varchar(120) not null unique,
  address varchar(255) null,
  active boolean not null default true,
  created_at timestamp not null default current_timestamp
) engine = InnoDB;

create table products (
  id int unsigned auto_increment primary key,
  name varchar(160) not null,
  sku varchar(80) not null unique,
  category_id int unsigned not null,
  unit varchar(40) not null default 'unidades',
  purchase_price decimal(12,2) not null default 0,
  quantity decimal(12,2) not null default 0,
  minimum_quantity decimal(12,2) not null default 0,
  location_id int unsigned null,
  active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint products_category_fk foreign key (category_id) references categories(id),
  constraint products_location_fk foreign key (location_id) references locations(id),
  constraint products_quantity_check check (quantity >= 0),
  constraint products_minimum_check check (minimum_quantity >= 0),
  index products_category_idx (category_id),
  index products_location_idx (location_id)
) engine = InnoDB;

create table suppliers (
  id int unsigned auto_increment primary key,
  name varchar(160) not null,
  category varchar(100) null,
  contact_name varchar(120) null,
  phone varchar(30) null,
  email varchar(160) null,
  rating decimal(2,1) null,
  status enum('Activo', 'En revisión', 'Inactivo') not null default 'Activo',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
) engine = InnoDB;

create table supplier_products (
  supplier_id int unsigned not null,
  product_id int unsigned not null,
  primary key (supplier_id, product_id),
  foreign key (supplier_id) references suppliers(id) on delete cascade,
  foreign key (product_id) references products(id) on delete cascade
) engine = InnoDB;

create table clients (
  id int unsigned auto_increment primary key,
  name varchar(160) not null,
  contact_name varchar(120) null,
  phone varchar(30) null,
  email varchar(160) null,
  address varchar(255) null,
  created_at timestamp not null default current_timestamp
) engine = InnoDB;

create table services (
  id int unsigned auto_increment primary key,
  title varchar(180) not null,
  client_id int unsigned null,
  location varchar(180) not null,
  scheduled_at datetime not null,
  type enum('Prevención', 'Mantenimiento', 'Capacitación') not null,
  status enum('Programado', 'En curso', 'Pendiente', 'Completado', 'Cancelado') not null default 'Pendiente',
  notes text null,
  created_by int unsigned null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  foreign key (client_id) references clients(id),
  foreign key (created_by) references users(id),
  index services_schedule_idx (scheduled_at)
) engine = InnoDB;

create table service_assignments (
  service_id int unsigned not null,
  user_id int unsigned not null,
  primary key (service_id, user_id),
  foreign key (service_id) references services(id) on delete cascade,
  foreign key (user_id) references users(id)
) engine = InnoDB;

create table inventory_movements (
  id int unsigned auto_increment primary key,
  type enum('in', 'out', 'adjustment') not null,
  reference varchar(180) not null,
  origin varchar(180) null,
  status enum('Confirmado', 'Pendiente', 'Revisión') not null default 'Pendiente',
  movement_date datetime not null default current_timestamp,
  supplier_id int unsigned null,
  service_id int unsigned null,
  created_by int unsigned not null,
  reviewed_by int unsigned null,
  created_at timestamp not null default current_timestamp,
  foreign key (supplier_id) references suppliers(id),
  foreign key (service_id) references services(id),
  foreign key (created_by) references users(id),
  foreign key (reviewed_by) references users(id),
  index movements_date_idx (movement_date),
  index movements_status_idx (status)
) engine = InnoDB;

create table inventory_movement_items (
  movement_id int unsigned not null,
  product_id int unsigned not null,
  quantity decimal(12,2) not null,
  primary key (movement_id, product_id),
  foreign key (movement_id) references inventory_movements(id) on delete cascade,
  foreign key (product_id) references products(id),
  constraint movement_quantity_check check (quantity > 0)
) engine = InnoDB;

insert into roles (name, description) values
  ('Administrador', 'Acceso total al sistema'),
  ('Supervisor', 'Supervisa inventario, servicios y personal'),
  ('Operador', 'Registra movimientos y consulta información'),
  ('Técnico', 'Ejecuta servicios en terreno'),
  ('Inspector', 'Realiza inspecciones y auditorías');

insert into categories (name) values
  ('Extintores'), ('EPP'), ('Señalización'), ('Botiquines');

insert into locations (name) values
  ('Almacén principal'), ('EPP / Estantería A'), ('EPP / Estantería B'), ('Señalización');

insert into users (role_id, full_name, email, password_hash, phone, department, location, status, shift, rating, skills, next_assignment)
select id, 'María Rodríguez', 'maria.rodriguez@jesegurity.cl', '', '+56 9 3345 2201', 'Seguridad operativa', 'Sede central', 'Disponible', 'Turno A', 4.9, '["Extintores", "Emergencias", "Auditoría"]', 'Inspección Planta Sur'
from roles where name = 'Supervisor';

insert into users (role_id, full_name, email, password_hash, department, status)
select id, 'Administradora JESegurity', 'admin@jesegurity.com', '$2y$10$avl1dCcgSpENXqwMUO9c8e0Q.2D3vsyB9YhC2jJpE0X/VBcHkzil6', 'Administración', 'Disponible'
from roles where name = 'Administrador';

insert into products (name, sku, category_id, unit, quantity, minimum_quantity, location_id)
select 'Extintor ABC 6 kg', 'EXT-ABC-006', c.id, 'unidades', 24, 10, l.id from categories c, locations l where c.name = 'Extintores' and l.name = 'Almacén principal';
insert into products (name, sku, category_id, unit, quantity, minimum_quantity, location_id)
select 'Extintor CO2 5 kg', 'EXT-CO2-005', c.id, 'unidades', 8, 12, l.id from categories c, locations l where c.name = 'Extintores' and l.name = 'Almacén principal';
insert into products (name, sku, category_id, unit, quantity, minimum_quantity, location_id)
select 'Guantes anticorte nivel 5', 'EPP-GUA-005', c.id, 'pares', 76, 30, l.id from categories c, locations l where c.name = 'EPP' and l.name = 'EPP / Estantería A';
insert into products (name, sku, category_id, unit, quantity, minimum_quantity, location_id)
select 'Casco de seguridad blanco', 'EPP-CAS-001', c.id, 'unidades', 5, 12, l.id from categories c, locations l where c.name = 'EPP' and l.name = 'EPP / Estantería B';
insert into products (name, sku, category_id, unit, quantity, minimum_quantity, location_id)
select 'Señal salida de emergencia', 'SEN-SAL-002', c.id, 'unidades', 42, 20, l.id from categories c, locations l where c.name = 'Señalización' and l.name = 'Señalización';
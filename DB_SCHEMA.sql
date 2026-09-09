-- DB_SCHEMA.sql
-- Run these statements in Supabase SQL Editor (or via migration) to ensure required tables and columns exist.

create extension if not exists pgcrypto;

-- reservas table (existing)
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  barber text not null,
  servicio text,
  fecha date,
  hora text,
  nombre text,
  telefono text,
  estado text default 'pendiente',
  cliente_id uuid,
  created_at timestamptz default now()
);

-- profiles: link to auth.users, add role for secure authorization
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  role text default 'client'
);

-- trabajos: metadata for uploaded photos (gallery)
create table if not exists trabajos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  file_path text,
  public_url text,
  description text,
  created_at timestamptz default now()
);

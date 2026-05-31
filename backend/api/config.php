<?php
// ── Configuración de base de datos ────────────────────────────────────────
// Reemplaza estos valores con los de tu Hostinger hPanel → MySQL
define('DB_HOST', 'localhost');
define('DB_NAME', 'TU_NOMBRE_BD');       // ej: u123456789_nk2db
define('DB_USER', 'TU_USUARIO_MYSQL');   // ej: u123456789_nk2user
define('DB_PASS', 'TU_PASSWORD_MYSQL');
define('DB_CHARSET', 'utf8mb4');

// ── JWT ───────────────────────────────────────────────────────────────────
// Genera una clave segura: openssl rand -hex 32
define('JWT_SECRET', 'CAMBIA_ESTE_SECRETO_POR_UNO_ALEATORIO_LARGO');
define('JWT_EXP', 28800); // 8 horas en segundos

// ── CORS ─────────────────────────────────────────────────────────────────
// Dominio donde está el frontend en producción
define('ALLOWED_ORIGIN', 'https://nuevokennedy2.online');

// ── Zona horaria ──────────────────────────────────────────────────────────
define('APP_TZ', 'America/Bogota');
date_default_timezone_set(APP_TZ);

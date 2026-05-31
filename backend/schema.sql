-- NK2 Comité — Schema MySQL
-- Ejecutar en phpMyAdmin antes de migrar datos

SET NAMES utf8mb4;
SET time_zone = '-05:00';

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `username`   VARCHAR(50)  NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `rol`        ENUM('admin','visor') NOT NULL DEFAULT 'visor',
  `activo`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `personal` (
  `id`     INT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `cargo`  VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `habitantes` (
  `interior` VARCHAR(10)  NOT NULL PRIMARY KEY,
  `nombre`   VARCHAR(100) NOT NULL,
  `pin`      VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bd_ingresos` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `factura`      INT          NOT NULL,
  `fecha`        DATE         NOT NULL,
  `interior`     VARCHAR(10)  NOT NULL,
  `nombre`       VARCHAR(100) NOT NULL,
  `cod_admin`    INT          DEFAULT NULL,
  `administrador` VARCHAR(100) DEFAULT NULL,
  `cod_concepto` INT          NOT NULL,
  `concepto`     VARCHAR(150) NOT NULL,
  `vlr_admon`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  `vlr_vehiculo` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `mes_pago`     DATE         NOT NULL,
  `cantidad`     INT          NOT NULL DEFAULT 1,
  `total`        DECIMAL(12,2) NOT NULL DEFAULT 0,
  `observacion`  VARCHAR(255) DEFAULT NULL,
  INDEX `idx_interior` (`interior`),
  INDEX `idx_fecha`    (`fecha`),
  INDEX `idx_factura`  (`factura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bd_salidas` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `cod_registro`  VARCHAR(20)   NOT NULL UNIQUE,
  `fecha`         DATE          NOT NULL,
  `cod_admin`     INT           DEFAULT NULL,
  `administrador` VARCHAR(100)  DEFAULT NULL,
  `cod_concepto`  INT           NOT NULL,
  `concepto`      VARCHAR(150)  NOT NULL,
  `vlr_total`     DECIMAL(12,2) NOT NULL DEFAULT 0,
  `abono`         DECIMAL(12,2) NOT NULL DEFAULT 0,
  `saldo`         DECIMAL(12,2) NOT NULL DEFAULT 0,
  `observacion`   VARCHAR(255)  DEFAULT NULL,
  INDEX `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bd_abonos` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `cod_registro`   VARCHAR(20)   NOT NULL,
  `fecha`          DATE          NOT NULL,
  `administrador`  VARCHAR(100)  DEFAULT NULL,
  `concepto`       VARCHAR(150)  DEFAULT NULL,
  `vlr_total_obra` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `vlr_abono`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `saldo`          DECIMAL(12,2) NOT NULL DEFAULT 0,
  `observacion`    VARCHAR(255)  DEFAULT NULL,
  INDEX `idx_cod_registro` (`cod_registro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

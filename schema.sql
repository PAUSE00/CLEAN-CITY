-- ═══════════════════════════════════════════════════════════
-- DATABASE INITIALIZATION FOR VILLEPROPRE
-- ═══════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS villepropre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE villepropre_db;

-- 1. POINTS (Dépôts et Quartiers)
CREATE TABLE IF NOT EXISTS points (
    id INT PRIMARY KEY,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    is_depot BOOLEAN DEFAULT FALSE,
    lat DECIMAL(10,6),
    lng DECIMAL(10,6)
);

-- 2. ZONES (Zones de collecte)
CREATE TABLE IF NOT EXISTS zones (
    id INT PRIMARY KEY,
    vol INT NOT NULL,
    cx FLOAT NOT NULL,
    cy FLOAT NOT NULL,
    nom VARCHAR(100) NOT NULL
);

-- 3. CAMIONS (Flotte)
CREATE TABLE IF NOT EXISTS camions (
    id INT PRIMARY KEY,
    cap INT NOT NULL,
    charge INT NOT NULL DEFAULT 0,
    color VARCHAR(20) NOT NULL,
    icon VARCHAR(10) NOT NULL
);

-- 4. CAMION_ZONES (Liaison Camions <-> Zones)
CREATE TABLE IF NOT EXISTS camion_zones (
    camion_id INT NOT NULL,
    zone_id INT NOT NULL,
    PRIMARY KEY (camion_id, zone_id),
    FOREIGN KEY (camion_id) REFERENCES camions(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

-- 5. EDGES (Liaisons du graphe routier)
CREATE TABLE IF NOT EXISTS edges (
    source_id INT NOT NULL,
    target_id INT NOT NULL,
    PRIMARY KEY (source_id, target_id),
    FOREIGN KEY (source_id) REFERENCES points(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES points(id) ON DELETE CASCADE
);

-- 6. MATRIX (Distances précalculées entre tous les points)
CREATE TABLE IF NOT EXISTS matrix (
    source_id INT NOT NULL,
    target_id INT NOT NULL,
    distance FLOAT NOT NULL,
    PRIMARY KEY (source_id, target_id),
    FOREIGN KEY (source_id) REFERENCES points(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES points(id) ON DELETE CASCADE
);

-- 7. PLANNING (Créneaux d'affectation temporelle)
CREATE TABLE IF NOT EXISTS planning_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jour ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi') NOT NULL,
    camion_id INT NOT NULL,
    zone_id INT NOT NULL,
    debut TIME NOT NULL,
    fin TIME NOT NULL,
    cong FLOAT NOT NULL DEFAULT 1.0,
    FOREIGN KEY (camion_id) REFERENCES camions(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

-- 8. SENSORS (Capteurs de remplissage IoT dynamiques)
CREATE TABLE IF NOT EXISTS sensors (
    id INT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    level INT NOT NULL DEFAULT 0,
    rate FLOAT NOT NULL DEFAULT 1.0
);

-- ═══════════════════════════════════════════════════════════
-- INSERTION DES DONNÉES DE BASE (Migration depuis data.js)
-- ═══════════════════════════════════════════════════════════

-- Vidage préalable pour tests
DELETE FROM planning_slots;
DELETE FROM camion_zones;
DELETE FROM matrix;
DELETE FROM edges;
DELETE FROM sensors;
DELETE FROM zones;
DELETE FROM camions;
DELETE FROM points;

INSERT INTO points (id, x, y, nom, is_depot) VALUES
(0, 0, 0, 'Dépôt', TRUE),
(1, 2.5, 3.1, 'Quartier Nord', FALSE),
(2, 5.2, 4.8, 'Centre Ville', FALSE),
(3, 7.8, 1.2, 'Zone Industrielle', FALSE),
(4, 3.0, 7.5, 'Quartier Est', FALSE),
(5, 6.5, 6.0, 'Quartier Ouest', FALSE),
(6, 9.0, 4.5, 'Zone Commerciale', FALSE),
(7, 1.0, 5.5, 'Quartier Sud', FALSE),
(8, 4.5, 2.0, 'Zone Résidentielle', FALSE),
(9, 8.5, 8.0, 'Nouveau Quartier', FALSE);

INSERT INTO edges (source_id, target_id) VALUES
(0,1), (0,7), (0,8), (1,2), (1,4), (1,7), (2,3), (2,5), (2,6), (3,6), (3,8), (4,5), (5,6), (5,9), (6,9);

-- Insertion de la matrice (Simplifiée via script Python au prochain step, on la laisse vide dans ce SQL pour ne pas faire 100 insertions statiques)

INSERT INTO camions (id, cap, charge, color, icon) VALUES
(1, 5000, 3000, '#3b82f6', '🚛'),
(2, 4000, 2700, '#f59e0b', '🚚'),
(3, 6000, 2900, '#00d4aa', '🚐');

INSERT INTO zones (id, vol, cx, cy, nom) VALUES
(1, 1200, 3.5, 4.2, 'Zone 1'),
(2, 1800, 6.0, 3.0, 'Zone 2'),
(3,  900, 6.5, 6.0, 'Zone 3'),
(4, 2100, 5.0, 7.5, 'Zone 4'),
(5, 1500, 4.5, 2.0, 'Zone 5'),
(6, 1100, 8.5, 8.0, 'Zone 6');

INSERT INTO camion_zones (camion_id, zone_id) VALUES
(1, 4), (1, 3),
(2, 5), (2, 1),
(3, 2), (3, 6);

INSERT INTO planning_slots (jour, camion_id, zone_id, debut, fin, cong) VALUES
('lundi', 1, 4, '06:00:00', '08:00:00', 1.0),
('lundi', 1, 3, '10:00:00', '12:00:00', 1.1),
('lundi', 2, 5, '06:00:00', '08:00:00', 1.0),
('lundi', 2, 1, '10:00:00', '12:00:00', 1.1),
('lundi', 3, 2, '10:00:00', '12:00:00', 1.1),
('lundi', 3, 6, '06:00:00', '08:00:00', 1.0),

('mardi', 1, 4, '06:00:00', '08:00:00', 1.0),
('mardi', 2, 1, '08:00:00', '10:00:00', 1.4),
('mardi', 3, 2, '06:00:00', '08:00:00', 1.0),

('mercredi', 1, 3, '10:00:00', '12:00:00', 1.0),
('mercredi', 2, 5, '10:00:00', '12:00:00', 1.0),
('mercredi', 3, 6, '10:00:00', '12:00:00', 1.0),

('jeudi', 1, 4, '08:00:00', '10:00:00', 1.2),
('jeudi', 2, 1, '08:00:00', '10:00:00', 1.2),

('vendredi', 1, 3, '06:00:00', '08:00:00', 1.0),
('vendredi', 3, 6, '06:00:00', '08:00:00', 1.0);

INSERT INTO sensors (id, nom, level, rate) VALUES
(1, 'Quartier Nord', 45, 4.5),
(2, 'Centre Ville', 70, 6.0),
(3, 'Zone Industrielle', 30, 3.0),
(4, 'Quartier Est', 85, 5.0),
(5, 'Zone Commerciale', 55, 4.0),
(6, 'Zone Résidentielle', 40, 3.5),
(7, 'Quartier Sud', 60, 5.5),
(8, 'Quartier Ouest', 25, 3.2);

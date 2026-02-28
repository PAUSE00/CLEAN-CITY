<?php
// api/trucks.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM camions ORDER BY id ASC");
    $camionsData = $stmt->fetchAll();

    // For each camion, fetch its assigned zones
    $stmtZones = $pdo->prepare("SELECT zone_id FROM camion_zones WHERE camion_id = ?");

    $camions = [];
    foreach ($camionsData as $c) {
        $stmtZones->execute([$c['id']]);
        $zonesData = $stmtZones->fetchAll(PDO::FETCH_COLUMN);

        $zones = [];
        foreach ($zonesData as $z) {
            $zones[] = (int)$z;
        }

        $camions[] = [
            'id' => (int)$c['id'],
            'cap' => (int)$c['cap'],
            'charge' => (int)$c['charge'],
            'color' => $c['color'],
            'icon' => $c['icon'],
            'zones' => $zones
        ];
    }

    echo json_encode([
        'success' => true,
        'camions' => $camions
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

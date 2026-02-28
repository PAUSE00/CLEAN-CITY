<?php
// api/zones.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM zones ORDER BY id ASC");
    $zonesData = $stmt->fetchAll();

    $zones = [];
    foreach ($zonesData as $z) {
        $zones[] = [
            'id' => (int)$z['id'],
            'vol' => (int)$z['vol'],
            'cx' => (float)$z['cx'],
            'cy' => (float)$z['cy'],
            'nom' => $z['nom']
        ];
    }

    echo json_encode([
        'success' => true,
        'zones' => $zones
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

<?php
// api/sensors.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM sensors ORDER BY id ASC");
    $sensorsData = $stmt->fetchAll();

    $sensors = [];
    foreach ($sensorsData as $s) {
        $sensors[] = [
            'id' => (int)$s['id'],
            'nom' => $s['nom'],
            'level' => (int)$s['level'],
            'rate' => (float)$s['rate']
        ];
    }

    echo json_encode([
        'success' => true,
        'sensors' => $sensors
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

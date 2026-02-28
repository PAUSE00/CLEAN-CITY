<?php
// api/planning.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM planning_slots ORDER BY id ASC");
    $slotsData = $stmt->fetchAll();

    $planning = [
        'lundi' => [],
        'mardi' => [],
        'mercredi' => [],
        'jeudi' => [],
        'vendredi' => []
    ];

    foreach ($slotsData as $s) {
        $jour = $s['jour'];
        $planning[$jour][] = [
            'camion' => (int)$s['camion_id'],
            'zone' => (int)$s['zone_id'],
            'debut' => substr($s['debut'], 0, 5), // Format "HH:MM"
            'fin' => substr($s['fin'], 0, 5),     // Format "HH:MM"
            'cong' => (float)$s['cong']
        ];
    }

    echo json_encode([
        'success' => true,
        'planning' => $planning
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

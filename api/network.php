<?php
// api/network.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    // 1. Fetch Points (Nodes)
    $stmt = $pdo->query("SELECT * FROM points ORDER BY id ASC");
    $points = $stmt->fetchAll();

    // Convert is_depot to boolean, and ensure types
    foreach ($points as &$p) {
        $p['id'] = (int)$p['id'];
        $p['x'] = (float)$p['x'];
        $p['y'] = (float)$p['y'];
        $p['lat'] = isset($p['lat']) ? (float)$p['lat'] : null;
        $p['lng'] = isset($p['lng']) ? (float)$p['lng'] : null;
        $p['is_depot'] = (bool)$p['is_depot'];
    }

    // 2. Fetch Edges
    $stmt = $pdo->query("SELECT source_id, target_id FROM edges");
    $edgesData = $stmt->fetchAll();
    $edges = [];
    foreach ($edgesData as $e) {
        $edges[] = [(int)$e['source_id'], (int)$e['target_id']];
    }

    // 3. Fetch Matrix
    $stmt = $pdo->query("SELECT source_id, target_id, distance FROM matrix ORDER BY source_id ASC, target_id ASC");
    $matrixData = $stmt->fetchAll();
    $matrix = [];
    $maxPoint = count($points);

    // Initialize empty matrix
    for ($i = 0; $i < $maxPoint; $i++) {
        $matrix[$i] = array_fill(0, $maxPoint, 0.0);
    }

    // Populate matrix arrays
    foreach ($matrixData as $m) {
        $src = (int)$m['source_id'];
        $tgt = (int)$m['target_id'];
        $matrix[$src][$tgt] = (float)$m['distance'];
    }

    // 4. Send Response
    echo json_encode([
        'success' => true,
        'points' => $points,
        'edges' => $edges,
        'matrix' => $matrix
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

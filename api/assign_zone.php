<?php
// api/assign_zone.php
require_once 'config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$camion_id = isset($data['camion_id']) ? (int)$data['camion_id'] : null;
$zone_id = isset($data['zone_id']) ? (int)$data['zone_id'] : null;
$action = isset($data['action']) ? $data['action'] : null; // 'assign' or 'unassign'

if (!$camion_id || !$zone_id || !in_array($action, ['assign', 'unassign'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing valid parameters (camion_id, zone_id, action)']);
    exit;
}

try {
    if ($action === 'assign') {
        // Prevent duplicates
        $check = $pdo->prepare("SELECT COUNT(*) FROM camion_zones WHERE camion_id = ? AND zone_id = ?");
        $check->execute([$camion_id, $zone_id]);
        if ($check->fetchColumn() > 0) {
            echo json_encode(['success' => true, 'message' => 'Assignment already exists']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO camion_zones (camion_id, zone_id) VALUES (?, ?)");
        $result = $stmt->execute([$camion_id, $zone_id]);
        echo json_encode(['success' => true, 'message' => 'Zone assigned successfully']);
    } else if ($action === 'unassign') {
        $stmt = $pdo->prepare("DELETE FROM camion_zones WHERE camion_id = ? AND zone_id = ?");
        $result = $stmt->execute([$camion_id, $zone_id]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Zone unassigned successfully']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Assignment not found']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

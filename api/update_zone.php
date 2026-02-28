<?php
// api/update_zone.php
require_once 'config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? (int)$data['id'] : null;
$vol = isset($data['vol']) ? (int)$data['vol'] : null;

if (!$id || !$vol) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing id or volume parameters']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE zones SET vol = ? WHERE id = ?");
    $result = $stmt->execute([$vol, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Zone updated successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Zone not found or no change made']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

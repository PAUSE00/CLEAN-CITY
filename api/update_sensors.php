<?php
// api/update_sensors.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    // Automatically increment all sensor levels by their 'rate' multiplied by a random factor
    // LEAST ensures it doesn't exceed 100% capacity
    // To simulate a reset if level is >= 95 prior to this tick... (Optionally could be handled differently)

    // Option 1: Just increment
    // $stmt = $pdo->query("UPDATE sensors SET level = LEAST(100, level + (rate * (RAND() * 0.5 + 0.8)))");

    // Option 2: Increment, but if it was extremely high, pretend a truck just picked it up
    $stmt = $pdo->query("
        UPDATE sensors 
        SET level = CASE 
            WHEN level >= 90 THEN 0 
            ELSE LEAST(100, level + (rate * (RAND() * 0.5 + 0.8))) 
        END
    ");

    echo json_encode(['success' => true, 'message' => 'Sensors updated successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

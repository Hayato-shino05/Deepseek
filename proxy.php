<?php
header('Content-Type: application/json');

// Lấy API Key từ biến môi trường
$apiKey = getenv('API_KEY');

// Endpoint API DeepSeek
$baseUrl = "ark.ap-southeast.bytepluses.com";
$apiPath = "/api/v3/chat/completions";
$url = "https://" . $baseUrl . $apiPath;

// Nhận dữ liệu từ client
$requestData = json_decode(file_get_contents('php://input'), true);

// Kiểm tra dữ liệu đầu vào
if (!isset($requestData['messages'])) {
    echo json_encode(['error' => ['message' => 'Dữ liệu không hợp lệ']]);
    http_response_code(400);
    exit;
}

// Cấu hình yêu cầu đến API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));

// Gửi yêu cầu và lấy kết quả
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Kiểm tra lỗi curl
if (curl_errno($ch)) {
    echo json_encode(['error' => ['message' => 'Lỗi kết nối: ' . curl_error($ch)]]);
    http_response_code(500);
    exit;
}

curl_close($ch);

// Trả về dữ liệu từ API
http_response_code($httpCode);
echo $response;
?> 
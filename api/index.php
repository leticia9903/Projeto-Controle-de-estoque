<?php
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'sistema' => 'Controle de Estoque Escolar',
    'api' => 'Estoque-API',
    'status' => 'funcionando'
], JSON_UNESCAPED_UNICODE);

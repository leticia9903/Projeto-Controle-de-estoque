<?php

require_once __DIR__ . '/config/database.php';

try {
    $banco = new Database();
    $conexao = $banco->conectar();

    echo "Conexão com o MySQL realizada com sucesso!";
} catch (Throwable $erro) {
    echo "Erro: " . $erro->getMessage();
}

<?php

require_once __DIR__ . '/config/database.php';

$banco = new Database();
$conexao = $banco->conectar();

$email = 'teste@escola.com';
$novaSenha = 'Escola@123';
$hash = password_hash($novaSenha, PASSWORD_DEFAULT);

$consulta = $conexao->prepare(
    'UPDATE usuarios SET senha = :senha WHERE email = :email'
);

$consulta->execute([
    ':senha' => $hash,
    ':email' => $email
]);

if ($consulta->rowCount() > 0) {
    echo 'SENHA_ATUALIZADA';
} else {
    echo 'NENHUMA_ALTERACAO_REALIZADA';
}
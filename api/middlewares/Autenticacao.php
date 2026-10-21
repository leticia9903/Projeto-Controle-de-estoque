
<?php

class Autenticacao
{
    public static function validar(PDO $conexao): ?array
    {
        $cabecalho = '';

if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $cabecalho = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $cabecalho = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('getallheaders')) {
    $cabecalhos = getallheaders();

    foreach ($cabecalhos as $nome => $valor) {
        if (strtolower($nome) === 'authorization') {
            $cabecalho = $valor;
            break;
        }
    }
}


        if (!preg_match('/Bearer\s+([a-f0-9]{64})/i', $cabecalho, $matches)) {
            http_response_code(401);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Autenticação necessária. Faça login novamente.'
            ], JSON_UNESCAPED_UNICODE);

            return null;
        }

        $tokenHash = hash('sha256', $matches[1]);

        $sql = 'SELECT u.id, u.nome, u.email
                FROM tokens_autenticacao t
                INNER JOIN usuarios u ON u.id = t.usuario_id
                WHERE t.token_hash = :token_hash
                  AND t.expira_em > NOW()
                LIMIT 1';

        $consulta = $conexao->prepare($sql);
        $consulta->execute([
            ':token_hash' => $tokenHash
        ]);

        $usuario = $consulta->fetch();

        if (!$usuario) {
            http_response_code(401);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Token inválido ou expirado. Faça login novamente.'
            ], JSON_UNESCAPED_UNICODE);

            return null;
        }

        return $usuario;
    }
}

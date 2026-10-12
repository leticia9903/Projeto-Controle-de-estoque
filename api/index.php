
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/UsuarioController.php';
require_once __DIR__ . '/controllers/ProdutoController.php';

$caminho = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    $banco = new Database();
    $conexao = $banco->conectar();

    // ROTA: CADASTRAR USUÁRIO
    if ($caminho === '/usuarios' && $metodo === 'POST') {
        $controller = new UsuarioController($conexao);
        $controller->cadastrar();
        exit;
    }

    // ROTA: REALIZAR LOGIN
    if ($caminho === '/login' && $metodo === 'POST') {
        $controller = new UsuarioController($conexao);
        $controller->login();
        exit;
    }

    // ROTA: CADASTRAR PRODUTO
    if ($caminho === '/produtos' && $metodo === 'POST') {
    $controller = new ProdutoController($conexao);
    $controller->cadastrar();
    exit;
}

// ROTA: LISTAR PRODUTOS
if ($caminho === '/produtos' && $metodo === 'GET') {
    $controller = new ProdutoController($conexao);
    $controller->listar();
    exit;
}


/* ROTA: EDITAR PRODUTO */
if (
    preg_match('#^/produtos/([0-9]+)$#', $caminho, $correspondencia)
    && $metodo === 'PUT'
) {
    $controller = new ProdutoController($conexao);
    $controller->editar((int) $correspondencia[1]);
    exit;
}


    // ROTA: REGISTRAR ENTRADA DE PRODUTOS
    if (
        preg_match('#^/produtos/([0-9]+)/entrada$#', $caminho, $correspondencia)
        && $metodo === 'POST'
    ) {
        $controller = new ProdutoController($conexao);
        $controller->entrada((int) $correspondencia[1]);
        exit;
    }

    // ROTA: REGISTRAR RETIRADA DE PRODUTOS
    if (
        preg_match('#^/produtos/([0-9]+)/retirada$#', $caminho, $correspondencia)
        && $metodo === 'POST'
    ) {
        $controller = new ProdutoController($conexao);
        $controller->retirar((int) $correspondencia[1]);
        exit;
    }


    // ROTA: VERIFICAR SE A API ESTÁ FUNCIONANDO
    if ($caminho === '/' && $metodo === 'GET') {
        echo json_encode([
            'sistema' => 'Controle de Estoque Escolar',
            'api' => 'Estoque-API',
            'status' => 'funcionando'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ROTA NÃO ENCONTRADA
    http_response_code(404);

    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Rota não encontrada.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $erro) {
    error_log('Erro na API: ' . $erro->getMessage());

    http_response_code(500);

    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro interno da API.'
    ], JSON_UNESCAPED_UNICODE);
}

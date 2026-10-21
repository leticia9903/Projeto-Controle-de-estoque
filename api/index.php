
<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/UsuarioController.php';
require_once __DIR__ . '/controllers/ProdutoController.php';
require_once __DIR__ . '/controllers/HistoricoController.php';
require_once __DIR__ . '/controllers/RelatorioController.php';
require_once __DIR__ . '/middlewares/Autenticacao.php';

$caminho = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$metodo = $_SERVER['REQUEST_METHOD'];

// NORMALIZAR O CAMINHO DA API
$caminho = rtrim($caminho, '/');

if ($caminho === '') {
    $caminho = '/';
}

// REMOVER O PREFIXO /api QUANDO EXISTIR
if (strpos($caminho, '/api/') === 0) {
    $caminho = substr($caminho, 4);
} elseif ($caminho === '/api') {
    $caminho = '/';
}

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

    
    // PROTEGER AS ROTAS QUE EXIGEM AUTENTICAÇÃO
    $rotasPublicas = [
        ['caminho' => '/usuarios', 'metodo' => 'POST'],
        ['caminho' => '/login', 'metodo' => 'POST'],
        ['caminho' => '/', 'metodo' => 'GET']
    ];

    $rotaPublica = false;

    foreach ($rotasPublicas as $rota) {
        if (
            $caminho === $rota['caminho'] &&
            $metodo === $rota['metodo']
        ) {
            $rotaPublica = true;
            break;
        }
    }

    if (!$rotaPublica) {
        $usuarioAutenticado = Autenticacao::validar($conexao);

        if ($usuarioAutenticado === null) {
            exit;
        }
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


    // ROTA: EXCLUIR PRODUTO
    if (
        preg_match('#^/produtos/([0-9]+)$#', $caminho, $correspondencia)
        && $metodo === 'DELETE'
    ) {
        $controller = new ProdutoController($conexao);
        $controller->excluir((int) $correspondencia[1]);
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

    // ROTA: LISTAR HISTÓRICO DE MOVIMENTAÇÕES
if ($caminho === '/historico' && $metodo === 'GET') {
    $controller = new HistoricoController($conexao);
    $controller->listar();
    exit;
}


    // ROTA: CONSULTAR RELATÓRIOS
    if ($caminho === '/relatorios' && $metodo === 'GET') {
        $controller = new RelatorioController($conexao);
        $controller->consultar();
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

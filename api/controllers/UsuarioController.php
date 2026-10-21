
<?php

class UsuarioController
{
    private PDO $conexao;

    public function __construct(PDO $conexao)
    {
        $this->conexao = $conexao;
    }

    // CADASTRAR USUÁRIO
    public function cadastrar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true);

        if (!is_array($dados)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Envie os dados em formato JSON válido.'
            ]);
            return;
        }

        $nome = trim($dados['nome'] ?? '');
        $email = trim($dados['email'] ?? '');
        $senha = $dados['senha'] ?? '';

        if (
            $nome === '' ||
            $email === '' ||
            !is_string($senha) ||
            $senha === ''
        ) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Nome, e-mail e senha são obrigatórios.'
            ]);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Informe um e-mail válido.'
            ]);
            return;
        }

        if (strlen($senha) < 8) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'A senha deve ter pelo menos 8 caracteres.'
            ]);
            return;
        }

        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        try {
            $sql = 'INSERT INTO usuarios (nome, email, senha)
                    VALUES (:nome, :email, :senha)';

            $consulta = $this->conexao->prepare($sql);

            $consulta->execute([
                ':nome' => $nome,
                ':email' => $email,
                ':senha' => $senhaHash
            ]);

            $this->responder(201, [
                'sucesso' => true,
                'mensagem' => 'Usuário cadastrado com sucesso.',
                'id' => (int) $this->conexao->lastInsertId()
            ]);

        } catch (PDOException $erro) {
            if ($erro->getCode() === '23000') {
                $this->responder(409, [
                    'sucesso' => false,
                    'mensagem' => 'Este e-mail já está cadastrado.'
                ]);
                return;
            }

            error_log(
                'Erro ao cadastrar usuário: ' . $erro->getMessage()
            );

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível cadastrar o usuário.'
            ]);
        }
    }


    // REALIZAR LOGIN
    public function login(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true);

        if (!is_array($dados)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Envie os dados em formato JSON válido.'
            ]);
            return;
        }

        $email = trim($dados['email'] ?? '');
        $senha = $dados['senha'] ?? '';

        if (
            $email === '' ||
            !is_string($senha) ||
            $senha === ''
        ) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'E-mail e senha são obrigatórios.'
            ]);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Informe um e-mail válido.'
            ]);
            return;
        }

        try {
            $sql = 'SELECT id, nome, email, senha
                    FROM usuarios
                    WHERE email = :email';

            $consulta = $this->conexao->prepare($sql);
            $consulta->execute([':email' => $email]);

            $usuario = $consulta->fetch();

            if (
                !$usuario ||
                !password_verify($senha, $usuario['senha'])
            ) {
                $this->responder(401, [
                    'sucesso' => false,
                    'mensagem' => 'E-mail ou senha inválidos.'
                ]);
                return;
            }

            // Gerar um token aleatório para a sessão autenticada.
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);

            // Expiração do token: 8 horas.
            $expiraEm = date('Y-m-d H:i:s', time() + 8 * 60 * 60);

            $sqlToken = 'INSERT INTO tokens_autenticacao
                         (usuario_id, token_hash, expira_em)
                         VALUES (:usuario_id, :token_hash, :expira_em)';

            $consultaToken = $this->conexao->prepare($sqlToken);
            $consultaToken->execute([
                ':usuario_id' => $usuario['id'],
                ':token_hash' => $tokenHash,
                ':expira_em' => $expiraEm
            ]);

            $this->responder(200, [
                'sucesso' => true,
                'mensagem' => 'Login realizado com sucesso.',
                'token' => $token,
                'usuario' => [
                    'id' => (int) $usuario['id'],
                    'nome' => $usuario['nome'],
                    'email' => $usuario['email']
                ]
            ]);

        } catch (Throwable $erro) {
            error_log(
                'Erro ao realizar login: ' . $erro->getMessage()
            );

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível realizar o login.'
            ]);
        }
    }


    // PADRONIZAR RESPOSTAS DA API
    private function responder(int $status, array $dados): void
    {
        http_response_code($status);

        header('Content-Type: application/json; charset=utf-8');

        echo json_encode(
            $dados,
            JSON_UNESCAPED_UNICODE
        );
    }
}

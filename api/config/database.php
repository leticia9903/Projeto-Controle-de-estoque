
<?php

class Database
{
    private string $host;
    private string $port = '3306';
    private string $dbname;
    private string $username;
    private string $password;

    public function __construct()
    {
        // AMBIENTE LOCAL OU HOSPEDAGEM
        $ambiente = getenv('APP_ENV') ?: 'local';

        if ($ambiente === 'producao') {
            // DADOS DA HOSPEDAGEM INFINITYFREE
            $this->host = 'sql303.infinityfree.com';
            $this->dbname = 'if0_43221614_Estoque';
            $this->username = 'if0_43221614';

            // SUBSTITUA PELA SENHA REAL DO MYSQL DA HOSPEDAGEM
            $this->password = 'SUA_SENHA_MYSQL_AQUI';
        } else {
            // DADOS DO XAMPP
            $this->host = '127.0.0.1';
            $this->dbname = 'estoque_escolar';
            $this->username = 'root';
            $this->password = '';
        }
    }

    public function conectar(): PDO
    {
        try {
            return new PDO(
                "mysql:host={$this->host};port={$this->port};dbname={$this->dbname};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $erro) {
            error_log('Erro MySQL: ' . $erro->getMessage());

            throw new RuntimeException(
                'Não foi possível conectar ao banco de dados.'
            );
        }
    }
}

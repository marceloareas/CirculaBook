-- ============================================================================
-- CIRCULA BOOK — seed de demonstração (versão reduzida)
-- Executado pelo Spring Boot depois que o Hibernate cria as tabelas
-- (spring.jpa.defer-datasource-initialization=true).
-- Usuário 1 começa sem nenhum registro; Usuário 2 tem 3 empréstimos (um atrasado);
-- Usuário 3 tem uma reserva pronta para retirada e outra na fila.
-- Todas as datas são relativas ao momento do boot.
-- ============================================================================

-- ─── Categorias ───
INSERT INTO categoria (id, nome, descricao) VALUES
(1, 'Romance',              'Narrativas centradas em relações e conflitos pessoais'),
(2, 'Ficção Científica',    'Futuros possíveis, tecnologia e sociedades imaginadas'),
(3, 'Fantasia',             'Mundos imaginários, magia e aventura'),
(4, 'Suspense e Policial',  'Mistérios, investigações e crimes'),
(5, 'Biografia',            'Relatos da vida de pessoas reais'),
(6, 'Infantil e Juvenil',   'Obras para crianças e jovens leitores'),
(7, 'História e Sociedade', 'Ensaios sobre história, cultura e sociedade'),
(8, 'Poesia e Crônicas',    'Poemas, crônicas e textos curtos'),
(9, 'Tecnologia',           'Computação e desenvolvimento de software');

-- ─── Bibliotecas ───
INSERT INTO biblioteca (id, nome, endereco, email, telefone, criada_em) VALUES
(1, 'Biblioteca Central',                    'Praça da Biblioteca, 50 - Centro',      'central@circulabook.com',     '(21) 3000-0001', CURRENT_TIMESTAMP - INTERVAL '500 days'),
(2, 'Biblioteca Comunitária de Vila Isabel', 'Rua das Letras, 100 - Vila Isabel',     'vilaisabel@circulabook.com',  '(21) 3000-0002', CURRENT_TIMESTAMP - INTERVAL '500 days');

-- ─── Usuários — senha de todos: senha123 (hash BCrypt real) ───
INSERT INTO usuario (id, nome, email, senha_hash, tipo, biblioteca_id, criado_em, bloqueado_ate) VALUES
(1, 'Bibliotecário Central',     'bibliotecariocentral@circulabook.com',    '$2a$10$65hIwrxXMxThdo9bISpK1uMNzOEm5D/8Ox2cHJRHMnBxgpi.vYExu', 'BIBLIOTECARIO', 1,    CURRENT_TIMESTAMP - INTERVAL '500 days', NULL),
(2, 'Bibliotecário Vila Isabel', 'bibliotecariovilaisabel@circulabook.com', '$2a$10$65hIwrxXMxThdo9bISpK1uMNzOEm5D/8Ox2cHJRHMnBxgpi.vYExu', 'BIBLIOTECARIO', 2,    CURRENT_TIMESTAMP - INTERVAL '500 days', NULL),
(3, 'Usuário 1',                 'usuario1@circulabook.com',                '$2a$10$65hIwrxXMxThdo9bISpK1uMNzOEm5D/8Ox2cHJRHMnBxgpi.vYExu', 'COMUM',         NULL, CURRENT_TIMESTAMP - INTERVAL '2 days',   NULL),
(4, 'Usuário 2',                 'usuario2@circulabook.com',                '$2a$10$65hIwrxXMxThdo9bISpK1uMNzOEm5D/8Ox2cHJRHMnBxgpi.vYExu', 'COMUM',         NULL, CURRENT_TIMESTAMP - INTERVAL '120 days', NULL),
(5, 'Usuário 3',                 'usuario3@circulabook.com',                '$2a$10$65hIwrxXMxThdo9bISpK1uMNzOEm5D/8Ox2cHJRHMnBxgpi.vYExu', 'COMUM',         NULL, CURRENT_TIMESTAMP - INTERVAL '120 days', NULL);

-- ─── Livros — ISBNs fictícios ───
INSERT INTO livro (id, titulo, autor, isbn, editora, ano_publicacao, sinopse, categoria_id) VALUES
(1,  'Dom Casmurro', 'Machado de Assis', '978-65-90000-01-0', 'Editora Rede Literária', 1899,
     'Bento Santiago revisita a juventude e o casamento com Capitu, sem nunca ter certeza se foi traído.', 1),
(2,  'Memórias Póstumas de Brás Cubas', 'Machado de Assis', '978-65-90000-02-0', 'Editora Rede Literária', 1881,
     'Um defunto-autor narra a própria vida e ironiza as vaidades da sociedade do século XIX.', 1),
(3,  'O Cortiço', 'Aluísio Azevedo', '978-65-90000-03-0', 'Editora Rede Literária', 1890,
     'A vida coletiva de um cortiço carioca e a ambição de seu dono, João Romão.', 1),
(4,  'Capitães da Areia', 'Jorge Amado', '978-65-90000-04-0', 'Editora Rede Literária', 1937,
     'Um grupo de meninos de rua sobrevive nas ruas e trapiches de Salvador.', 1),
(5,  'Grande Sertão: Veredas', 'Guimarães Rosa', '978-65-90000-05-0', 'Editora Rede Literária', 1956,
     'Riobaldo, ex-jagunço, conta suas travessias pelo sertão e sua relação com Diadorim.', 1),
(6,  '1984', 'George Orwell', '978-65-90000-06-0', 'Editora Horizonte', 1949,
     'Winston Smith vive sob a vigilância permanente do Grande Irmão.', 2),
(7,  'Fahrenheit 451', 'Ray Bradbury', '978-65-90000-07-0', 'Editora Horizonte', 1953,
     'Num futuro em que livros são proibidos, um bombeiro encarregado de queimá-los começa a lê-los.', 2),
(8,  'Duna', 'Frank Herbert', '978-65-90000-08-0', 'Editora Horizonte', 1965,
     'Paul Atreides chega ao planeta desértico Arrakis, fonte da especiaria mais valiosa do universo.', 2),
(9,  'O Hobbit', 'J. R. R. Tolkien', '978-65-90000-09-0', 'Editora Horizonte', 1937,
     'Bilbo Bolseiro parte numa aventura com anões para recuperar um tesouro guardado por um dragão.', 3),
(10, 'Harry Potter e a Pedra Filosofal', 'J. K. Rowling', '978-65-90000-10-0', 'Editora Horizonte', 1997,
     'Um menino descobre que é bruxo e começa seus estudos em Hogwarts.', 3),
(11, 'Assassinato no Expresso do Oriente', 'Agatha Christie', '978-65-90000-11-0', 'Editora Mistério', 1934,
     'Hercule Poirot investiga um crime a bordo de um trem preso na neve.', 4),
(12, 'O Cão dos Baskerville', 'Arthur Conan Doyle', '978-65-90000-12-0', 'Editora Mistério', 1902,
     'Sherlock Holmes investiga a lenda de um cão sobrenatural que assombra uma família.', 4),
(13, 'O Diário de Anne Frank', 'Anne Frank', '978-65-90000-13-0', 'Editora Memória', 1947,
     'O diário de uma jovem judia escondida com a família durante a ocupação nazista.', 5),
(14, 'Steve Jobs', 'Walter Isaacson', '978-65-90000-14-0', 'Editora Memória', 2011,
     'Biografia do cofundador da Apple, baseada em entrevistas com ele e com quem o conheceu.', 5),
(15, 'Quarto de Despejo', 'Carolina Maria de Jesus', '978-65-90000-15-0', 'Editora Memória', 1960,
     'O diário de uma catadora de papel na favela do Canindé, em São Paulo.', 5),
(16, 'O Pequeno Príncipe', 'Antoine de Saint-Exupéry', '978-65-90000-16-0', 'Editora Ciranda', 1943,
     'Um aviador que cai no deserto conhece um pequeno príncipe vindo de outro planeta.', 6),
(17, 'Sapiens', 'Yuval Noah Harari', '978-65-90000-17-0', 'Editora Ágora', 2011,
     'Uma breve história da humanidade, da pré-história aos dias de hoje.', 7),
(18, 'Casa-Grande & Senzala', 'Gilberto Freyre', '978-65-90000-18-0', 'Editora Ágora', 1933,
     'Ensaio sobre a formação da sociedade brasileira no regime patriarcal.', 7),
(19, 'Antologia Poética', 'Carlos Drummond de Andrade', '978-65-90000-19-0', 'Editora Rede Literária', 1962,
     'Seleção de poemas organizada pelo próprio autor.', 8),
(20, 'Código Limpo (Clean Code)', 'Robert C. Martin', '978-65-90000-20-0', 'Editora Bits', 2008,
     'Boas práticas para escrever código legível e fácil de manter.', 9);

-- ─── Exemplares (o "quadro" do Blackboard) — estados do instante inicial ───
-- Biblioteca: 1 = Central, 2 = Vila Isabel.
-- Invariantes: emprestado com fila PENDENTE na biblioteca = EMPRESTADO_RESERVADO;
-- todo RESERVADO está ligado a uma reserva pronta (DISPONIVEL).
INSERT INTO exemplar (id, livro_id, biblioteca_id, status, adicionado_em) VALUES
-- 1 Dom Casmurro: C 3 + VI 2, todos disponíveis
(1,  1,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(2,  1,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(3,  1,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(4,  1,  2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(5,  1,  2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 3 O Cortiço: C 2 + VI 1
(6,  3,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(7,  3,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(8,  3,  2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 4 Capitães da Areia: VI 2
(9,  4,  2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(10, 4,  2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 5 Grande Sertão: C 1, emprestado a U2
(11, 5,  1, 'EMPRESTADO',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 6 1984: C 2 + VI 1
(12, 6,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(13, 6,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(14, 6,  2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 7 Fahrenheit 451: C 2
(15, 7,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(16, 7,  1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 8 Duna: C 2, ambos emprestados (U2 atrasado, U3), sem fila
(17, 8,  1, 'EMPRESTADO',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(18, 8,  1, 'EMPRESTADO',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 9 O Hobbit: C 1, emprestado a U2 com fila (reserva 1 de U3)
(19, 9,  1, 'EMPRESTADO_RESERVADO', CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 10 Harry Potter: C 2 + VI 1 reservado para U3 (reserva 2) + VI 1 disponível
(20, 10, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(21, 10, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(22, 10, 2, 'RESERVADO',            CURRENT_TIMESTAMP - INTERVAL '400 days'),
(23, 10, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '60 days'),
-- 11 Assassinato no Expresso do Oriente: C 1 + VI 2
(24, 11, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(25, 11, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(26, 11, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 12 O Cão dos Baskerville: VI 2
(27, 12, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(28, 12, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 13 O Diário de Anne Frank: C 2
(29, 13, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(30, 13, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 14 Steve Jobs: C 1
(31, 14, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 15 Quarto de Despejo: VI 2
(32, 15, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(33, 15, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 16 O Pequeno Príncipe: C 2 + VI 3
(34, 16, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(35, 16, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(36, 16, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(37, 16, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(38, 16, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 17 Sapiens: C 2 + VI 1
(39, 17, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(40, 17, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(41, 17, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 18 Casa-Grande & Senzala: C 1
(42, 18, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 19 Antologia Poética: VI 2
(43, 19, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(44, 19, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
-- 20 Código Limpo: C 2 + VI 1
(45, 20, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(46, 20, 1, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days'),
(47, 20, 2, 'DISPONIVEL',           CURRENT_TIMESTAMP - INTERVAL '400 days');

-- ─── Empréstimos — prazo fixo de 14 dias ───
-- Ativos: U2 3/3 (Duna atrasado há 6 dias), U3 1/3. U1 nenhum.
-- Encerrados: U2 devolveu Sapiens e O Pequeno Príncipe; U3 devolveu Código Limpo e Anne Frank.
INSERT INTO emprestimo (id, exemplar_id, usuario_id, biblioteca_id, data_emprestimo, data_prev_devolucao, data_devolucao, status) VALUES
(1, 19, 4, 1, CURRENT_TIMESTAMP - INTERVAL '3 days',  CURRENT_TIMESTAMP + INTERVAL '11 days', NULL, 'ATIVO'),
(2, 11, 4, 1, CURRENT_TIMESTAMP - INTERVAL '6 days',  CURRENT_TIMESTAMP + INTERVAL '8 days',  NULL, 'ATIVO'),
(3, 17, 4, 1, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '6 days',  NULL, 'ATRASADO'),
(4, 18, 5, 1, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '4 days',  NULL, 'ATIVO'),
(5, 39, 4, 1, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '46 days', CURRENT_TIMESTAMP - INTERVAL '50 days', 'DEVOLVIDO'),
(6, 36, 4, 2, CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '31 days', CURRENT_TIMESTAMP - INTERVAL '35 days', 'DEVOLVIDO'),
(7, 45, 5, 1, CURRENT_TIMESTAMP - INTERVAL '41 days', CURRENT_TIMESTAMP - INTERVAL '27 days', CURRENT_TIMESTAMP - INTERVAL '28 days', 'DEVOLVIDO'),
(8, 29, 5, 1, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '16 days', CURRENT_TIMESTAMP - INTERVAL '18 days', 'DEVOLVIDO');

-- ─── Reservas — fila e retirada sempre na mesma biblioteca ───
-- 1: U3, O Hobbit, na fila da Central (exemplar 19 está com U2).
-- 2: U3, Harry Potter, pronta para retirada na Vila Isabel (exemplar 22), expira em 2 dias.
-- 3 e 4: encerradas (U3 retirou Código Limpo; U3 deixou 1984 expirar).
INSERT INTO reserva (id, livro_id, usuario_id, biblioteca_fila_id, exemplar_id, data_reserva, data_expiracao, status) VALUES
(1, 9,  5, 1, NULL, CURRENT_TIMESTAMP - INTERVAL '1 days',  CURRENT_TIMESTAMP + INTERVAL '2 days',  'PENDENTE'),
(2, 10, 5, 2, 22,   CURRENT_TIMESTAMP - INTERVAL '6 days',  CURRENT_TIMESTAMP + INTERVAL '2 days',  'DISPONIVEL'),
(3, 20, 5, 1, 45,   CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '40 days', 'RETIRADA'),
(4, 6,  5, 1, 12,   CURRENT_TIMESTAMP - INTERVAL '28 days', CURRENT_TIMESTAMP - INTERVAL '22 days', 'EXPIRADA');

-- ============================================================================
-- Sincroniza as sequences: com IDs explícitos acima, sem isto o próximo INSERT
-- feito pela aplicação tentaria reusar o ID 1.
-- ============================================================================
SELECT setval(pg_get_serial_sequence('categoria','id'),  (SELECT MAX(id) FROM categoria));
SELECT setval(pg_get_serial_sequence('biblioteca','id'), (SELECT MAX(id) FROM biblioteca));
SELECT setval(pg_get_serial_sequence('usuario','id'),    (SELECT MAX(id) FROM usuario));
SELECT setval(pg_get_serial_sequence('livro','id'),      (SELECT MAX(id) FROM livro));
SELECT setval(pg_get_serial_sequence('exemplar','id'),   (SELECT MAX(id) FROM exemplar));
SELECT setval(pg_get_serial_sequence('emprestimo','id'), (SELECT MAX(id) FROM emprestimo));
SELECT setval(pg_get_serial_sequence('reserva','id'),    (SELECT MAX(id) FROM reserva));

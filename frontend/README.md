# Íntegra: Humano por Inteiro — versão React

Site do congresso de extensão convertido de HTML/CSS/JS puro para **React 18 + Vite**,
com um backend próprio (**Node.js + Express + SQLite**) que implementa o banco
de dados e o CRUD completo do sistema.

## Como rodar o front-end

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

Para gerar a versão de produção:

```bash
npm run build
npm run preview   # testa o build localmente
```

## Como rodar o backend (banco de dados + CRUD)

```bash
cd server
npm install
npm start   # http://localhost:3001
```

Veja `server/README.md` para o modelo de dados completo e a lista de
endpoints. Requer Node 22.5+ (usa o módulo nativo `node:sqlite`, sem
dependências para compilar).

## Estrutura

```
├── index.html                  # ponto de entrada do Vite (só o #root)
├── src/
│   ├── main.jsx                # bootstrap do React
│   ├── App.jsx                 # estado global (usuários, inscrições, navegação, toast)
│   ├── styles/style.css        # CSS original, mantido intacto (+ estilos novos)
│   ├── data/minicursos.js      # dados dos minicursos + validadores (email/telefone/certificado)
│   └── components/
│       ├── Navbar.jsx
│       ├── Toast.jsx
│       └── pages/
│           ├── Home.jsx               # hero, sobre, vídeo, programação, palestrantes
│           ├── Auth.jsx               # login e cadastro (formulários controlados)
│           ├── Minicursos.jsx         # listagem com barra de vagas
│           ├── MinicursoDetail.jsx    # detalhe + inscrição
│           ├── Inscricoes.jsx         # "Minhas Inscrições": evento + minicurso, com cancelamento
│           ├── Certificados.jsx       # lista de certificados disponíveis
│           └── CertificadoDetail.jsx  # folha do certificado, imprimível/PDF
│
└── server/                     # banco de dados (SQL) + API CRUD — ver server/README.md
    ├── src/db/schema.sql           # modelo relacional (PostgreSQL)
    ├── src/db/schema.sqlite.sql    # mesmo modelo, adaptado para SQLite
    ├── src/routes/                 # CRUD de usuários, minicursos, inscrições, certificados
    └── src/index.js                # servidor Express
```

## Páginas novas

- **Minhas Inscrições** (`Minhas Inscrições` na navbar, visível após login):
  mostra o status da inscrição no evento e o minicurso escolhido, com opção
  de cancelar a inscrição no minicurso.
- **Certificados** (`Certificados` na navbar, visível após login): lista o
  certificado disponível para o minicurso em que o usuário está inscrito e
  abre uma folha de certificado imprimível/salvável em PDF (`window.print()`),
  com nome, curso, data e código de verificação.

## O que mudou na conversão original (HTML/JS → React)

- O "banco em memória" (`DB`) e o `currentUser` viraram **estado React** no `App.jsx`, passados via props.
- A navegação por `display: none/block` nas divs `.page` virou **renderização condicional** — só a página ativa é montada.
- Toda a manipulação de DOM (`getElementById`, `innerHTML`, `insertAdjacentHTML`) foi substituída por **JSX e formulários controlados** (`useState` + `onChange`), incluindo a limpeza de erros ao digitar.
- As regras de negócio foram preservadas: e-mail duplicado no cadastro, senha mínima de 6 caracteres, telefone com 10–11 dígitos, um minicurso por e-mail (são simultâneos), limite de vagas e contador de inscritos na home.

## Observação sobre persistência

O front-end ainda guarda os dados só em memória (como no HTML/JS original):
recarregar a página zera cadastros e inscrições. O banco de dados SQL e o
CRUD em `server/` já existem e estão testados de ponta a ponta (cadastro,
login, inscrição com regras de vagas/duplicidade, emissão de certificado) —
o próximo passo natural é trocar as chamadas `useState` do front por `fetch`
para esses endpoints, o que não foi feito automaticamente para não alterar
sozinho a lógica de autenticação do app sem confirmar com você.


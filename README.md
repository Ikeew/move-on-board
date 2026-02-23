a


# 📌 1. Domínio do Problema

## 🎯 Visão Geral

O **Move On Board** é uma aplicação web para organização de tarefas baseada no modelo Kanban, permitindo que usuários criem quadros, listas e cartões para acompanhar o progresso de atividades.

O sistema é voltado para estudantes, pequenos times e usuários individuais que desejam organizar tarefas de forma visual, simples e eficiente.

---

## ❗ Problema a Ser Resolvido

Muitas pessoas organizam tarefas utilizando:

* Bloco de notas
* Papel
* Conversas em WhatsApp
* Planilhas desorganizadas

Isso gera:

* Falta de controle de progresso
* Dificuldade de priorização
* Perda de tarefas
* Baixa visibilidade do fluxo de trabalho

O **Move On Board** resolve esse problema através de um sistema visual baseado em quadros e cartões.

---

## 🧩 Conceitos do Domínio

### 👤 Usuário

Pessoa autenticada no sistema.

### 📋 Quadro (Board)

Espaço de organização de tarefas (ex: "Faculdade", "Trabalho", "Projeto X").

### 📑 Lista (Column)

Colunas dentro do quadro (ex: "A Fazer", "Em Progresso", "Concluído").

### 📝 Card (Task)

Tarefa individual dentro de uma lista.

### 🏷️ Etiqueta (Label)

Marcadores visuais para classificação (ex: "Urgente", "Bug", "Estudo").

---

# 📌 2. Requisitos do Sistema

## ✅ Requisitos Funcionais (RF)

**RF01 — Autenticação**

* Cadastro de usuário
* Login e Logout
* Autenticação via JWT

**RF02 — Gestão de Quadros**

* Criar quadro
* Listar quadros
* Editar quadro
* Excluir quadro

**RF03 — Gestão de Listas**

* Criar listas dentro de um quadro
* Editar nome da lista
* Excluir lista

**RF04 — Gestão de Cards**

* Criar card
* Editar card
* Excluir card
* Definir descrição, prioridade e prazo

**RF05 — Movimentação de Cards**

* Mover cards entre listas (drag and drop)
* Reordenar cards dentro da lista
* Persistir nova posição no banco

**RF06 — Filtros**

* Buscar cards por título
* Filtrar por etiqueta ou prioridade

---

## ⚙️ Requisitos Não Funcionais (RNF)

**RNF01 — Segurança**

* Senhas armazenadas com hash (bcrypt/argon2)
* Autenticação via JWT

**RNF02 — Performance**

* Operações de listagem devem responder em tempo adequado

**RNF03 — Usabilidade**

* Interface intuitiva
* Sistema responsivo (desktop e mobile)

**RNF04 — Manutenibilidade**

* Separação clara entre camadas (Controller, Service, Repository)
* Código organizado e padronizado

**RNF05 — Confiabilidade**

* Operações críticas devem usar transações no banco
* Garantia de integridade dos dados

---

# 📌 3. Tecnologias Utilizadas e Justificativas

## 🐍 Back-end — Python

### Framework: FastAPI

**Justificativa:**

* Alta produtividade
* Documentação automática (Swagger)
* Validação de dados com Pydantic
* Excelente desempenho

Permite criar uma API REST organizada e escalável.

---

## ⚛️ Front-end — React

**Justificativa:**

* Componentização
* Facilidade para criar interfaces dinâmicas
* Ideal para sistemas com drag and drop
* Grande ecossistema de bibliotecas

Bibliotecas recomendadas:

* React Router (roteamento)
* Mantine para componentes
* Axios (requisições HTTP)

---

## 🐘 Banco de Dados — PostgreSQL

**Justificativa:**

* Banco relacional robusto
* Suporte a integridade referencial
* Excelente desempenho
* Amplamente utilizado no mercado

Ideal para modelagem de:

* Usuário → Quadro → Lista → Card

---

# 📌 4. Arquitetura Geral

* API REST
* Separação Front-end e Back-end
* Banco relacional com integridade referencial
* Autenticação stateless com JWT

---

# 📌 5. Escopo Inicial (MVP)

✔ Cadastro/Login

✔ CRUD de Quadros

✔ CRUD de Listas

✔ CRUD de Cards

✔ Movimentação de Cards

✔ Filtro básico

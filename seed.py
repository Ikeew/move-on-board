"""
Seed script — populates the database with sample data for development.

Usage:
    python seed.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import User, Board, Column, Task, Label, TaskLabel
from app.models.task import Priority


def seed():
    db = SessionLocal()
    try:
        # ------------------------------------------------------------------
        # Guard: skip if data already exists
        # ------------------------------------------------------------------
        if db.query(User).first():
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database...")

        # ------------------------------------------------------------------
        # Users
        # ------------------------------------------------------------------
        henrique = User(
            name="Henrique Klappoth",
            email="henrique@moveonboard.dev",
            hashed_password=hash_password("senha123"),
            is_active=True,
        )
        rodrigo = User(
            name="Rodrigo Klappoth",
            email="rodrigo@moveonboard.dev",
            hashed_password=hash_password("senha123"),
            is_active=True,
        )
        db.add_all([henrique, rodrigo])
        db.flush()
        print(f"  Users created: {henrique.email}, {rodrigo.email}")

        # ------------------------------------------------------------------
        # Board — Henrique
        # ------------------------------------------------------------------
        board_tcc = Board(
            title="Projeto TCC",
            description="Organização do trabalho de conclusão de curso",
            owner_id=henrique.id,
        )
        db.add(board_tcc)
        db.flush()
        print(f"  Board created: '{board_tcc.title}'")

        # ------------------------------------------------------------------
        # Labels — board TCC
        # ------------------------------------------------------------------
        label_backend = Label(name="Back-end", color="#6366f1", board_id=board_tcc.id)
        label_frontend = Label(name="Front-end", color="#f59e0b", board_id=board_tcc.id)
        label_docs = Label(name="Documentação", color="#10b981", board_id=board_tcc.id)
        label_bug = Label(name="Bug", color="#ef4444", board_id=board_tcc.id)
        db.add_all([label_backend, label_frontend, label_docs, label_bug])
        db.flush()
        print(f"  Labels created: 4")

        # ------------------------------------------------------------------
        # Columns — board TCC
        # ------------------------------------------------------------------
        col_backlog = Column(title="Backlog", position=0, board_id=board_tcc.id)
        col_doing = Column(title="Em Progresso", position=1, board_id=board_tcc.id)
        col_review = Column(title="Revisão", position=2, board_id=board_tcc.id)
        col_done = Column(title="Concluído", position=3, board_id=board_tcc.id)
        db.add_all([col_backlog, col_doing, col_review, col_done])
        db.flush()
        print(f"  Columns created: Backlog, Em Progresso, Revisão, Concluído")

        # ------------------------------------------------------------------
        # Tasks — Backlog
        # ------------------------------------------------------------------
        task1 = Task(
            title="Definir modelagem do banco de dados",
            description="Mapear entidades, relacionamentos e criar diagrama ER.",
            priority=Priority.HIGH,
            position=0,
            column_id=col_backlog.id,
        )
        task2 = Task(
            title="Configurar ambiente de desenvolvimento",
            description="Instalar dependências, configurar .env e rodar migrations.",
            priority=Priority.MEDIUM,
            position=1,
            column_id=col_backlog.id,
        )
        task3 = Task(
            title="Escrever introdução do TCC",
            description="Redigir contexto, problema e objetivos do trabalho.",
            priority=Priority.LOW,
            position=2,
            column_id=col_backlog.id,
        )

        # Tasks — Em Progresso
        task4 = Task(
            title="Implementar autenticação JWT",
            description="Endpoints de register, login e middleware de proteção de rotas.",
            priority=Priority.HIGH,
            position=0,
            column_id=col_doing.id,
        )
        task5 = Task(
            title="Criar componentes do Kanban no React",
            description="Board, Column e Card com drag-and-drop.",
            priority=Priority.MEDIUM,
            position=1,
            column_id=col_doing.id,
        )

        # Tasks — Revisão
        task6 = Task(
            title="Revisar endpoints de boards e columns",
            description="Testar CRUD completo via Swagger e corrigir edge cases.",
            priority=Priority.MEDIUM,
            position=0,
            column_id=col_review.id,
        )

        # Tasks — Concluído
        task7 = Task(
            title="Estrutura inicial do projeto FastAPI",
            description="Organização de pastas, main.py e configuração do Alembic.",
            priority=Priority.LOW,
            position=0,
            column_id=col_done.id,
        )

        db.add_all([task1, task2, task3, task4, task5, task6, task7])
        db.flush()
        print(f"  Tasks created: 7")

        # ------------------------------------------------------------------
        # Task ↔ Label associations
        # ------------------------------------------------------------------
        associations = [
            TaskLabel(task_id=task1.id, label_id=label_docs.id),
            TaskLabel(task_id=task2.id, label_id=label_backend.id),
            TaskLabel(task_id=task3.id, label_id=label_docs.id),
            TaskLabel(task_id=task4.id, label_id=label_backend.id),
            TaskLabel(task_id=task5.id, label_id=label_frontend.id),
            TaskLabel(task_id=task6.id, label_id=label_backend.id),
            TaskLabel(task_id=task6.id, label_id=label_bug.id),
            TaskLabel(task_id=task7.id, label_id=label_backend.id),
        ]
        db.add_all(associations)
        db.flush()

        # ------------------------------------------------------------------
        # Board — Rodrigo
        # ------------------------------------------------------------------
        board_pessoal = Board(
            title="Tarefas Pessoais",
            description="Organização de atividades do dia a dia",
            owner_id=rodrigo.id,
        )
        db.add(board_pessoal)
        db.flush()

        col_todo = Column(title="A Fazer", position=0, board_id=board_pessoal.id)
        col_done2 = Column(title="Feito", position=1, board_id=board_pessoal.id)
        db.add_all([col_todo, col_done2])
        db.flush()

        db.add_all([
            Task(title="Estudar para prova de cálculo", priority=Priority.HIGH, position=0, column_id=col_todo.id),
            Task(title="Entregar relatório de estágio", priority=Priority.MEDIUM, position=1, column_id=col_todo.id),
            Task(title="Ler artigos para o TCC", priority=Priority.LOW, position=0, column_id=col_done2.id),
        ])
        db.flush()
        print(f"  Board created: 'Tarefas Pessoais' (Rodrigo) with 3 tasks")

        # ------------------------------------------------------------------
        # Commit
        # ------------------------------------------------------------------
        db.commit()
        print("\nSeed concluído com sucesso!")
        print("\nCredenciais para teste:")
        print("  Email: henrique@moveonboard.dev  |  Senha: senha123")
        print("  Email: rodrigo@moveonboard.dev   |  Senha: senha123")

    except Exception as e:
        db.rollback()
        print(f"\nErro durante o seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

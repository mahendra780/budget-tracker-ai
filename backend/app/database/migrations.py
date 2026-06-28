from datetime import date

from sqlalchemy import inspect, text

from app.database.database import engine


def run_startup_migrations():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    current = date.today()

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS users ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "full_name VARCHAR NOT NULL, "
                "email VARCHAR NOT NULL UNIQUE, "
                "hashed_password VARCHAR NOT NULL, "
                "is_verified BOOLEAN NOT NULL, "
                "created_at DATETIME NOT NULL, "
                "reset_token VARCHAR, "
                "reset_token_expires_at DATETIME"
                ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO users "
                "(full_name, email, hashed_password, is_verified, created_at) "
                "SELECT :full_name, :email, :hashed_password, 1, datetime('now') "
                "WHERE NOT EXISTS ("
                "SELECT 1 FROM users WHERE email = :email"
                ")"
            ),
            {
                "full_name": "Default Local User",
                "email": "default@local.app",
                "hashed_password": (
                    "$2b$12$pmoh2J8ULWrsuYvsf3DWIOfKOrBL8HO"
                    "LUtrEmSBnXonYHzHPfgYGK"
                ),
            },
        )
        default_user_id = connection.execute(
            text(
                "SELECT id FROM users WHERE email = :email"
            ),
            {"email": "default@local.app"},
        ).scalar()

        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS budget_templates ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "user_id INTEGER, "
                "category VARCHAR NOT NULL, "
                "monthly_limit FLOAT NOT NULL, "
                "auto_renew BOOLEAN NOT NULL"
                ")"
            )
        )

        budget_template_columns = {
            column["name"]
            for column in inspector.get_columns("budget_templates")
        } if "budget_templates" in table_names else set()

        if "budget_templates" in table_names and "user_id" not in budget_template_columns:
            connection.execute(
                text(
                    "ALTER TABLE budget_templates "
                    "ADD COLUMN user_id INTEGER"
                )
            )
            connection.execute(
                text(
                    "UPDATE budget_templates "
                    "SET user_id = :user_id "
                    "WHERE user_id IS NULL"
                ),
                {"user_id": default_user_id},
            )

        if "transactions" in table_names:
            transaction_columns = {
                column["name"]
                for column in inspector.get_columns("transactions")
            }
            if "user_id" not in transaction_columns:
                connection.execute(
                    text(
                        "ALTER TABLE transactions "
                        "ADD COLUMN user_id INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE transactions "
                        "SET user_id = :user_id "
                        "WHERE user_id IS NULL"
                    ),
                    {"user_id": default_user_id},
                )

        if "goals" in table_names:
            goal_columns = {
                column["name"]
                for column in inspector.get_columns("goals")
            }
            if "user_id" not in goal_columns:
                connection.execute(
                    text(
                        "ALTER TABLE goals "
                        "ADD COLUMN user_id INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE goals "
                        "SET user_id = :user_id "
                        "WHERE user_id IS NULL"
                    ),
                    {"user_id": default_user_id},
                )

        if "goal_contributions" in table_names:
            contribution_columns = {
                column["name"]
                for column in inspector.get_columns("goal_contributions")
            }
            if "user_id" not in contribution_columns:
                connection.execute(
                    text(
                        "ALTER TABLE goal_contributions "
                        "ADD COLUMN user_id INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE goal_contributions "
                        "SET user_id = COALESCE(("
                        "SELECT goals.user_id FROM goals "
                        "WHERE goals.id = goal_contributions.goal_id"
                        "), :user_id) "
                        "WHERE user_id IS NULL"
                    ),
                    {"user_id": default_user_id},
                )

        if "budgets" in table_names:
            budget_columns = {
                column["name"]
                for column in inspector.get_columns("budgets")
            }

            if "user_id" not in budget_columns:
                connection.execute(
                    text(
                        "ALTER TABLE budgets "
                        "ADD COLUMN user_id INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE budgets "
                        "SET user_id = :user_id "
                        "WHERE user_id IS NULL"
                    ),
                    {"user_id": default_user_id},
                )

            if "month" not in budget_columns:
                connection.execute(
                    text(
                        "ALTER TABLE budgets "
                        "ADD COLUMN month INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE budgets "
                        "SET month = :month "
                        "WHERE month IS NULL"
                    ),
                    {"month": current.month},
                )

            if "year" not in budget_columns:
                connection.execute(
                    text(
                        "ALTER TABLE budgets "
                        "ADD COLUMN year INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE budgets "
                        "SET year = :year "
                        "WHERE year IS NULL"
                    ),
                    {"year": current.year},
                )

            connection.execute(
                text(
                    "INSERT INTO budget_templates "
                    "(user_id, category, monthly_limit, auto_renew) "
                    "SELECT b.user_id, b.category, b.monthly_limit, 1 "
                    "FROM budgets b "
                    "WHERE NOT EXISTS ("
                    "SELECT 1 FROM budget_templates bt "
                    "WHERE lower(bt.category) = lower(b.category) "
                    "AND bt.user_id = b.user_id"
                    ") "
                    "AND NOT EXISTS ("
                    "SELECT 1 FROM budgets newer "
                    "WHERE lower(newer.category) = lower(b.category) "
                    "AND newer.user_id = b.user_id "
                    "AND ("
                    "newer.year > b.year "
                    "OR (newer.year = b.year AND newer.month > b.month) "
                    "OR (newer.year = b.year "
                    "AND newer.month = b.month "
                    "AND newer.id > b.id)"
                    ")"
                    ")"
                )
            )

            if "transactions" in table_names:
                connection.execute(
                    text(
                        "INSERT INTO budgets "
                        "(user_id, category, monthly_limit, month, year) "
                        "SELECT bt.user_id, bt.category, bt.monthly_limit, "
                        "CAST(strftime('%m', t.date) AS INTEGER), "
                        "CAST(strftime('%Y', t.date) AS INTEGER) "
                        "FROM budget_templates bt "
                        "CROSS JOIN ("
                        "SELECT DISTINCT date FROM transactions "
                        "WHERE type = 'expense'"
                        ") t "
                        "WHERE bt.auto_renew = 1 "
                        "AND NOT EXISTS ("
                        "SELECT 1 FROM budgets b "
                        "WHERE lower(b.category) = lower(bt.category) "
                        "AND b.user_id = bt.user_id "
                        "AND b.month = CAST(strftime('%m', t.date) AS INTEGER) "
                        "AND b.year = CAST(strftime('%Y', t.date) AS INTEGER)"
                        ")"
                    )
                )

        if "recurring_transactions" in table_names:
            recurring_columns = {
                column["name"]
                for column in inspector.get_columns("recurring_transactions")
            }

            if "user_id" not in recurring_columns:
                connection.execute(
                    text(
                        "ALTER TABLE recurring_transactions "
                        "ADD COLUMN user_id INTEGER"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE recurring_transactions "
                        "SET user_id = :user_id "
                        "WHERE user_id IS NULL"
                    ),
                    {"user_id": default_user_id},
                )

            if "start_date" not in recurring_columns:
                connection.execute(
                    text(
                        "ALTER TABLE recurring_transactions "
                        "ADD COLUMN start_date DATE"
                    )
                )
                if "next_due_date" in recurring_columns:
                    connection.execute(
                        text(
                            "UPDATE recurring_transactions "
                            "SET start_date = next_due_date "
                            "WHERE start_date IS NULL"
                        )
                    )

            if "end_date" not in recurring_columns:
                connection.execute(
                    text(
                        "ALTER TABLE recurring_transactions "
                        "ADD COLUMN end_date DATE"
                    )
                )

            if "last_processed_date" not in recurring_columns:
                connection.execute(
                    text(
                        "ALTER TABLE recurring_transactions "
                        "ADD COLUMN last_processed_date DATE"
                    )
                )

            if "active" not in recurring_columns:
                connection.execute(
                    text(
                        "ALTER TABLE recurring_transactions "
                        "ADD COLUMN active BOOLEAN"
                    )
                )
                if "is_active" in recurring_columns:
                    connection.execute(
                        text(
                            "UPDATE recurring_transactions "
                            "SET active = is_active "
                            "WHERE active IS NULL"
                        )
                    )

            connection.execute(
                text(
                    "UPDATE recurring_transactions "
                    "SET start_date = date('now') "
                    "WHERE start_date IS NULL"
                )
            )
            connection.execute(
                text(
                    "UPDATE recurring_transactions "
                    "SET active = 1 "
                    "WHERE active IS NULL"
                )
            )

            if (
                "next_due_date" in recurring_columns
                or "is_active" in recurring_columns
            ):
                connection.execute(
                    text("DROP TABLE IF EXISTS recurring_transactions_new")
                )
                connection.execute(
                    text(
                        "CREATE TABLE recurring_transactions_new ("
                        "id INTEGER NOT NULL PRIMARY KEY, "
                        "user_id INTEGER, "
                        "title VARCHAR NOT NULL, "
                        "amount FLOAT NOT NULL, "
                        "type VARCHAR NOT NULL, "
                        "category VARCHAR NOT NULL, "
                        "frequency VARCHAR NOT NULL, "
                        "start_date DATE NOT NULL, "
                        "end_date DATE, "
                        "last_processed_date DATE, "
                        "active BOOLEAN NOT NULL"
                        ")"
                    )
                )
                connection.execute(
                    text(
                        "INSERT INTO recurring_transactions_new "
                        "(id, user_id, title, amount, type, category, frequency, "
                        "start_date, end_date, last_processed_date, active) "
                        "SELECT id, user_id, title, amount, type, category, "
                        "lower(frequency), start_date, end_date, "
                        "last_processed_date, active "
                        "FROM recurring_transactions"
                    )
                )
                connection.execute(text("DROP TABLE recurring_transactions"))
                connection.execute(
                    text(
                        "ALTER TABLE recurring_transactions_new "
                        "RENAME TO recurring_transactions"
                    )
                )

    if "goal_contributions" not in table_names:
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("goal_contributions")
    }

    with engine.begin() as connection:
        if "created_at" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE goal_contributions "
                    "ADD COLUMN created_at DATE"
                )
            )
            connection.execute(
                text(
                    "UPDATE goal_contributions "
                    "SET created_at = date "
                    "WHERE created_at IS NULL"
                )
            )

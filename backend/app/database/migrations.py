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
                "CREATE TABLE IF NOT EXISTS budget_templates ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "category VARCHAR NOT NULL, "
                "monthly_limit FLOAT NOT NULL, "
                "auto_renew BOOLEAN NOT NULL"
                ")"
            )
        )

        if "budgets" in table_names:
            budget_columns = {
                column["name"]
                for column in inspector.get_columns("budgets")
            }

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
                    "(category, monthly_limit, auto_renew) "
                    "SELECT b.category, b.monthly_limit, 1 "
                    "FROM budgets b "
                    "WHERE NOT EXISTS ("
                    "SELECT 1 FROM budget_templates bt "
                    "WHERE lower(bt.category) = lower(b.category)"
                    ") "
                    "AND NOT EXISTS ("
                    "SELECT 1 FROM budgets newer "
                    "WHERE lower(newer.category) = lower(b.category) "
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
                        "(category, monthly_limit, month, year) "
                        "SELECT bt.category, bt.monthly_limit, "
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
                        "(id, title, amount, type, category, frequency, "
                        "start_date, end_date, last_processed_date, active) "
                        "SELECT id, title, amount, type, category, "
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

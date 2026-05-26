from sqlalchemy import inspect, text

from app.database.database import engine


def run_startup_migrations():
    inspector = inspect(engine)

    if "goal_contributions" not in inspector.get_table_names():
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

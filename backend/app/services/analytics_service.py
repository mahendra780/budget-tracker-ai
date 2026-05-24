import pandas as pd


def transactions_to_dataframe(transactions):
    data = []

    for transaction in transactions:
        data.append({
            "id": transaction.id,
            "title": transaction.title,
            "amount": transaction.amount,
            "type": transaction.type,
            "category": transaction.category,
            "date": transaction.date
        })

    return pd.DataFrame(data)
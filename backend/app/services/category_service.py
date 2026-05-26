EXPENSE_CATEGORIES = {
    "food": "Food",
    "travel": "Travel",
    "shopping": "Shopping",
    "bills": "Bills",
    "entertainment": "Entertainment",
    "healthcare": "Healthcare",
    "education": "Education",
    "savings": "Savings",
    "other": "Other",
}

INCOME_CATEGORIES = {
    "salary": "Salary",
    "freelance": "Freelance",
    "business": "Business",
    "investment": "Investment",
    "bonus": "Bonus",
    "other": "Other",
}


def normalize_category(category: str) -> str:
    cleaned = " ".join(category.strip().split())
    key = cleaned.lower()

    return (
        EXPENSE_CATEGORIES.get(key)
        or INCOME_CATEGORIES.get(key)
        or cleaned.title()
    )

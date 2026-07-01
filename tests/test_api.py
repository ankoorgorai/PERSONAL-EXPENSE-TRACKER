import unittest
from fastapi.testclient import TestClient
import api


class ExpenseApiTests(unittest.TestCase):
    def setUp(self):
        api.Base.metadata.drop_all(bind=api.engine)
        api.Base.metadata.create_all(bind=api.engine)
        self.client = TestClient(api.app)

    def test_post_and_get_expense_returns_full_fields(self):
        payload = {
            "amount": 12.5,
            "category": "Food",
            "description": "Lunch",
            "date": "2026-06-26",
        }

        post_response = self.client.post("/api/expenses/", json=payload)
        self.assertEqual(post_response.status_code, 201)

        data = post_response.json()
        self.assertEqual(data["amount"], 12.5)
        self.assertEqual(data["category"], "Food")
        self.assertEqual(data["description"], "Lunch")
        self.assertEqual(data["date"], "2026-06-26")


if __name__ == "__main__":
    unittest.main()

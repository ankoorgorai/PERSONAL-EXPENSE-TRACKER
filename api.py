
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import date

# ✅ SQLite database (NO MySQL needed)
DATABASE_URL = "sqlite:///./expense_tracker.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ExpenseDB(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(255))
    date = Column(Date, nullable=False)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExpenseIn(BaseModel):
    amount: float
    category: str
    description: str = ""
    date: date

class ExpenseOut(BaseModel):
    id: int
    amount: float
    category: str
    description: str = ""
    date: date

    class Config:
        from_attributes = True

@app.get("/api")
def root():
    return {"status": "API running"}

app.mount("/", StaticFiles(directory=".", html=True), name="static")

@app.get("/expenses/", response_model=List[ExpenseOut])
def get_expenses():
    db = SessionLocal()
    expenses = db.query(ExpenseDB).all()
    db.close()
    return expenses

@app.post("/expenses/", response_model=ExpenseOut, status_code=201)
def add_expense(expense: ExpenseIn):
    db = SessionLocal()
    new_expense = ExpenseDB(
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    db.close()
    return new_expense

@app.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int):
    db = SessionLocal()
    expense = db.query(ExpenseDB).filter(ExpenseDB.id == expense_id).first()
    if not expense:
        db.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    db.close()

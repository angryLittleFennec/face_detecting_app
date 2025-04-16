from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Person as PersonDB
from ..schemas import PersonCreate, Person

router = APIRouter(prefix="/persons", tags=["persons"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Person, status_code=status.HTTP_201_CREATED)
def create_person(person: PersonCreate, db: Session = Depends(get_db)):
    db_person = PersonDB(name=person.name)
    db.add(db_person)
    try:
        db.commit()
        db.refresh(db_person)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating person: {str(e)}"
        )
    return db_person

@router.get("/", response_model=list[Person])
def get_all_persons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(PersonDB).offset(skip).limit(limit).all()
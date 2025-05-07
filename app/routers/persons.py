from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Person as PersonDB, User
from ..schemas import PersonCreate, Person
from .. import auth

router = APIRouter(prefix="/persons", tags=["persons"])

@router.post("/", response_model=Person, status_code=status.HTTP_201_CREATED)
def create_person(
    person: PersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    db_person = PersonDB(
        name=person.name
    )
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
def get_all_persons(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    return db.query(PersonDB).offset(skip).limit(limit).all()

@router.delete("/{person_id}")
def delete_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_active_user)
):
    person = db.query(PersonDB).filter(
        PersonDB.id == person_id
    ).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    db.delete(person)
    db.commit()
    return {"detail": "Person deleted"}
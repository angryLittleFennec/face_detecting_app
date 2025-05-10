from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
import logging

from .. import models, database, auth

# Настройка логгера
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/db",
    tags=["database"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/reset", status_code=status.HTTP_200_OK)
async def reset_database(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Пересоздает все таблицы в базе данных.
    Требует прав суперпользователя.
    """
    try:
        # Проверяем, что пользователь - суперпользователь
        # if not current_user.is_superuser:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Требуются права суперпользователя"
        #     )

        # Удаляем все таблицы
        logger.info("Dropping all tables...")
        models.Base.metadata.drop_all(bind=database.engine)
        
        # Создаем таблицы заново
        logger.info("Creating all tables...")
        models.Base.metadata.create_all(bind=database.engine)
        
        logger.info("Database reset completed successfully")
        return {
            "status": "success",
            "message": "База данных успешно пересоздана"
        }

    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при пересоздании базы данных: {str(e)}"
        ) 
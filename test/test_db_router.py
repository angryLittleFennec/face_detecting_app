import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app.routers.db import get_db, reset_database
from app import models, database

@pytest.fixture
def mock_db_session():
    session = MagicMock()
    session.close = MagicMock()
    return session

@pytest.fixture
def mock_current_user():
    user = MagicMock()
    user.is_superuser = True
    return user

def test_get_db(mock_db_session):
    with patch('app.routers.db.database.SessionLocal', return_value=mock_db_session):
        db_gen = get_db()
        db = next(db_gen)
        assert db == mock_db_session
        try:
            next(db_gen)
        except StopIteration:
            pass
        mock_db_session.close.assert_called_once()

@pytest.mark.asyncio
async def test_reset_database_success(mock_current_user, mock_db_session):
    with patch('app.routers.db.database.SessionLocal', return_value=mock_db_session), \
         patch('app.routers.db.models.Base.metadata.drop_all') as mock_drop, \
         patch('app.routers.db.models.Base.metadata.create_all') as mock_create:
        result = await reset_database(current_user=mock_current_user, db=mock_db_session)
        assert result["status"] == "success"
        mock_drop.assert_called_once()
        mock_create.assert_called_once()

@pytest.mark.asyncio
async def test_reset_database_error(mock_current_user, mock_db_session):
    with patch('app.routers.db.database.SessionLocal', return_value=mock_db_session), \
         patch('app.routers.db.models.Base.metadata.drop_all', side_effect=Exception("Test error")):
        with pytest.raises(HTTPException) as excinfo:
            await reset_database(current_user=mock_current_user, db=mock_db_session)
        assert excinfo.value.status_code == 500 
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

function ProfilePage({ onLogout }) {
    const navigate = useNavigate();

    const logoutHandler = () => {
        onLogout();
        navigate('/');
    };

    const goToCamerasHandler = () => {
        navigate('/cameras');
    };

    return (
        <>
            <div className="main-content">
                <h1>ProfilePage</h1>
            </div>
            <div className="menu">
                <button onClick={goToCamerasHandler}>Назад</button>
                <button className="logout-button" onClick={logoutHandler}>
                    Выход
                </button>
            </div>
        </>
    );
}

export default ProfilePage;

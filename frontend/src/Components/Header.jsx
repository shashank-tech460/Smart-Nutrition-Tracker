import { UserContext } from "../contexts/UserContext";
import { useContext } from "react";
import logoImage from '../assets/logo.png';
import { useNavigate, Link } from "react-router-dom";
export default function Header()
{

    const loggedData = useContext(UserContext);
    const navigate = useNavigate();

    function logout()
    {
        localStorage.removeItem("nutrify-user");
        loggedData.setLoggedUser(null);
        navigate("/login");

    }
    function diet(){
        navigate("/diet");
    }
    function track(){
        navigate("/track");
    }
    function home(){
        navigate("/home");
    }
    function profile(){
        navigate("/profile");
    }
    function community(){
        navigate("/community"); 
    }
    function workout(){
        navigate("/generateWorkout"); 
    }
    function Nutrition(){
        navigate("/advice"); 
    }

    return (
        <div>
            <header className="p-3 mb-3 border-bottom">
                <div className="container">
                <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
                <a href="#" class="d-block link-body-emphasis text-decoration-none "  aria-expanded="false">
                        <img className="d-block w-100" src={logoImage} alt="Today's Meal Plan" width="32" height="32" class="rounded-circle"/>
                    </a>

                    <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0"  style={{ cursor: 'pointer' }}>
                    <li onClick={home} className="nav-link px-2 link-secondary">Home</li>
                    <li onClick={profile} className="nav-link px-2 link-body-emphasis">Profile</li>
                    <li onClick={track} className="nav-link px-2 link-body-emphasis">Track</li> 
                    <li onClick={diet} className="nav-link px-2 link-body-emphasis">Diet</li> 
                    <li onClick={community} className="nav-link px-2 link-body-emphasis">Community</li> 
                    <li onClick={workout} className="nav-link px-2 link-body-emphasis">WorkOut</li>
                    <li onClick={Nutrition} className="nav-link px-2 link-body-emphasis">Nutrition</li>
                    <li onClick={logout} className="nav-link px-2 link-body-emphasis">Logout</li>

                    
                    </ul>
                </div>
                </div>
            </header>
            


        </div>
    )
}
/*
<ul>
                    <Link to="/track"><li>Track</li></Link>
                    <Link to="/diet"><li>Diet</li></Link>
                    <li onClick={logout}>Logout</li>
                </ul> 
                
                
                <form className="col-12 col-lg-auto mb-3 mb-lg-0 me-lg-3" role="search">
                    <input type="search" className="form-control" placeholder="Search..." aria-label="Search" />
                    </form> */
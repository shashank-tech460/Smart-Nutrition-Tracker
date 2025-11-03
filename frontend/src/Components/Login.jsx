import { useState,useContext,useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { Link ,useNavigate} from 'react-router-dom';


function Login() {
    const loggedData=useContext(UserContext);
    const navigate=useNavigate();
    const [userCreds, setUserCreds] = useState({
        email: "",
        password: ""
    });
    
    const [message, setMessage] = useState({
        type: "invisible-msg",
        text: ""
    }); 
    function handleInput(event) {
        setUserCreds((prevState) => {
            return { ...prevState, [event.target.name]: event.target.value };
        });
    }

    function handleSubmit(event) {
        event.preventDefault();
        console.log(userCreds);

        fetch("http://localhost:8000/login", {
            method: "POST",
            body: JSON.stringify(userCreds),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then((response) => {
            if (response.status == 404) {
                setMessage({type:"error",text:"Username or Email doesnt exist"})
               
            }
            else if (response.status == 403) {
                setMessage({type:"error",text:"InCorrect Password"})
                
            } else if(response.status == 200){
            return response.json();
            }
            
            setTimeout(() =>{
                setMessage({type:"invisible-msg",text:"h"})
              },5000);
        })
        .then((data) => {
            
            if (data.token!==undefined) { 
                
                localStorage.setItem("nutrify-user", JSON.stringify(data));
                loggedData.setLoggedUser(data); // Only execute if login was successful              
                navigate("/Home");
            }
        })
        .catch((err) => {
            console.log(err);
            setMessage({ type: "error", text: "Login failed. Please check your credentials." });
        });
    }

    return (
        <section className="form-block">
            <form className="form" onSubmit={handleSubmit}>
                <h1>Get Started</h1>
                <input 
                    className="input" 
                    required 
                    type="email" 
                    onChange={handleInput} 
                    name="email"  // Make sure this has name attribute for state management
                    placeholder="Enter Email" 
                    value={userCreds.email}
                />
                <input 
                    className="input" 
                    type="password" 
                    onChange={handleInput} 
                    name="password"  // Make sure this has name attribute for state management
                    placeholder="Enter Password" 
                    value={userCreds.password}
                />
                <button className="btn">Login</button>
                <h3>Don't have an Account? <Link to="/Register" className="link"> Register</Link></h3>
                <p className={message.type}>{message.text}</p>
            </form>
        </section>
    );
}

export default Login;

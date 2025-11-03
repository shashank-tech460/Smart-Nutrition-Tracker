import { useState } from 'react';
import { Link } from 'react-router-dom';

function Register() { 
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    password: "",
    age: ""
  });

  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [message, setMessage] = useState({
    type: "invisible-msg",
    text: ""
  });

  function handleInput(event) {
    setUserDetails(prevState => {
      return { ...prevState, [event.target.name]: event.target.value };
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    fetch("http://localhost:8000/register/generate-otp", {
      method: "POST",
      body: JSON.stringify({ email: userDetails.email }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setMessage({ type: "success", text: "OTP sent to your email." });
        setIsOtpSent(true);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    })
    .catch(err => console.log(err));
  }

  function handleOtpVerification(event) {
    event.preventDefault();

    fetch("http://localhost:8000/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({ ...userDetails, otp }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setMessage({ type: "success", text: "Registration successful!" });
        setUserDetails({
          name: "",
          email: "",
          password: "",
          age: ""
        });
        setOtp("");
        setIsOtpSent(false);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    })
    .catch(err => console.log(err));
  }

  return (
    <section className="form-block">
      <form className="form" onSubmit={isOtpSent ? handleOtpVerification : handleSubmit}>
        <h1>Start Your Fitness Journey</h1>

        <input className="input" type="text" required onChange={handleInput} name="name" placeholder="Enter Name" value={userDetails.name} />
        <input className="input" type="email" required onChange={handleInput} name="email" placeholder="Enter Email" value={userDetails.email} />
        <input className="input" type="password" required maxLength={8} onChange={handleInput} name="password" placeholder="Enter Password" value={userDetails.password} />
        <input className="input" type="number" min={12} onChange={handleInput} name="age" placeholder="Enter Age" value={userDetails.age} />

        {isOtpSent && (
          <input className="input" type="text" required onChange={(e) => setOtp(e.target.value)} name="otp" placeholder="Enter OTP" value={otp} />
        )}

        <button className="btn">{isOtpSent ? "Verify OTP" : "JOIN"}</button>

        <h3>
          Already Registered? <Link to="/login" className='link'>Login</Link>
        </h3>
        <p className={message.type}>{message.text}</p>
      </form>
    </section>
  );
}

export default Register;

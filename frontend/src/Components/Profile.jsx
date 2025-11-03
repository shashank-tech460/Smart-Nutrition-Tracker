import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const Profile = () => {
  const loggedData = useContext(UserContext);
  /*const [userPhysics, setPhysicalInfo] = useState({
    height: "",
    weight: "",
    bmi: ""
  }); */
   
  const navigate=useNavigate();
  const handleChatClick = () => {
    navigate('/chat'); // Replace with the actual path for the chat page
  };

  const handleProfileClick = () => {
    navigate('/userinfo'); // Replace with the actual path for the profile page
  };
  const [weight, setWeight] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(0);

  const [profilePhoto, setProfilePhoto] = useState(""); // Profile photo state
  const [calorieIntake, setCalorieIntake] = useState(0);
  const [items, setItems] = useState([]);
  const [calorieGoal, setCalorieGoal]=useState(2000);
  
  const [date, setDate] = useState(new Date());
  
  let [total, setTotal] = useState({
      totalCaloreis:0,
      totalProtein:0,
      totalCarbs:0,
      totalFats:0,
      totalFiber:0
  });

  useEffect(() => {
    // Fetch user info to get weight and set water goal
    fetch(`https://smart-nutrition-tracker-f9e0.onrender.com/userinfo/${loggedData.loggedUser.userid}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${loggedData.loggedUser.token}`,
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.weight) {
        setWeight(data.weight);
        setWaterGoal(data.weight * 0.03); // Calculate water goal
      }
      if (data.dailyCalorieRequirement) {
        setCalorieGoal(data.dailyCalorieRequirement); // Set calorie goal
      }
    })
    .catch(error => {
      console.error('Error fetching user info:', error);
    });
  }, [loggedData.loggedUser]);
  
  // Fetch profile photo when component mounts or when userId changes
  useEffect(() => {
    if (loggedData.loggedUser && loggedData.loggedUser.userid) {
      fetch(`https://smart-nutrition-tracker-f9e0.onrender.com/upload_profile_photo/${loggedData.loggedUser.userid}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${loggedData.loggedUser.token}`,
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.image) {
          setProfilePhoto(data.image);  // Set the base64 image data
        } else {
          console.log('No profile photo found');
        }
      })
      .catch(error => {
        console.error('Error fetching profile photo:', error);
      });
    }
  }, [loggedData.loggedUser]);

  function calculateTotal() {
    let totalCopy = {
      totalCaloreis: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalFiber: 0
    };
    items.forEach((item) => {
      totalCopy.totalCaloreis += item.details.calories;
      totalCopy.totalProtein += item.details.protein;
      totalCopy.totalCarbs += item.details.carbohydrates;
      totalCopy.totalFats += item.details.fat;
      totalCopy.totalFiber += item.details.fiber;
    });
    setTotal(totalCopy);
    setCalorieIntake(totalCopy.totalCaloreis);
  }
  const caloriePercenatge=((calorieIntake/calorieGoal)*100).toFixed(2);
  
  useEffect(() => {
    fetch(`https://smart-nutrition-tracker-f9e0.onrender.com/track/${loggedData.loggedUser.userid}/${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${loggedData.loggedUser.token}`
      }
    })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      setItems(data);
    })
    .catch((err) => {
      console.log(err);
    });
  }, [date]);

  useEffect(() => { calculateTotal(); }, [items]); 
 
  useEffect(() => {
    if (loggedData.loggedUser && loggedData.loggedUser.userid) {
      // Get the current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
  
      fetch(`https://smart-nutrition-tracker-f9e0.onrender.com/water_intake/${loggedData.loggedUser.userid}/${currentDate}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${loggedData.loggedUser.token}`,
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.waterConsumed) {
          setWaterIntake(data.waterConsumed); // Set water intake from DB
        }
      })
      .catch(error => {
        console.error('Error fetching water intake:', error);
      });
    }
  }, [loggedData.loggedUser]);
  
  const handleAddGlass = () => {
    setWaterIntake(prevIntake => {
      const newIntake = prevIntake + 0.2; // Adding 200 ml (0.2 liters)
      if (newIntake > waterGoal) {
        return waterGoal; // Limit the water intake to the goal
      }
      return newIntake;
    });
  
    // Get the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
  
    // Make POST request to log the water intake
    fetch('https://smart-nutrition-tracker-f9e0.onrender.com/water_intake', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${loggedData.loggedUser.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: loggedData.loggedUser.userid,
        date: currentDate, // Pass the current date
        waterConsumed: 0.2, // Adding 200 ml (0.2 liters)
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Water intake updated in DB:", data);
    })
    .catch(error => {
      console.error("Error updating water intake:", error);
    });
  };
  

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', loggedData.loggedUser.userid);
  
      // Send the image as FormData
      fetch('https://smart-nutrition-tracker-f9e0.onrender.com/upload_profile_photo', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${loggedData.loggedUser.token}`,
        },
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        console.log('Image uploaded successfully:', data);
      })
      .catch(error => {
        console.error('Error uploading image:', error);
      });
    }
  };
  
  const chartData = {
    labels: ['Protein', 'Carbohydrates', 'Fats', 'Fiber'],
    datasets: [{
      label: 'Daily Macronutrient Intake',
      data: [total.totalProtein, total.totalCarbs, total.totalFats, total.totalFiber],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#2AAA8A'],
      hoverOffset: 4,
    }],
   
  };

  const handleWaterIntakeChange = (event) => {
    const newWaterIntake = event.target.value;
    setWaterIntake(newWaterIntake);

    // Send the water intake data to the backend
    fetch('https://smart-nutrition-tracker-f9e0.onrender.com/water_intake', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${loggedData.loggedUser.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: loggedData.loggedUser.userid,
        date: new Date(),
        waterConsumed: newWaterIntake
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Water intake logged:', data);
    })
    .catch(error => {
      console.error('Error logging water intake:', error);
    });
  };

  return (
    <section>
      <Header />
      <div className="profile-container">
        {/* Left Container - Profile Photo, Name, Edit Profile */}
        <div className="profile-left">
          <div className="profile-photo">
            <img src={profilePhoto ? `data:image/jpeg;base64,${profilePhoto}` : "https://via.placeholder.com/150"} 
               alt="Profile" />
          <div className="profile-upload" onClick={() => document.getElementById('fileInput').click()}>
            +
          </div>
          <input 
            type="file" 
            id="fileInput" 
            onChange={handlePhotoUpload} 
            style={{ display: 'none' }} 
          />
          </div>
          <h6>Be your own reason to smile: A smile can be a great defense against a difficult day</h6>
          <div className="profile-details">
            <h3>{loggedData.loggedUser.name}</h3>
            <div className="btn-group">
            <button className='chat' onClick={handleChatClick}> Chat</button>
            <button className="edit-profile" onClick={handleProfileClick}>Profile</button>
            </div>
          </div>
        </div>

        <div className='set-goal'>
          <h3>Today's Journey</h3>
          <p> Calories consumed :{calorieIntake } kcal</p>
          <p> Calorie Goal : {calorieGoal} kcal </p>
          <p> You have reached {caloriePercenatge}% of Your Daily goal</p>
          <progress value={caloriePercenatge} max="100">{caloriePercenatge}%</progress>

        </div>

          <div className="profile-chart">
            <h3>Daily Calorie Intake</h3>
            <input type="date" onChange={(event) => { setDate(new Date(event.target.value)); }} />
            <div className="chart-placeholder" style={{ height: '270px' }}>
              <Pie data={chartData}  />
            </div>
          </div>
        </div>
        <div className="water-monitor">
      <h3>Water Intake</h3>
      <p>Your Water Goal: {waterGoal.toFixed(2)} liters</p>
      <p>Water Consumed: {waterIntake.toFixed(2)} liters</p>

      {/* "One Glass" button to add 200 ml to the water intake */}
      <button onClick={handleAddGlass}>Add One Glass (200ml)</button>
    </div>
    </section>
  );
};

export default Profile;

/* const handleSubmit = (e) => {
    e.preventDefault();

    const physicalData = {
      userId: loggedData.loggedUser.userid,
      weight: userPhysics.weight,
      height: userPhysics.height,
      bmi: userPhysics.bmi,
    };

    console.log("Data to be sent:", physicalData);
    fetch("https://smart-nutrition-tracker-f9e0.onrender.com/physical_info", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${loggedData.loggedUser.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(physicalData)
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data posted successfully:", data);
      alert("Physical info submitted successfully!");
    })
    .catch((error) => {
      console.error("Error posting data:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      alert("Failed to submit physical info!");
    });
  }; */
   
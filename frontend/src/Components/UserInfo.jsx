import React, { useContext, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { useEffect } from 'react';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
const UserInfo = () => {
    const loggedData = useContext(UserContext);
     const navigate=useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        bloodGroup: '',
        email: '',
        contactNumber: '',
        activityLevel: '',
        allergies: '',
        healthConditions: '',
        fitnessGoal: '',
        dietaryPreferences: '',
        foodPreferences: '',
        hobbies: '',
        bmi: '',
        dailyCalorieRequirement: ''
    });
    const handleMealPlan=() =>{
     navigate('/generateMeal');
    }
    const [errorMessage, setErrorMessage]=useState('');
    // Function to handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Function to calculate BMI
    const calculateBMI = () => {
        const heightInMeters = formData.height / 100; // Convert height from cm to meters
        const bmiValue = formData.weight / (heightInMeters * heightInMeters);
        return bmiValue.toFixed(2); // Return BMI with 2 decimal places
    };

    // Function to suggest daily calorie requirement based on activity level and goal
    const suggestCalories = () => {
        let bmr;
        
        // Calculate BMR based on gender
        if (formData.gender === 'Male') {
            bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5; // Male BMR formula
            console.log(bmr);
        } else if (formData.gender === 'Female') {
            bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age - 161; // Female BMR formula
        } else {
            return "Please provide a valid gender"; // Gender is missing
        }
    
        let multiplier = 1;
    
        // Adjust multiplier based on activity level
        switch (formData.activityLevel) {
            case 'Sedentary':
                multiplier = 1.2;
                break;
            case 'Lightly Active':
                multiplier = 1.375;
                break;
            case 'Moderately Active':
                multiplier = 1.55;
                break;
            case 'Very Active':
                multiplier = 1.725;
                break;
            case 'Extra Active':
                multiplier = 1.9;
                break;
            default:
                multiplier = 1;
        }
    
        const totalCalories = bmr * multiplier;
      
    
        // Adjust calorie intake based on BMI
        if (formData.bmi < 18.5) { // Underweight
            return Math.round(totalCalories + 500); // Suggest higher intake for weight gain
        } else if (formData.bmi > 24.9) { // Overweight/Obesity
            return Math.round(totalCalories - 500); // Suggest lower intake for weight loss
        } else {
            return Math.round(totalCalories); // Healthy weight, maintain current intake
        }
    };
    
    

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const userId = loggedData.loggedUser.userid;

                if (!userId) {
                    setErrorMessage('User ID is missing.');
                    return;
                }

                const response = await fetch(`http://localhost:8000/userinfo/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loggedData.loggedUser.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (response.ok && data) {
                    setFormData({
                        ...formData,
                        ...data, // Pre-fill form fields with existing user data
                        bmi: data.bmi || calculateBMI(data.height, data.weight),
                        dailyCalorieRequirement: data.dailyCalorieRequirement || suggestCalories(data.activityLevel)
                    });
                } else {
                    setErrorMessage('Failed to fetch user info.');
                }
            } catch (err) {
                console.error('Error fetching user info:', err);
                setErrorMessage('Failed to fetch user data.');
            }
        };

        fetchUserInfo();
    }, []);
    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const calculatedBMI = calculateBMI();
        const calorieRequirement = suggestCalories();
    
        const userId = loggedData.loggedUser.userid; 
    
        if (!userId) {
            console.error('User ID is missing');
            setErrorMessage('User ID is missing');
            return;
        }
    
        // Ensure userId is included in formData
        const updatedFormData = {
            ...formData,
            bmi: calculatedBMI,
            dailyCalorieRequirement: calorieRequirement,
            userId // Ensure userId is part of form data when sending
        };
    
        try {
            const response = await fetch(`http://localhost:8000/userinfo`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${loggedData.loggedUser.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedFormData), // Send updated formData
            });
            const data = await response.json();
    
            if (!response.ok) {
                setErrorMessage(data.message || "Something Went Wrong");
            } else {
                console.log(data);
                setErrorMessage('');
            }
        } catch (err) {
            console.error('Error:', err);
            setErrorMessage('Failed to Submit data');
        }
    };
    
    const isBmiHigh = formData.bmi && formData.bmi > 25;
  const isBmiPerfect =  formData.bmi &&  formData.bmi > 18.5 &&  formData.bmi < 25;
  const isBmiLow =  formData.bmi &&  formData.bmi < 18.5;
    return (
        
        <section>
            <Header />
        <form onSubmit={handleSubmit} className="diet-planner-form">
            <h2>Diet Planner</h2>
            {errorMessage && <p style={{ color:'red'}} >{errorMessage}</p>}
            {/* Personal Information */}
            <label>
                First Name:
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </label>
            <label>
                Last Name:
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </label>
            <label>
                Age:
                <input type="number" name="age" value={formData.age} onChange={handleChange} required />
            </label>
            <label>
                Gender:
                <select style={{color:'white'}} name="gender" value={formData.gender} onChange={handleChange} required>
                    <option  value="" disabled>Select your gender</option>
                    <option  value="Male">Male</option>
                    <option  value="Female">Female</option>
                    <option  value="Other">Other</option>
                </select>
            </label>
            <label>
                Height (cm):
                <input type="number" name="height" value={formData.height} onChange={handleChange} required />
            </label>
            <label>
                Weight (kg):
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} required />
            </label>
            <label>
                Blood Group:
              {/*<input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required /> --> */}
                <select name='bloodGroup'style={{color:'white'}} value={formData.bloodGroup} onChange={handleChange} required>
                    <option value="" disabled>Select your Blood Group</option>
                    <option value="O+">O+</option>
                    <option value="O">O</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="B+">B+</option>
                    <option value="AB">AB</option>
                    <option value="AB+">AB+</option>
                </select>
            </label>
            <label>
                Email:
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label>
                Contact Number:
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
            </label>

            {/* Health & Fitness Information */}
            <label>
                Activity Level:
                <select style={{color:'white'}} name="activityLevel" value={formData.activityLevel} onChange={handleChange} required>
                    <option value="" disabled>Select activity level</option>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly Active">Lightly Active</option>
                    <option value="Moderately Active">Moderately Active</option>
                    <option value="Very Active">Very Active</option>
                </select>
            </label>
            <label>
                Allergies:
                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} />
            </label>
            <label>
                Health Conditions (Optional):
                <input type="text" name="healthConditions" value={formData.healthConditions} onChange={handleChange} />
            </label>
            <label>
                Fitness Goal:
                <select style={{color:'white'}} name="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange} required>
                    <option value="" disabled>Select fitness goal</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Maintain Weight">Maintain Current Weight</option>
                </select>
            </label>

            {/* Additional Metrics */}
            <label>
                Dietary Preferences:
                <select style={{color:'white'}} name="dietaryPreferences" value={formData.dietaryPreferences} onChange={handleChange}>
                    <option value="" disabled>Select dietary preference</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                </select>
            </label>
            <label>
                Food Preferences:
                <input type="text" name="foodPreferences" value={formData.foodPreferences} onChange={handleChange} 
                />
            </label>
            <label>
                Hobbies (Optional):
                <input type="text" name="hobbies" value={formData.hobbies} onChange={handleChange} />
            </label>

            {/* Calculated Results */}
            <label>
                BMI: {formData.bmi && <span>{formData.bmi}</span>}
            </label>
            <label>
                Suggested Daily Calorie Intake: {formData.dailyCalorieRequirement && <span>{formData.dailyCalorieRequirement} kcal</span>}
            </label>
            
            <button className="bmi-cal" type="submit" >Submit</button>
            <button className='meal-plan' onClick={handleMealPlan} >Meal Plan</button>
            
            
           
        
        </form>
        {isBmiHigh && (
            <div className="bmi-badge" style={{
              backgroundColor: '#f44336',
              color: '#fff',
              padding: '10px',
              borderRadius: '5px',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              Your BMI is above the Normal range!
            </div>
          )}
          {isBmiPerfect && (
            <div className="bmi-badge" style={{
              backgroundColor: '#2AAA8A',
              color: '#fff',
              padding: '10px',
              borderRadius: '5px',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              Your BMI is perfectly in the Normal range!
            </div>
          )}
          {isBmiLow && (
            <div className="bmi-badge" style={{
              backgroundColor: '#9ACD32',
              color: '#fff',
              padding: '10px',
              borderRadius: '5px',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              Your BMI is below the Normal range!
            </div>
          )}
        </section>
        
    );
};

export default UserInfo;

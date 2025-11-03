import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import '../styles.css'; // Import the CSS file
import { UserContext } from '../contexts/UserContext';

const MealPlanGenerator = () => {
  const { loggedUser } = useContext(UserContext); // Destructure to get loggedUser from context
  const [userData, setUserData] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user data from the database when loggedUser is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!loggedUser?.userid) {
        console.error("User ID is not available");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8000/userinfo/${loggedUser.userid}`); // Ensure API endpoint is correct
        setUserData(response.data);
      } catch (err) {
        console.error('Failed to fetch user data', err);
        setError('Failed to fetch user data');
      }
    };

    if (loggedUser?.userid) {
      fetchUserData();
    }
  }, [loggedUser]);

  // Generate meal plan once userData is fetched
  useEffect(() => {
    const generateMealPlan = async () => {
      if (!userData) return;

      setLoading(true);
      setError(null);

      const { age, weight, height, gender, activityLevel, numOfMeals, dietPreference, healthSpec } = userData;

      // Calculate BMR
      let bmr;
      if (gender === 'male') {
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else if (gender === 'female') {
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
      }

      const calories = Math.round(bmr * activityLevel);
      const totalMeals = numOfMeals * 7; // Fetch enough meals for a week

      // Edamam API details
      const APP_ID = '8105462b'; // Replace with your APP_ID
      const APP_KEY = 'b143670346694219bd06e3f2d9cca02e'; // Replace with your APP_KEY

      // API endpoint
      const apiUrl = `https://api.edamam.com/search?q=${dietPreference}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=${totalMeals}&calories=${calories}&health=${healthSpec}`;

      try {
        const response = await axios.get(apiUrl);
        setMealPlan(response.data.hits);
      } catch (error) {
        setError('Failed to fetch meal plan');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      generateMealPlan();
    }
  }, [userData]);

  return (
    <div className="meal-plan-container">
      <h1>Meal Plan Generator</h1>

      <div id="mealPlanDisplay">
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {mealPlan && (
          <table>
            <thead>
              <tr>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: userData.numOfMeals }).map((_, i) => (
                <tr key={i}>
                  {mealPlan.slice(i * 7, i * 7 + 7).map((meal, j) => (
                    <td key={j}>
                      <h3>{meal.recipe.label}</h3>
                      <img src={meal.recipe.image} alt={meal.recipe.label} style={{ width: '100%', maxWidth: '200px' }} />
                      <a href={meal.recipe.url} target="_blank" rel="noopener noreferrer">
                        View Recipe
                      </a>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MealPlanGenerator;

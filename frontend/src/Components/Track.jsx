import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import Header from './Header';
import './FoodSearchApp.css'; // Importing the CSS file for styling

const Track = () => {
  const loggedData = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [eatenQuantity, setEatenQuantity] = useState({}); // Object to track quantities for each food item

  const handleSearch = async (event) => {
    event.preventDefault();

    const apiUrl = 'https://edamam-food-and-grocery-database.p.rapidapi.com/auto-complete';
    const headers = {
      'X-RapidAPI-Key': 'b67f406295mshfe69c296017a625p1fb200jsn749987e75357',
      'X-RapidAPI-Host': 'edamam-food-and-grocery-database.p.rapidapi.com',
    };

    try {
      const response = await axios.get(apiUrl, { headers, params: { q: searchQuery } });
      const foodNames = response.data;
     
      if (foodNames && foodNames.length > 0) {
      const foodDetailsPromises = foodNames.map(food => fetchFoodDetails(food));
      const foodDetails = await Promise.all(foodDetailsPromises);

    /*  const uniqueFoodDetails = Array.from(new Set(foodDetails.filter(Boolean).map(item => item.label)))
.map(label => foodDetails.find(item => item.label === label)); */
        const uniqueFoodDetailsMap = new Map();
                foodDetails.forEach(item => {
                if (item) {
                    const uniqueKey = `${item.label}-${item.image}-${item.calories}`; // Create a unique composite key
                if (!uniqueFoodDetailsMap.has(uniqueKey)) {
                uniqueFoodDetailsMap.set(uniqueKey, item); // Store the unique food item in the map
            }
        }
        });
                                
const uniqueFoodDetails = Array.from(uniqueFoodDetailsMap.values());  
      setFoodResults(uniqueFoodDetails );
      }else{
        console.warn("No food names returned for the search query");
        setFoodResults([]);
      }

    } catch (error) {
      console.error('Error fetching food data:', error.response ? error.response.data : error.message);
    }
  };

  const fetchFoodDetails = async (foodName) => {
    const apiUrl = 'https://edamam-food-and-grocery-database.p.rapidapi.com/api/food-database/v2/parser';
    const headers = {
      'X-RapidAPI-Key': 'b67f406295mshfe69c296017a625p1fb200jsn749987e75357',
      'X-RapidAPI-Host': 'edamam-food-and-grocery-database.p.rapidapi.com',
    };

    try {
      const response = await axios.get(apiUrl, { headers, params: { ingr: foodName } });
      if (response.data.hints && response.data.hints.length > 0) {
        const foodData = response.data.hints[0].food; // Get the first hint's food data

        if(foodData && foodData.label){
            return {
          label: foodData.label,
          image: foodData.image,
          calories: foodData.nutrients.ENERC_KCAL.toFixed(2),
          protein: foodData.nutrients.PROCNT.toFixed(2),
          fat: foodData.nutrients.FAT.toFixed(2),
          carbs: foodData.nutrients.CHOCDF.toFixed(2),
          fiber: foodData.nutrients.FIBTG.toFixed(2) || 0, // Fetch fiber as well
        };
      }
    }
      return null; // Return null if no food found
    } catch (error) {
      console.error('Error fetching food details:', error.response ? error.response.data : error.message);
      return null;
    }
  };

  // Function to calculate updated nutrients based on quantity
  const calculateMicro = (event, foodLabel) => {
    const quantity = event.target.value;

    if (quantity.length !== 0 && !isNaN(quantity)) {
      setEatenQuantity((prevState) => ({
        ...prevState,
        [foodLabel]: Number(quantity) // Store quantity for each food item
      }));
    } else {
      setEatenQuantity((prevState) => ({
        ...prevState,
        [foodLabel]: undefined // Reset to undefined if quantity is not valid
      }));
    }
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9); // Generate a random string as foodId
  };

  const trackFoodItem = (food) => {
    if (!loggedData || !loggedData.loggedUser) {
      console.error('User is not logged in');
      return;
    }

    const quantity = eatenQuantity[food.label] || 100; // Default to 100g if no quantity is entered
    const trackedItem = {
      userId: loggedData.loggedUser.userid,
      foodId: generateRandomId(), // Generate a random food ID
      foodName: food.label, // Include food name
      details: {
        calories: (food.calories * quantity / 100).toFixed(2), // Calculate consumed calories
        protein: (food.protein * quantity / 100).toFixed(2),
        carbohydrates: (food.carbs * quantity / 100).toFixed(2),
        fat: (food.fat * quantity / 100).toFixed(2),
        fiber: (food.fiber * quantity / 100).toFixed(2) // Calculate consumed fiber
      },
      quantity: quantity // Store the entered quantity
    };

    console.log('Tracking food item:', trackedItem);

    fetch('http://localhost:8000/track', {
      method: 'POST',
      body: JSON.stringify(trackedItem),
      headers: {
        Authorization: `Bearer ${loggedData.loggedUser.token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Food item tracked successfully:', data);
      })
      .catch((err) => {
        console.error('Error tracking food item:', err);
      });
  };

  return (
    <section>
        <Header/>
    <div className="app-container">
      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for food..."
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      {/* Food Results List */}
      <div className="results-list">
        {foodResults.map((food, index) => (
          food && ( // Ensure food is not null
            <div key={index} className="food-card">
              <h4 className="food-name">{food.label}</h4>
              {food.image ? (
                <img src={food.image} alt={food.label} className="food-image" />
              ) : (
                <img src="../placeholder.webp" alt="Placeholder" className="food-image" />
              )}

              <p className="calories">Calories: {food.calories} kcal</p>
              <div className="micronutrients">
                <p>Protein: {food.protein}g</p>
                <p>Fat: {food.fat}g</p>
                <p>Carbs: {food.carbs}g</p>
                <p>Fiber: {food.fiber}g</p> {/* Add fiber display */}
              </div>

              {/* Quantity Input */}
              <input
                type="number"
                className="calculate"
                onChange={(e) => calculateMicro(e, food.label)}
                placeholder="Quantity (grams)"
              />

              {/* Show calculated values based on quantity */}
              {eatenQuantity[food.label] && (
                <div className="calculated-micronutrients">
                  <p>Consumed Calories: {(food.calories * eatenQuantity[food.label] / 100).toFixed(2)} kcal</p>
                  <p>Consumed Protein: {(food.protein * eatenQuantity[food.label] / 100).toFixed(2)}g</p>
                  <p>Consumed Fat: {(food.fat * eatenQuantity[food.label] / 100).toFixed(2)}g</p>
                  <p>Consumed Carbs: {(food.carbs * eatenQuantity[food.label] / 100).toFixed(2)}g</p>
                  <p>Consumed Fiber: {(food.fiber * eatenQuantity[food.label] / 100).toFixed(2)}g</p> {/* Add consumed fiber */}
                </div>
              )}

              <button className="btn" onClick={() => trackFoodItem(food)}>Track</button> {/* Pass food as argument */}
            </div>
          )
        ))}
      </div>
    </div>
    </section>
  );
};

export default Track;

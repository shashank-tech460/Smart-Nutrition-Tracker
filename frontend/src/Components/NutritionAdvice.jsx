import React, { useState } from 'react';
import axios from 'axios';
import Header from './Header';
const NutritionAdvice = () => {
    const [goal, setGoal] = useState('Lose weight');
    const [dietaryRestrictions, setDietaryRestrictions] = useState(['Vegetarian']);
    const [currentWeight, setCurrentWeight] = useState(80);
    const [targetWeight, setTargetWeight] = useState(70);
    const [activityLevel, setActivityLevel] = useState('Moderate');
    const [nutritionAdvice, setNutritionAdvice] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const options = {
            method: 'POST',
            url: 'https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/nutritionAdvice',
            params: { noqueue: '1' },
            headers: {
                'x-rapidapi-key': '222045c826msh05817e88098f634p1a6609jsn85666e866339',
                'x-rapidapi-host': 'ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            data: {
                goal,
                dietary_restrictions: dietaryRestrictions,
                current_weight: currentWeight,
                target_weight: targetWeight,
                daily_activity_level: activityLevel,
                lang: 'en'
            }
        };

        try {
            const response = await axios.request(options);
            setNutritionAdvice(response.data); // Store the nutrition advice
        } catch (error) {
            console.error('Error fetching nutrition advice:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            <Header/>
        <div className="app-container">
            <h2>Get Nutrition Advice</h2>
            <form onSubmit={handleSubmit} className='horizontal-form'>
                <div className="form-group">
                    <label>Goal:</label>
                    <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                        <option value="Lose weight">Lose weight</option>
                        <option value="Gain weight">Gain weight</option>
                        <option value="Maintain weight">Maintain weight</option>
                    </select>
                </div>

               {/*} <div className="form-group">
                    <label>Dietary Restrictions:</label>
                    <select
                        value={dietaryRestrictions}
                        onChange={(e) => setDietaryRestrictions(Array.from(e.target.selectedOptions, option => option.value))}
                        multiple
                    >
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                        <option value="None">None</option>
                    </select>
                </div>  */}

                <div className="form-group">
    <label>Dietary Restrictions:</label>
    <select
        value={dietaryRestrictions}
        onChange={(e) => setDietaryRestrictions([e.target.value])} // Allow only one selection
    >
        {!dietaryRestrictions.includes("Vegetarian") || dietaryRestrictions[0] === "Vegetarian" ? (
            <option value="Vegetarian">Vegetarian</option>
        ) : null}
        {!dietaryRestrictions.includes("Vegan") || dietaryRestrictions[0] === "Vegan" ? (
            <option value="Vegan">Vegan</option>
        ) : null}
        {!dietaryRestrictions.includes("Gluten-Free") || dietaryRestrictions[0] === "Gluten-Free" ? (
            <option value="Gluten-Free">Gluten-Free</option>
        ) : null}
        {!dietaryRestrictions.includes("None") || dietaryRestrictions[0] === "None" ? (
            <option value="None">None</option>
        ) : null}
    </select>
</div>


                <div className="form-group">
                    <label>Current Weight (kg):</label>
                    <input
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Target Weight (kg):</label>
                    <input
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Daily Activity Level:</label>
                    <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                        <option value="Sedentary">Sedentary</option>
                        <option value="Light">Light</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Active">Active</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Fetching Advice...' : 'Get Nutrition Advice'}
                </button>
            </form>
            </div>
            <div>
            {nutritionAdvice && (
                <div className="nutrition-advice">
                <h3>Your Nutrition Advice</h3>
                
                {/* Description */}
                <div className="description">
                    <p>{nutritionAdvice.result.description}</p>
                    <p><strong>Goal:</strong> {nutritionAdvice.result.goal}</p>
                    <p><strong>Calories Per Day:</strong> {nutritionAdvice.result.calories_per_day}</p>
                </div>
            
                {/* Macronutrients */}
                <div className="macronutrients">
                    <div>
                        <span>{nutritionAdvice.result.macronutrients.carbohydrates}</span>
                        <p>Carbohydrates</p>
                    </div>
                    <div>
                        <span>{nutritionAdvice.result.macronutrients.proteins}</span>
                        <p>Proteins</p>
                    </div>
                    <div>
                        <span>{nutritionAdvice.result.macronutrients.fats}</span>
                        <p>Fats</p>
                    </div>
                </div>
            
                {/* Meal Suggestions */}
                {nutritionAdvice.result.meal_suggestions.map((meal, index) => (
                    <div key={index} className="meal-plan">
                        <h4>{meal.meal}</h4>
                        {meal.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="meal">
                                <h5>{suggestion.name}</h5>
                                <ul>
                                    {suggestion.ingredients.map((ingredient, i) => (
                                        <li key={i}>{ingredient}</li>
                                    ))}
                                </ul>
                                <p className="calories">Calories: {suggestion.calories}</p>
                            </div>
                        ))}
                    </div>
                ))}
            
                {/* SEO Content */}
                <div className="seo-content">
                    <p>{nutritionAdvice.result.seo_content}</p>
                    <p><strong>SEO Keywords:</strong> {nutritionAdvice.result.seo_keywords}</p>
                </div>
            </div>
            
            )}
        </div>
        </section>
    );
};

export default NutritionAdvice;

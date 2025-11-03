import React, { useState } from 'react';
import axios from 'axios';
import Header from './Header';

const TrackBurnedCalories = () => {
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [result, setResult] = useState(null);
  const [caloriesBurned, setCaloriesBurned] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCaloriesBurned = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setCaloriesBurned(null);

    const options = {
      method: 'GET',
      url: 'https://calories-burned-by-api-ninjas.p.rapidapi.com/v1/caloriesburned',
      params: { activity },
      headers: {
        'x-rapidapi-key': '222045c826msh05817e88098f634p1a6609jsn85666e866339',
        'x-rapidapi-host': 'calories-burned-by-api-ninjas.p.rapidapi.com',
      },
    };

    try {
      const response = await axios.request(options);
      setResult(response.data);
    } catch (err) {
      setError('Unable to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCaloriesBurned = (caloriesPerHour, minutes) => {
    // Calculate calories burned based on duration
    const caloriesPerMinute = caloriesPerHour / 60;
    const totalCalories = caloriesPerMinute * minutes;
    setCaloriesBurned(totalCalories);
  };

  return (
    <section>
      <Header />
      <div className="calories-container">
        <h1>Calories Burned Tracker</h1>
        <div className="input-section">
          <input
            type="text"
            placeholder="Enter an activity (e.g., skiing)"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
          <button onClick={fetchCaloriesBurned}>Fetch Data</button>
        </div>

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {result && (
          <div className="result-section">
            <h2>Results:</h2>
            <ul>
              {result.map((item, index) => (
                <li key={index}>
                  <strong>Activity:</strong> {item.name} <br />
                  <strong>Calories Burned per Hour:</strong> {item.calories_per_hour} kcal/hour <br />
                  <strong>Duration:</strong> {item.duration_minutes} minutes <br />
                  <strong>Total Calories Burned:</strong> {item.total_calories} kcal <br />
                  <div>
                    <label>Enter your duration in minutes:</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="1"
                      placeholder="Minutes"
                    />
                    <button
                      onClick={() => calculateCaloriesBurned(item.calories_per_hour, duration)}
                    >
                      Calculate Calories Burned
                    </button>
                    {caloriesBurned !== null && (
                      <p>
                        You burned <strong>{caloriesBurned.toFixed(2)}</strong> kcal during {duration} minutes of {item.name}.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrackBurnedCalories;

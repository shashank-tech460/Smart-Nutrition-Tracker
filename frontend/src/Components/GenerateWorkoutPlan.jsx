import React, { useState } from 'react';
import axios from 'axios';
import './GenerateWorkoutPlan.css'; // Import your CSS file
import Header from './Header';
import Footer from './Footer';

const GenerateWorkoutPlan = () => {
    const [goal, setGoal] = useState('Build muscle');
    const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
    const [preferences, setPreferences] = useState(['Weight training']);
    const [healthConditions, setHealthConditions] = useState('None');
    const [schedule, setSchedule] = useState({ daysPerWeek: 4, sessionDuration: 60 });
    const [planDurationWeeks, setPlanDurationWeeks] = useState(4);
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const options = {
                method: 'POST',
                url: 'https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/generateWorkoutPlan',
                params: { noqueue: '1' },
                headers: {
                    'x-rapidapi-key': 'f2dfaf11d7mshd30c1156a2cd3eap170ec5jsn77046f66a58a',
                    'x-rapidapi-host': 'ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com',
                    'Content-Type': 'application/json'
                },
                data: {
                    goal,
                    fitness_level: fitnessLevel,
                    preferences,
                    health_conditions: [healthConditions],
                    schedule: {
                        days_per_week: schedule.daysPerWeek,
                        session_duration: schedule.sessionDuration,
                    },
                    plan_duration_weeks: planDurationWeeks,
                    lang: 'en'
                }
            };
            const response = await axios.request(options);
            setWorkoutPlan(response.data.result); // Store the result directly
        } catch (error) {
            console.error('Error generating workout plan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        
        <section style={{height:'100vh'}}>
            <Header/>
        <div className="app-container">
            <h2>Generate Workout Plan</h2>
            <form onSubmit={handleSubmit} className="horizontal-form">
            <div className="form-group">
                <label>Goal:</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                    <option value="Build muscle">Build muscle</option>
                    <option value="Lose weight">Lose weight</option>
                    <option value="Increase endurance">Increase endurance</option>
                </select>
            </div>
            <div className="form-group">
                <label>Fitness Level:</label>
                <select value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
           {/* <div className="form-group">
                <label>Preferences:</label>
                <select
                    value={preferences}
                    onChange={(e) => setPreferences(Array.from(e.target.selectedOptions, option => option.value))}
                    multiple
                >
                    <option value="Weight training">Weight training</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Pilates">Pilates</option>
                </select>
            </div> */}
            <div className="form-group">
                <label>Preferences:</label>
                <select
                    value={preferences}
                    onChange={(e) => setPreferences([e.target.value])} // Change to allow only one selection
                >
                    {!preferences.includes("Weight training") || preferences[0] === "Weight training" ? (
                        <option value="Weight training">Weight training</option>
                    ) : null}
                    {!preferences.includes("Cardio") || preferences[0] === "Cardio" ? (
                        <option value="Cardio">Cardio</option>
                    ) : null}
                    {!preferences.includes("Yoga") || preferences[0] === "Yoga" ? (
                        <option value="Yoga">Yoga</option>
                    ) : null}
                    {!preferences.includes("Pilates") || preferences[0] === "Pilates" ? (
                        <option value="Pilates">Pilates</option>
                    ) : null}
                </select>
            </div>

            <div className="form-group">
                <label>Health Conditions:</label>
                <select value={healthConditions} onChange={(e) => setHealthConditions(e.target.value)}>
                    <option value="None">None</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Heart condition">Heart condition</option>
                    <option value="Asthma">Asthma</option>
                </select>
            </div>
            <div className="form-group">
                <label>Days per Week:</label>
                <input
                    type="number"
                    value={schedule.daysPerWeek}
                    onChange={(e) => setSchedule({ ...schedule, daysPerWeek: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label>Session Duration (minutes):</label>
                <input
                    type="number"
                    value={schedule.sessionDuration}
                    onChange={(e) => setSchedule({ ...schedule, sessionDuration: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label>Plan Duration (weeks):</label>
                <input
                    type="number"
                    value={planDurationWeeks}
                    onChange={(e) => setPlanDurationWeeks(e.target.value)}
                    required
                />
            </div>
            <button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Workout Plan'}
            </button>
         </form>
        
         </div>
        <div>
            {workoutPlan && (
                <div className="workout-plan">
                    <h3>Your Workout Plan:</h3>
                    {workoutPlan.exercises.map((dayPlan, index) => (
                        <div key={index} className="day-plan">
                            <h4>{dayPlan.day}</h4>
                            <ul>
                                {dayPlan.exercises.map((exercise, idx) => (
                                    <li key={idx}>
                                        <strong>{exercise.name}</strong> - Duration: {exercise.duration} | Equipment: {exercise.equipment}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
            
        </div>
        
        </section>
    

       
         
        
        
    );
};

export default GenerateWorkoutPlan;

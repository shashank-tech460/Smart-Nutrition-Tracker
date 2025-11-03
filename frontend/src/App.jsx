import './App.css'
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Register from './Components/Register'
import Login from './Components/Login'
import Home from './Components/Home'
import Header from './Components/Header'
import Track from './Components/Track'
import Food from './Components/Food'
import NotFound from './Components/NotFound'
import Profile from './Components/Profile'
import Private from './Components/Private'
import Diet from "./Components/Diet"
import PostCreate from './Components/PostCreate'
import Community from './Components/Community'
import UserInfo from './Components/Userinfo'

import { UserContext } from './contexts/UserContext'
import { useState } from 'react'
import MealPlanGenerator from './Components/MealPlanGenerator'
import ViewPost from './Components/ViewPost'
import Footer from './Components/Footer'
import TrackBurnedCalories from './Components/TrackBurnedCalories'
import Ingredients from './Components/Ingredients'
import GenerateWorkoutPlan from './Components/GenerateWorkoutPlan'
import NutritionAdvice from './Components/NutritionAdvice'
import SlotBooking from './Components/SlotBooking'
function App() {
 
  const [loggedUser,setLoggedUser] 
  = useState(JSON.parse(localStorage.getItem("nutrify-user")));



  return (
    <>
    <UserContext.Provider value={{loggedUser,setLoggedUser}}> 
     <BrowserRouter>
        <Routes>
          <Route path="/" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/home" element={<Private Component={Home} />}/>
          <Route path="/track" element={<Private Component={Track} />}/>
          <Route path="/food" element={<Private Component={Food} />}/>
          <Route path="/diet" element={<Private Component={Diet}/>}/>
          <Route path="/community" element={<Private Component={Community}/>}/>
          <Route path="/postcreate" element={<Private Component={PostCreate}/>}/>
          <Route path="/userinfo" element={<Private Component={UserInfo}/>}/>
          <Route path="/generateMeal" element={<Private Component={MealPlanGenerator}/>}/>
          <Route path="/generateWorkout" element={<GenerateWorkoutPlan />} /> 
          <Route path="/advice" element={<NutritionAdvice />} /> 
          <Route path="/trackburn" element={<TrackBurnedCalories/>} />
          <Route path='/videomeet' element={<SlotBooking/>}/>
          <Route path="/posts/:postId" element={<ViewPost />} /> 
          <Route path="/ingredients" element={<Ingredients/>} /> 
          <Route path="/profile" element={<Private Component={Profile}/>}/>
          
          <Route path="*" element={<NotFound/>}/>
        </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </>
  )
}

export default App
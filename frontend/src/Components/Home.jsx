import React, { useContext, useEffect, useState } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import './Home.css'; // Assuming you have custom styles here
import Header from './Header'; // Assuming Header is a component already defined
import { UserContext } from '../contexts/UserContext';
import mealImage from '../assets/meal.jpg'; // Replace with actual image paths
import nutritionImage from '../assets/image.png';
import communityImage from '../assets/328407-PA7RG1-161.jpg';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { loggedUser, setLoggedUser } = useContext(UserContext); // Access UserContext
  const navigate = useNavigate();

  // Local state hooks for data, error, loading
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [posts, setPosts] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Logout function
  const logout = () => {
    localStorage.removeItem("nutrify-user");
    setLoggedUser(null);
    navigate("/login");
  };

  const handleCreatePost = () => {
    navigate('/postcreate');
  };

  const handleViewMyPosts = () => {
    navigate('/userpost');
  };

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const response = await fetch(`http://localhost:8000/posts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loggedUser.token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
  
          // Shuffle and select 5 random posts
          const shuffledPosts = data.sort(() => 0.5 - Math.random());
          const selectedPosts = shuffledPosts.slice(0, 5);
  
          setPosts(selectedPosts);
        } else {
          setError('Failed to fetch posts');
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching posts');
      } finally {
        setLoading(false);
      }
    };
  
    if (loggedUser?.token) fetchAllPosts();
  }, [loggedUser]);
  

  // Function to calculate relative time
  function timeAgo(timestamp) {
    const now = new Date();
    const postDate = new Date(timestamp);
    const seconds = Math.floor((now - postDate) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} days ${hours % 24} hours ago`;
    } else if (hours > 0) {
      return `${hours} hours ago`;
    } else if (minutes > 0) {
      return `${minutes} minutes ago`;
    } else {
      return `${seconds} seconds ago`;
    }
  }

  // Botpress chatbot integration
  useEffect(() => {
    const botpressScript1 = document.createElement('script');
    botpressScript1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
    botpressScript1.async = true;

    const botpressScript2 = document.createElement('script');
    botpressScript2.src = "https://files.bpcontent.cloud/2024/10/16/18/20241016183647-LXDAWA36.js";
    botpressScript2.async = true;

    document.body.appendChild(botpressScript1);
    document.body.appendChild(botpressScript2);

    return () => {
      document.body.removeChild(botpressScript1);
      document.body.removeChild(botpressScript2);
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-carousel">
        <Carousel>
          <Carousel.Item>
            <img className="d-block w-100" src={mealImage} alt="Today's Meal Plan" />
            <Carousel.Caption>
              <h3>Today's Meal Plan</h3>
              <p>Get your personalized meal plan based on your nutritional needs.</p>
            </Carousel.Caption>
          </Carousel.Item>

          <Carousel.Item>
            <img className="d-block w-100" src={nutritionImage} alt="Track Your Nutrition" />
            <Carousel.Caption>
              <h3>
                <a href="./track" style={{ textDecoration: "none", color: "white" }}>Track The Nutrition</a>
              </h3>
              <p>Manually track what you eat and maintain your daily nutrition log.</p>
            </Carousel.Caption>
          </Carousel.Item>

          <Carousel.Item>
            <img className="d-block w-100" src={communityImage} alt="Social Community" />
            <Carousel.Caption>
              <h3>Social Community</h3>
              <p>Join our community and share your journey with others.</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      <section className="community-posts-section">
        <hr></hr>
        <div className="album py-5 bg-body-tertiary">
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {loading ? (
                <p>Loading posts...</p>
              ) : error ? (
                <p>{error}</p>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div className="col" key={post._id}>
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="card-img-wrapper">
                          {post.image ? (
                            <img className="card-img-top" src={`data:image/jpeg;base64,${post.image}`} alt={post.title} />
                          ) : (
                            <img className="card-img-top" src="https://via.placeholder.com/300x225" alt="Placeholder" />
                          )}
                        </div>
                        <h5 className="card-title">{post.title}</h5>
                        <p className="card-text">{post.content}</p>
                        <div className="btn-group mt-auto">
                          <button type="button" className="view-button" onClick={() => navigate(`/posts/${post._id}`)}>View</button>
                        </div>
                        <small className="text-body-secondary">{timeAgo(post.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No posts available.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>&copy; 2024 NutriQuest. All rights reserved.</p>
      </footer>

      <div id="botpress-webchat"></div>
    </div>
  );
};

export default Home;

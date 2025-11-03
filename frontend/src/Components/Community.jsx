import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
// Import the CSS file for styling

const Community = () => {
   
    const loggedData = useContext(UserContext);
   const [loading, setLoading] = useState(true); 
   const [error, setError] = useState(null); 
    const [posts, setPosts] = useState([]); 
    const navigate = useNavigate(); // Hook for navigation

    const [searchQuery, setSearchQuery] = useState('');

    
    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreatePost = () => {
        navigate('/postcreate'); // Adjust the route to your actual create post path
    };

    // Navigate to the user's posts page
    const handleViewMyPosts = () => {
        navigate('/userpost'); // Adjust the route to your actual my posts path
    };

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch(`http://localhost:8000/posts`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loggedData.loggedUser.token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setPosts(data);
                } else {
                    setError('Failed to fetch posts');
                }
            } catch (err) {
                console.error(err);
                setError('Error fetching posts');
            } finally {
                setLoading(false); // Set loading to false after fetch
            }
        };

        fetchPosts();
    }, [loggedData.loggedUser.userid, loggedData.loggedUser.token]);

    function timeAgo(timestamp) {
        const now = new Date();
        const postDate = new Date(timestamp);
      
        const seconds = Math.floor((now - postDate) / 1000); // Difference in seconds
        const minutes = Math.floor(seconds / 60); // Difference in minutes
        const hours = Math.floor(minutes / 60); // Difference in hours
        const days = Math.floor(hours / 24); // Difference in days
      
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

    return (
    <section>
    <Header/>
    
    <div className="community-container">
        <header className="community-header">
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <>
                    <h1>Community</h1>
                    <h2>Latest Articles</h2>
                    {/* Search bar */}
                    <input
                        type="text"
                        placeholder="Search posts by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <div className="action-buttons">
                        <button onClick={handleCreatePost} className="create-post-button">Create Post</button>
                        <button onClick={handleViewMyPosts} className="view-my-posts-button">View My Posts</button>
                    </div>
                </>
            )}
        </header>

        {/* Main Content */}
        {!loading && !error && (
            <div className="album py-5 bg-body-tertiary">
                <div className="container">
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-1">
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <div className="col" key={post._id}>
                                    <div className="card shadow-sm">
                                        {/* Card Body with Image, Title, Content, and Button */}
                                        <div className="card-body">
                                            {/* Image */}
                                            <div className="card-img-wrapper">
                                                {post.image ? (
                                                    <img className="card-img-top" src={`data:image/jpeg;base64,${post.image}`} alt={post.title} />
                                                ) : (
                                                    <img className="card-img-top" src="https://via.placeholder.com/300x225" alt="Placeholder" />
                                                )}
                                            </div>

                                            {/* Post Title */}
                                            <h5 className="card-title">{post.title}</h5>

                                            {/* Post Content */}
                                            <p className="card-text">{post.content}</p>
                                            
                                            {/* Buttons */}
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
            
        )}
       
        
    </div>
    <Footer/> 
</section>

    );
};

export default Community;

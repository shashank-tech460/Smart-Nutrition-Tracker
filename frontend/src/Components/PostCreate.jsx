import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

export default function PostCreate() {
    const loggedData = useContext(UserContext);
    const [posts, setPosts] = useState([]); // Store user posts
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        image: null,
    });
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state for user feedback
    const [successMessage, setSuccessMessage] = useState(''); // Success message
     const navigate=useNavigate();
    // Fetch existing posts for the user when the component mounts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch(`http://localhost:8000/user/${loggedData.loggedUser.userid}/posts`, {
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

    // Handle input changes for the new post
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPost((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    
    const handleDeletePost = async (postId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this post?");
        if (confirmDelete) {
            try {
                const response = await fetch(`http://localhost:8000/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${loggedData.loggedUser.token}`,
                    },
                });
                if (response.ok) {
                    // Remove the post from the local state
                    setPosts(posts.filter(post => post._id !== postId));
                    alert("Post deleted successfully!");
                } else {
                    alert("Failed to delete the post.");
                }
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("An error occurred while deleting the post.");
            }
        }
    };
    
    // Handle file input for image upload
    const handleFileChange = (e) => {
        setNewPost((prev) => ({
            ...prev,
            image: e.target.files[0],
        }));
    };

    // Submit new post to the backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prepare data for the POST request
        const formData = new FormData();
        formData.append('userId', loggedData.loggedUser.userid);
        formData.append('title', newPost.title);
        formData.append('content', newPost.content);
    
        if (newPost.image) {
            formData.append('image', newPost.image); // Add image file to formData
        }

        try {
            const response = await fetch('http://localhost:8000/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${loggedData.loggedUser.token}`,
               },
                body: formData, // Send postData as JSON
            });

            if (response.ok) {
                const createdPost = await response.json();
                setPosts((prevPosts) => [...prevPosts, createdPost]); // Update posts state
                setNewPost({ title: '', content: '', image: null }); // Reset the form
                setSuccessMessage('Post created successfully!'); // Success message
                setError(null); // Clear error state
            } else {
                setError('Error creating post: ' + response.statusText);
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Error creating post');
        }
    };
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
        <section >
            <Header />
            <div className="create-post-container">
            <h1>Create a New Post</h1>

            {loading ? (
                <p>Loading posts...</p>
            ) : (
                <>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <div className="post-form">
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="title"
                                placeholder="Post Title"
                                value={newPost.title}
                                onChange={handleInputChange}
                                required
                            />
                            <textarea
                                name="content"
                                placeholder="Write your blog..."
                                value={newPost.content}
                                onChange={handleInputChange}
                                required
                            ></textarea>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <button type="submit">Submit</button>
                        </form>
                    </div>

                <div className="album py-5 bg-body-tertiary">
                <div className="container">
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                    {posts.length > 0 ? (
                        posts.map((post) => (
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
                                <button type="button" className="edit-button"   onClick={() => handleDeletePost(post._id)}>Delete</button>
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

 
                    
                </>
            )}
            </div>
        </section>
    );
}

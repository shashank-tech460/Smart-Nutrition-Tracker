import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Header from './Header'

const ViewPost = () => {
  const { postId } = useParams(); // Get postId from URL parameters
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/posts/${postId}`);
        if (response.status === 200) {
          setPost(response.data);
        } else {
          setError('Failed to fetch post');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Error fetching post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <section>
      <Header/>
    <div className="view-post-container">
     
      {post.image && (
        <img id="img-float" src={`data:image/jpeg;base64,${post.image}`} alt={post.title} />
      )}
      <div className="post-content">
      <h1>{post.title}</h1>
        <p>{post.content}</p>
        <p><strong>Posted on:</strong> {new Date(post.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
    </section>
  );
};

export default ViewPost;

// Dashboard.js
import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { auth, db } from './../firebase'; // Adjust the path as needed
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // If using react-router

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState({
    profileImage: '',
    userEmail: '',
  });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true); // For loading state
  const [error, setError] = useState(null); // For error handling
  const navigate = useNavigate(); // If using react-router

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      console.log("Current user:", user); // Log the current user object for debugging

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid); // Path to 'users/{userId}'
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            setUserProfile(userDoc.data().userProfile);
          } else {
            console.log('No such document!');
            setError('User profile not found.');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
  
    const selectRandomQuote = () => {
      const allQuotes = [
        "The greatest glory in living lies not in never falling, but in rising every time we fall. — Nelson Mandela",
        "The way to get started is to quit talking and begin doing. — Walt Disney",
        "Your time is limited, so don't waste it living someone else's life. — Steve Jobs",
        "If life were predictable it would cease to be life, and be without flavor. — Eleanor Roosevelt",
        "If you look at what you have in life, you'll always have more. — Oprah Winfrey",
        "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success. — James Cameron",
        "Life is what happens when you're busy making other plans. — John Lennon",
        "Spread love everywhere you go. Let no one ever come to you without leaving happier. — Mother Teresa",
        "When you reach the end of your rope, tie a knot in it and hang on. — Franklin D. Roosevelt",
        "Always remember that you are absolutely unique. Just like everyone else. — Margaret Mead",
        "Don't judge each day by the harvest you reap but by the seeds that you plant. — Robert Louis Stevenson",
        "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
        "Tell me and I forget. Teach me and I remember. Involve me and I learn. — Benjamin Franklin",
        "The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart. — Helen Keller",
        "It is during our darkest moments that we must focus to see the light. — Aristotle",
        // Add more quotes as desired
      ];
  
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      setQuote(allQuotes[randomIndex]);
    };
  
    const fetchData = async () => {
      await fetchUserProfile();
      selectRandomQuote();
      setLoading(false);
    };
  
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      } else {
        navigate('/login'); // Redirect to login if not authenticated
      }
    });
  
    return () => unsubscribeAuth();
  }, [navigate]);
  

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to log out.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Welcome to the Dashboard!</h1>
      
      <div className="profile-section">
        {userProfile.profileImage ? (
          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="profile-image"
          />
        ) : (
          <div className="profile-placeholder">No Image</div>
        )}
        <span className="user-email">{userProfile.userEmail}</span>
      </div>

      {quote && (
        <div className="quote-section">
          <blockquote className="quote">
            "{quote.split(' — ')[0]}"
            <footer className="quote-author">— {quote.split(' — ')[1]}</footer>
          </blockquote>
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;

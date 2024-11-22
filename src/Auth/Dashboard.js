// Dashboard.js
import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { auth, db, functions } from './../firebase'; // Ensure 'functions' is exported from your firebase config
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom'; // If using react-router
import UserPrompts from './UserPrompts'; // Import the UserPrompts component

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState({
    profileImage: '',
    userEmail: '',
  });
  const [quote, setQuote] = useState(null);
  const [prompts, setPrompts] = useState([]); // State for prompts array
  const [AIanswers, setAIanswers] = useState([]); // State for AI answers array
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
          setError('Failed to fetch user profile.');
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

        // Set up Firestore listener for prompts
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribePrompts = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPrompts(data.prompts || []);
            setAIanswers(data.AIanswers || []);
          } else {
            console.log('No such document for prompts!');
            setPrompts([]);
            setAIanswers([]);
          }
        }, (error) => {
          console.error('Error fetching prompts and AI answers:', error);
          setError('Failed to fetch prompts and AI answers.');
        });

        // Cleanup Firestore listener on unmount or user change
        return () => {
          unsubscribePrompts();
        };
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

  const handleUserPromptSubmit = async (prompt) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        // Add the prompt to 'prompts' array
        await updateDoc(userDocRef, {
          prompts: arrayUnion(prompt),
        });

        // Call the Firebase Cloud Function to generate AI response
        const generateCompletion = httpsCallable(functions, 'generate_completion');
        const result = await generateCompletion({ userPrompt: prompt });

        if (result.data && result.data.message) {
          const aiMessage = result.data.message;
          // Add the AI response to 'AIanswers' array
          await updateDoc(userDocRef, {
            AIanswers: arrayUnion(aiMessage),
          });
        } else {
          console.error('Invalid response from Cloud Function:', result.data);
          setError('Failed to get a valid response from AI.');
        }
      } catch (error) {
        console.error('Error handling user prompt submission:', error);
        setError('Failed to submit prompt or retrieve AI response.');
      }
    } else {
      setError('User not authenticated.');
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

      {/* Insert the UserPrompts component here */}
      <UserPrompts prompts={prompts} onSubmit={handleUserPromptSubmit} />

      {/* Display AI Answers */}
      <div className="ai-answers-section">
        <h2>AI Responses:</h2>
        {AIanswers.length > 0 ? (
          <ul className="ai-answers-list">
            {AIanswers.map((answer, index) => (
              <li key={index} className="ai-answer-item">
                {answer}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-ai-answers">No AI responses yet.</p>
        )}
      </div>

      {/* {quote && (
        <div className="quote-section">
          <blockquote className="quote">
            "{quote.split(' — ')[0]}"
            <footer className="quote-author">— {quote.split(' — ')[1]}</footer>
          </blockquote>
        </div>
      )} */}

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;


import React from 'react';

function Home() {
  return (
    <div className="home">
      <h1>Welcome to FoodFlow 🍔</h1>
      <p>Fresh food. Simple payments.</p>

      <button onClick={() => window.location.href = '/menu'}>
        Explore Menu
      </button>
    </div>
  );
}

export default Home;

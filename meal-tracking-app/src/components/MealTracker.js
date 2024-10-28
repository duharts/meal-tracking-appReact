import React, { useState } from 'react';

function MealTracker() {
  const [meals, setMeals] = useState([]);
  const [meal, setMeal] = useState('');

  const addMeal = () => {
    if (meal) {
      setMeals([...meals, meal]);
      setMeal('');
    }
  };

  return (
    <div>
      <h2>Meal Tracker</h2>
      <input
        type="text"
        placeholder="Enter a meal"
        value={meal}
        onChange={(e) => setMeal(e.target.value)}
      />
      <button onClick={addMeal}>Add Meal</button>
      <ul>
        {meals.map((meal, index) => (
          <li key={index}>{meal}</li>
        ))}
      </ul>
    </div>
  );
}

export default MealTracker;

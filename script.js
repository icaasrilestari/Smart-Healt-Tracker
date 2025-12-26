document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // 1. BASIC NAVIGATION LOGIC (Stage 1 & 5 Polish)
    // =======================================================
    const navButtons = document.querySelectorAll('#main-nav button');
    const sections = document.querySelectorAll('.app-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSectionId = button.getAttribute('data-section');
            
            // Hide all sections
            sections.forEach(section => {
                section.classList.add('hidden');
            });

            // Remove 'active' class from all buttons
            navButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show the target section AND Add 'active' class to the clicked button
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                button.classList.add('active'); 
            }
        });
    });

    // Set the initial active button (Water Tracker is shown by default)
    document.querySelector('button[data-section="water-tracker-section"]').classList.add('active'); 

    // =======================================================
    // 2. 💧 WATER TRACKER LOGIC (Stage 2)
    // =======================================================
    let waterGoal = 2000; // ml
    let waterConsumed = 0;

    const waterConsumedSpan = document.getElementById('water-consumed');
    const waterProgressBar = document.getElementById('water-progress-bar');
    const waterButtons = document.querySelectorAll('.water-input-controls button[data-amount]');
    const customWaterInput = document.getElementById('custom-water-input');
    const addCustomWaterButton = document.getElementById('add-custom-water');

    function updateWaterDisplay() {
        waterConsumedSpan.textContent = waterConsumed;
        
        const percentage = Math.min(100, (waterConsumed / waterGoal) * 100);
        waterProgressBar.style.width = `${percentage}%`;

        localStorage.setItem('waterConsumed', waterConsumed);
    }

    function addWater(amount) {
        waterConsumed += amount;
        updateWaterDisplay();
    }

    // Load saved data on startup
    if (localStorage.getItem('waterConsumed')) {
        waterConsumed = parseInt(localStorage.getItem('waterConsumed'));
    }
    updateWaterDisplay();


    // Event listeners for quick buttons
    waterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.getAttribute('data-amount'));
            addWater(amount);
        });
    });

    // Event listener for custom input
    addCustomWaterButton.addEventListener('click', () => {
        const customAmount = parseInt(customWaterInput.value);
        if (!isNaN(customAmount) && customAmount > 0) {
            addWater(customAmount);
            customWaterInput.value = ''; // Clear input field
        } else {
            alert('Please enter a valid amount of water.');
        }
    });

    // =======================================================
    // 3. 🍽️ FOOD JOURNAL LOGIC (Stage 3)
    // =======================================================
    const foodLogList = document.getElementById('food-log-list');
    const logMealButton = document.getElementById('log-meal-button');
    const mealTypeInput = document.getElementById('meal-type-input');
    const foodDescriptionInput = document.getElementById('food-description-input');
    const foodPhotoInput = document.getElementById('food-photo-input');

    let foodEntries = JSON.parse(localStorage.getItem('foodEntries')) || [];

    function saveFoodEntries() {
        localStorage.setItem('foodEntries', JSON.stringify(foodEntries));
    }

    function renderFoodLog() {
        foodLogList.innerHTML = ''; // Clear existing list

        foodEntries.forEach(entry => {
            const listItem = document.createElement('li');
            
            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('food-details');
            
            detailsDiv.innerHTML = `
                <p class="meal-type">${entry.type} - ${new Date(entry.timestamp).toLocaleTimeString()}</p>
                <p>${entry.description}</p>
            `;

            listItem.appendChild(detailsDiv);

            if (entry.photoUrl) {
                const img = document.createElement('img');
                img.src = entry.photoUrl;
                img.alt = 'Meal photo';
                img.classList.add('food-photo');
                listItem.appendChild(img);
            }
            
            foodLogList.appendChild(listItem);
        });
    }

    logMealButton.addEventListener('click', () => {
        const type = mealTypeInput.value;
        const description = foodDescriptionInput.value.trim();
        const photoUrl = foodPhotoInput.value.trim();

        if (description === "") {
            alert("Please enter a description for your meal.");
            return;
        }

        const newEntry = {
            type: type,
            description: description,
            photoUrl: photoUrl,
            timestamp: Date.now()
        };

        foodEntries.unshift(newEntry);
        saveFoodEntries();
        renderFoodLog();

        // Clear inputs
        foodDescriptionInput.value = '';
        foodPhotoInput.value = '';
    });

    // Initial render when the app loads
    renderFoodLog();

    // =======================================================
    // 4. 🍲 RECIPE SUGGESTER LOGIC (Stage 4)
    // =======================================================
    const ingredientInput = document.getElementById('ingredient-input');
    const searchRecipeButton = document.getElementById('search-recipe-button');
    const suggestedRecipesList = document.getElementById('suggested-recipes-list');

    // Simple Database of Recipes (Hardcoded for this project)
    const recipeDatabase = [
        { 
            name: "Chicken Stir-Fry", 
            ingredients: ["chicken", "onion", "carrot", "soy sauce", "rice"],
            instructions: "Chop chicken and veggies. Stir-fry chicken, then add veggies and soy sauce. Serve over rice."
        },
        { 
            name: "Tomato Pasta", 
            ingredients: ["pasta", "tomato", "garlic", "cheese"],
            instructions: "Boil pasta. Sauté garlic and tomato for sauce. Mix pasta with sauce and top with cheese."
        },
        { 
            name: "Simple Omelette", 
            ingredients: ["egg", "milk", "cheese", "butter"],
            instructions: "Whisk eggs and milk. Pour into buttered pan. Add cheese, fold, and serve."
        },
        { 
            name: "Vegetable Soup", 
            ingredients: ["carrot", "celery", "onion", "potato", "water"],
            instructions: "Chop vegetables. Boil in water until soft. Season to taste."
        }
    ];

    function searchRecipes() {
        const inputIngredientsString = ingredientInput.value.toLowerCase().trim();
        if (inputIngredientsString === "") {
            suggestedRecipesList.innerHTML = '<li class="placeholder-text">Please enter at least one ingredient.</li>';
            return;
        }

        const availableIngredients = inputIngredientsString.split(',').map(item => item.trim()).filter(item => item !== '');

        const results = recipeDatabase.map(recipe => {
            const requiredIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
            
            const matchedCount = requiredIngredients.filter(ing => availableIngredients.includes(ing)).length;
            const missing = requiredIngredients.filter(ing => !availableIngredients.includes(ing));
            const matchScore = matchedCount / requiredIngredients.length;
            
            return {
                ...recipe,
                matchScore,
                missing,
                matchedCount
            };
        })
        .filter(recipe => recipe.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

        renderRecipes(results);
    }

    function renderRecipes(recipes) {
        suggestedRecipesList.innerHTML = '';
        
        if (recipes.length === 0) {
            suggestedRecipesList.innerHTML = '<li class="placeholder-text">No recipes match your ingredients. Try adding more!</li>';
            return;
        }

        recipes.forEach(recipe => {
            const listItem = document.createElement('li');
            listItem.classList.add('recipe-card');

            const missingText = recipe.missing.length > 0 
                ? `<span class="missing-ingredients">Missing: ${recipe.missing.join(', ')}</span>`
                : `<span style="color: #4CAF50; font-weight: bold;">(Perfect Match!)</span>`;

            listItem.innerHTML = `
                <div class="recipe-details">
                    <h4>${recipe.name} (${(recipe.matchScore * 100).toFixed(0)}% Match)</h4>
                    <p>Needs: ${recipe.ingredients.join(', ')}</p>
                    ${missingText}
                </div>
            `;
            
            listItem.addEventListener('click', () => {
                alert(`--- ${recipe.name} INSTRUCTIONS ---\n\n${recipe.instructions}`);
            });
            
            suggestedRecipesList.appendChild(listItem);
        });
    }

    searchRecipeButton.addEventListener('click', searchRecipes);

    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchRecipes();
        }
    });

});
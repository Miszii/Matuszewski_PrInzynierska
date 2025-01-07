import React, { useState, useEffect } from "react";
import api from "./api";

function Meals() {
  const [query, setQuery] = useState("");
  const [foodResults, setFoodResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [mealName, setMealName] = useState("");
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    getRecs();
  }, []);

  async function getRecs() {
    try {
      const response = await api.get("/recommendations");
      setRecs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Błąd podczas ładowania rekomendacji:", error);
      setRecs([]);
    }
  }

  async function searchFood() {
    try {
      const response = await api.get(`/food-search?query=${query}`);
      setFoodResults(response.data.products || []);
      setSelectedFood(null);
    } catch (error) {
      console.error("Błąd podczas wyszukiwania jedzenia:", error);
      setFoodResults([]);
    }
  }

  function addFood() {
    if (!selectedFood || grams <= 0) {
      alert("Podaj poprawną gramaturę.");
      return;
    }

    const totalCalories =
      ((selectedFood.nutriments?.["energy-kcal_100g"] || 0) / 100) * grams;
    const totalProtein =
      ((selectedFood.nutriments?.["proteins_100g"] || 0) / 100) * grams;

    const newFood = {
      name: selectedFood.product_name,
      calories: totalCalories.toFixed(2),
      protein: totalProtein.toFixed(2),
      grams,
    };

    setSelectedFoods([...selectedFoods, newFood]);

    if (selectedFoods.length === 0) {
      setMealName(newFood.name);
    }

    setSelectedFood(null);
    setGrams("");
  }

  async function saveMeal() {
    if (!mealName || selectedFoods.length === 0) {
      alert("Nazwa posiłku i przynajmniej jeden produkt są wymagane!");
      return;
    }

    const newMeal = { name: mealName, products: selectedFoods };

    try {
      const response = await api.post("/meals", newMeal);
      if (response.status === 201) {
        alert("Posiłek został zapisany!");
        setSelectedFoods([]);
        setMealName("");
      }
    } catch (error) {
      console.error("Błąd podczas zapisywania posiłku:", error);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-4xl font-bold text-center mb-6 text-[#051094]">
        Dodaj Posiłek
      </h2>

      <section className="bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
        <FoodSearch query={query} setQuery={setQuery} searchFood={searchFood} />
        <FoodList
          foodResults={foodResults}
          selectedFood={selectedFood}
          setSelectedFood={setSelectedFood}
        />

        {selectedFood && (
          <Grams grams={grams} setGrams={setGrams} addFood={addFood} />
        )}
        {selectedFoods.length > 0 && (
          <MealName mealName={mealName} setMealName={setMealName} />
        )}
        {selectedFoods.length > 0 && (
          <Summary selectedFoods={selectedFoods} saveMeal={saveMeal} />
        )}
      </section>

      <RecSection recs={recs} getRecs={getRecs} />
    </div>
  );
}

function FoodSearch({ query, setQuery, searchFood }) {
  return (
    <div>
      <label className="block font-semibold text-[#051094] mb-2">
        Wyszukaj produkt spożywczy:
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <button
        onClick={searchFood}
        className="bg-[#051094] text-white py-2 px-4 rounded mt-2 w-full hover:bg-blue-800"
      >
        Szukaj
      </button>
    </div>
  );
}

function FoodList({ foodResults, selectedFood, setSelectedFood }) {
  return (
    foodResults.length > 0 && (
      <div>
        <label className="block font-semibold text-[#051094] mt-4 mb-2">
          Wybierz produkt z listy:
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={selectedFood ? selectedFood.product_name : ""}
          onChange={(e) =>
            setSelectedFood(
              foodResults.find((food) => food.product_name === e.target.value)
            )
          }
        >
          <option value="">Wybierz produkt</option>
          {foodResults.map((food, index) => (
            <option key={index} value={food.product_name}>
              {food.product_name} - {food.nutriments?.["energy-kcal_100g"] || 0}{" "}
              kcal, {food.nutriments?.["proteins_100g"] || 0} g białka (na 100g)
            </option>
          ))}
        </select>
      </div>
    )
  );
}

function Grams({ grams, setGrams, addFood }) {
  return (
    <div>
      <label className="block font-semibold text-[#051094] mt-4 mb-2">
        Wprowadź gramaturę (w gramach):
      </label>
      <input
        type="number"
        value={grams}
        onChange={(e) => setGrams(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <button
        onClick={addFood}
        className="bg-[#051094] text-white py-2 px-4 rounded mt-2 w-full hover:bg-blue-800"
      >
        Dodaj do posiłku
      </button>
    </div>
  );
}

function MealName({ mealName, setMealName }) {
  return (
    <div>
      <label className="block font-semibold text-[#051094] mt-4 mb-2">
        Wprowadź nazwę posiłku:
      </label>
      <input
        type="text"
        value={mealName}
        onChange={(e) => setMealName(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>
  );
}

function Summary({ selectedFoods, saveMeal }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-[#051094] mb-2 mt-4">
        Wybrane produkty:
      </h3>
      <ul>
        {selectedFoods.map((food, index) => (
          <li key={index}>
            {food.name} {food.grams} g - {food.calories} kcal, {food.protein} g
            białka,{" "}
          </li>
        ))}
      </ul>
      <button
        onClick={saveMeal}
        className="bg-[#051094] text-white py-2 px-4 rounded mt-4 w-full hover:bg-blue-800"
      >
        Zapisz Posiłek
      </button>
    </div>
  );
}

function RecSection({ recs, getRecs }) {
  return (
    <div className="mt-8 bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
      <h3 className="text-2xl font-semibold text-center text-[#051094] mb-4">
        Rekomendacje
      </h3>
      <button
        onClick={getRecs}
        className="bg-[#051094] text-white py-2 px-4 rounded w-full hover:bg-blue-800"
      >
        Pokaż rekomendacje
      </button>

      {recs.length > 0 ? (
        <ul className="mt-4">
          {recs.map((rec, index) => (
            <li
              key={index}
              className="bg-gray-100 p-4 mb-2 rounded-lg border-l-4 border-[#051094]"
            >
              <p className="font-semibold text-[#051094]">
                {rec.name} - {rec.calories} kcal, {rec.protein} g białka
              </p>
              <p className="text-sm text-gray-600">Rekomendowany produkt</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 mt-4">
          Brak rekomendacji do wyświetlenia.
        </p>
      )}
    </div>
  );
}

export default Meals;

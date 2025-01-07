import React, { useState, useEffect } from "react";
import api from "./api";

function History() {
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [sleepHistory, setSleepHistory] = useState([]);

  useEffect(() => {
    getHistory();
  }, []);

  async function getHistory() {
    try {
      const [resWorkouts, resMeals, resSleep] = await Promise.all([
        api.get("/workouts"),
        api.get("/meals"),
        api.get("/sleep"),
      ]);

      setExerciseHistory(resWorkouts.data);
      setMealHistory(resMeals.data);
      setSleepHistory(resSleep.data);
    } catch (error) {
      console.error("Błąd podczas pobierania historii:", error);
    }
  }

  async function deleteWorkout(id) {
    try {
      await api.delete(`/workouts/${id}`);
      alert("Rekord treningu został usunięty!");
      getHistory();
    } catch (error) {
      console.error("Błąd podczas usuwania rekordu treningu:", error);
    }
  }

  async function deleteMeal(id) {
    try {
      await api.delete(`/meals/${id}`);
      alert("Rekord posiłku został usunięty!");
      getHistory();
    } catch (error) {
      console.error("Błąd podczas usuwania rekordu posiłku:", error);
    }
  }

  async function deleteSleep(id) {
    try {
      await api.delete(`/sleep/${id}`);
      alert("Rekord snu został usunięty!");
      getHistory();
    } catch (error) {
      console.error("Błąd podczas usuwania rekordu snu:", error);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-4xl font-bold text-center mb-6 text-[#051094]">
        Historia
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HistorySection title="Treningi">
          {exerciseHistory.length > 0 ? (
            exerciseHistory.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onDelete={deleteWorkout}
              />
            ))
          ) : (
            <EmptyMessage text="Brak zapisanych treningów." />
          )}
        </HistorySection>

        <HistorySection title="Posiłki">
          {mealHistory.length > 0 ? (
            mealHistory.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
            ))
          ) : (
            <EmptyMessage text="Brak zapisanych posiłków." />
          )}
        </HistorySection>

        <HistorySection title="Sen">
          {sleepHistory.length > 0 ? (
            sleepHistory.map((sleep) => (
              <SleepCard key={sleep.id} sleep={sleep} onDelete={deleteSleep} />
            ))
          ) : (
            <EmptyMessage text="Brak zapisanych danych o śnie." />
          )}
        </HistorySection>
      </div>
    </div>
  );
}

function HistorySection({ title, children }) {
  return (
    <section className="history-section bg-white border-2 border-[#051094] rounded-lg shadow-lg p-6 text-center w-full max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl text-[#051094] font-semibold mb-4">{title}</h2>
      <div className="flex flex-col items-center gap-4">{children}</div>
    </section>
  );
}

function EmptyMessage({ text }) {
  return <p className="text-gray-500">{text}</p>;
}

function WorkoutCard({ workout, onDelete }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
      <p className="font-bold text-center text-[#051094] mb-2">
        Data: {workout.date}
      </p>
      <div className="exercise-details mt-2 flex flex-col items-center gap-4">
        {workout.exercises.map((exercise, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-lg shadow w-full text-center"
          >
            <p className="text-xl font-bold text-[#051094]">{exercise.name}</p>
            <p className="mt-2">
              {exercise.series
                .map(
                  (serie, idx) =>
                    `Seria ${idx + 1}: ${serie.reps} powt., ${serie.weight} kg`
                )
                .join(" | ")}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={() => onDelete(workout.id)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-200 mt-2"
      >
        Usuń
      </button>
    </div>
  );
}

function MealCard({ meal, onDelete }) {
  const totalCalories = meal.products.reduce(
    (sum, product) => sum + parseFloat(product.calories || 0),
    0
  );
  const totalProtein = meal.products.reduce(
    (sum, product) => sum + parseFloat(product.protein || 0),
    0
  );

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
      <p className="font-bold text-center text-[#051094] mb-2">
        Data: {meal.date}
      </p>
      <p className="text-xl font-bold text-[#051094]">
        {meal.name || "Nieznany posiłek"}
      </p>
      <p className="mt-2">
        {totalCalories.toFixed(0)} kcal | {totalProtein.toFixed(0)} g białka
      </p>
      <p className="font-bold text-[#051094] mt-2">Produkty:</p>
      <ul className="text-gray-700 text-sm">
        {meal.products.map((product, index) => (
          <li key={index}>
            {product.name} {product.grams} g -{" "}
            {Number(product.calories).toFixed(0)} kcal,{" "}
            {Number(product.protein).toFixed(0)} g białka
          </li>
        ))}
      </ul>
      <button
        onClick={() => onDelete(meal.id)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-200 mt-2"
      >
        Usuń
      </button>
    </div>
  );
}

function SleepCard({ sleep, onDelete }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
      <p className="font-bold text-center text-[#051094] mb-2">
        Data: {sleep.date}
      </p>
      <p className="text-xl font-bold text-[#051094]">
        {sleep.startTime} - {sleep.endTime}
      </p>
      <p className="mt-2">{sleep.duration.toFixed(2)} h</p>
      <button
        onClick={() => onDelete(sleep.id)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-200 mt-2"
      >
        Usuń
      </button>
    </div>
  );
}

export default History;

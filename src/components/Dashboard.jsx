import React, { useState, useEffect } from "react";
import api from "./api";

function Dashboard() {
  const [progress, setProgress] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    async function loadProgress() {
      try {
        const [resProgress, resWorkouts, resMeals, resSettings] =
          await Promise.all([
            api.get("/current-progress"),
            api.get("/workouts"),
            api.get("/meals"),
            api.get("/settings"),
          ]);

        const currentDate = new Intl.DateTimeFormat("sv-SE").format(new Date());

        setProgress({
          dailyCaloriesGoal: resSettings.data?.dailyCaloriesGoal || 2000,
          dailyProteinGoal: resSettings.data?.dailyProteinGoal || 100,
          totalCalories: resProgress.data?.totalCalories || 0,
          totalProtein: resProgress.data?.totalProtein || 0,
          sleepDuration: resProgress.data?.sleepDuration || 0,
        });

        setWorkouts(
          resWorkouts.data.filter((workout) => workout.date === currentDate)
        );
        setMeals(resMeals.data.filter((meal) => meal.date === currentDate));
      } catch {
        alert("Błąd podczas ładowania danych. Spróbuj ponownie.");
      }
    }

    loadProgress();

    window.addEventListener("storage", loadProgress);
    return () => window.removeEventListener("storage", loadProgress);
  }, []);

  function resetProgressBars() {
    api
      .post("/reset-current-progress")
      .then(() => {
        setProgress((prev) => ({
          ...prev,
          totalCalories: 0,
          totalProtein: 0,
          sleepDuration: 0,
        }));
        alert("Progress bary zostały zresetowane.");
      })
      .catch(() =>
        alert("Nie udało się zresetować progress barów. Spróbuj ponownie.")
      );
  }

  return (
    <main className="container mx-auto mt-8 flex flex-col items-center">
      <h1 className="text-4xl text-[#051094] font-bold text-center mb-6">
        Twój Dashboard
      </h1>

      <div className="flex flex-col md:flex-row justify-center gap-6 mb-8 w-full max-w-7xl px-4">
        <DashboardSection title="Dzisiejsze treningi">
          {workouts.length > 0 ? (
            workouts.map((workout, index) => (
              <WorkoutCard key={index} workout={workout} />
            ))
          ) : (
            <p className="text-gray-500">Brak treningów z dzisiejszego dnia.</p>
          )}
        </DashboardSection>

        <DashboardSection title="Dzisiejsze posiłki">
          {meals.length > 0 ? (
            meals.map((meal, index) => <MealCard key={index} meal={meal} />)
          ) : (
            <p className="text-gray-500">Brak posiłków z dzisiejszego dnia.</p>
          )}
        </DashboardSection>
      </div>

      <ProgressBarSection
        progress={progress}
        resetProgressBars={resetProgressBars}
      />
    </main>
  );
}

function DashboardSection({ title, children }) {
  return (
    <section className="dashboard-section bg-white border-2 border-[#051094] rounded-lg shadow-lg p-6 text-center w-full lg:h-[500px] md:w-1/2 lg:w-3/5 md:h-[400px] flex flex-col justify-center overflow-y-auto">
      <h2 className="text-2xl text-[#051094] font-semibold mb-4">{title}</h2>
      <div className="flex flex-col items-center gap-4">{children}</div>
    </section>
  );
}

function WorkoutCard({ workout }) {
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
                  (serie, index) =>
                    `Seria ${index + 1}: ${serie.reps} powt., ${
                      serie.weight
                    } kg`
                )
                .join(" | ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealCard({ meal }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
      <p className="font-bold text-center text-[#051094] mb-2">
        Data: {meal.date}
      </p>
      <div className="bg-white p-4 rounded-lg shadow w-full text-center">
        <p className="text-xl font-bold text-[#051094] mb-2">
          {meal.name || "Nieznany posiłek"}
        </p>
        <p className="mt-2">
          {meal.products
            .reduce(
              (sum, product) => sum + parseFloat(product.calories || 0),
              0
            )
            .toFixed(0)}{" "}
          kcal |{" "}
          {meal.products
            .reduce((sum, product) => sum + parseFloat(product.protein || 0), 0)
            .toFixed(0)}{" "}
          g białka
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
      </div>
    </div>
  );
}

function ProgressBarSection({ progress = {}, resetProgressBars }) {
  const {
    totalCalories = 0,
    dailyCaloriesGoal = 2000,
    totalProtein = 0,
    dailyProteinGoal = 100,
    sleepDuration = 0,
  } = progress;

  const caloriePercentage = Math.min(
    (totalCalories / dailyCaloriesGoal) * 100,
    100
  );
  const proteinPercentage = Math.min(
    (totalProtein / dailyProteinGoal) * 100,
    100
  );
  const sleepPercentage = Math.min((sleepDuration / 8) * 100, 100);

  return (
    <section className="progress-section w-full max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Dzienny postęp
      </h2>

      <ProgressBar
        label="Ilość kalorii"
        percentage={caloriePercentage}
        value={`${totalCalories}/${dailyCaloriesGoal} kcal`}
      />
      <ProgressBar
        label="Ilość białka"
        percentage={proteinPercentage}
        value={`${totalProtein}/${dailyProteinGoal} g`}
      />
      <ProgressBar
        label="Ilość snu"
        percentage={sleepPercentage}
        value={`${sleepDuration.toFixed(2)}/8 h`}
      />

      <div className="text-center mt-4 mb-4">
        <button
          onClick={resetProgressBars}
          className="border-2 border-[#051094] text-[#051094] py-1 px-4 rounded-full transition duration-200 hover:bg-[#051094] hover:text-white"
          style={{ fontSize: "0.9rem" }}
        >
          Resetuj wartości
        </button>
      </div>
    </section>
  );
}

function ProgressBar({ label, percentage, value }) {
  return (
    <div className="progress-bar-container mb-6 w-full px-6">
      <p className="text-[#051094] font-bold text-left">{label}</p>
      <div className="progress-bar bg-gray-300 rounded-full h-6 relative overflow-hidden w-full">
        <div
          className="absolute top-0 left-0 h-full bg-[#051094] rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
        <label className="absolute inset-0 flex justify-center items-center text-white font-bold">
          {value}
        </label>
      </div>
    </div>
  );
}

export default Dashboard;

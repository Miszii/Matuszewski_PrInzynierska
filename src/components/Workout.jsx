import React, { useState, useEffect } from "react";
import api from "./api";

function Workout() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [series, setSeries] = useState([]);
  const [workout, setWorkout] = useState([]);

  useEffect(() => {
    async function getExercises() {
      try {
        const response = await api.get(
          "https://api.api-ninjas.com/v1/exercises?type=strength",
          {
            headers: {
              "X-Api-Key": "",
            },
          }
        );
        setExercises(response.data);
      } catch (error) {
        console.error("Błąd podczas pobierania ćwiczeń:", error);
      }
    }

    getExercises();
  }, []);

  function addSeries() {
    setSeries([...series, { reps: "", weight: "" }]);
  }

  function updateSeries(index, type, value) {
    const parsedValue = parseInt(value, 10);
    if (parsedValue < 0) {
      alert("Wartość nie może być ujemna!");
      return;
    }
    const updatedSeries = [...series];
    updatedSeries[index][type] = parsedValue || "";
    setSeries(updatedSeries);
  }

  function addExercise() {
    if (!selectedExercise || series.length === 0) {
      alert("Wybierz ćwiczenie i dodaj przynajmniej jedną serię.");
      return;
    }

    const exercise = exercises.find((ex) => ex.name === selectedExercise);
    const newExercise = { name: exercise.name, type: exercise.type, series };

    setWorkout([...workout, newExercise]);
    resetForm();
  }

  function resetForm() {
    setSelectedExercise("");
    setSeries([]);
  }

  async function saveWorkout() {
    if (workout.length === 0) {
      alert("Dodaj ćwiczenia do treningu");
      return;
    }

    const newWorkout = {
      date: new Intl.DateTimeFormat("sv-SE").format(new Date()),
      exercises: workout,
    };

    try {
      const response = await api.post("/workouts", newWorkout);
      if (response.status === 200 || response.status === 201) {
        alert("Trening został zapisany!");
        setWorkout([]);
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      console.error("Błąd podczas zapisywania treningu:", error);
      alert("Nie udało się zapisać treningu.");
    }
  }

  function removeExercise(index) {
    setWorkout(workout.filter((_, i) => i !== index));
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-4xl font-bold text-center mb-6 text-[#051094]">
        Dodaj Ćwiczenie do Treningu
      </h2>

      <ExerciseForm
        exercises={exercises}
        selectedExercise={selectedExercise}
        setSelectedExercise={setSelectedExercise}
        series={series}
        updateSeries={updateSeries}
        addSeries={addSeries}
        addExercise={addExercise}
      />

      <WorkoutSummary
        workout={workout}
        removeExercise={removeExercise}
        saveWorkout={saveWorkout}
      />
    </div>
  );
}

function ExerciseForm({
  exercises,
  selectedExercise,
  setSelectedExercise,
  series,
  updateSeries,
  addSeries,
  addExercise,
}) {
  return (
    <section className="bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
      <FormSelect
        label="Wybierz ćwiczenie z listy:"
        value={selectedExercise}
        setValue={setSelectedExercise}
        options={exercises.map((exercise) => ({
          value: exercise.name,
          label: exercise.name,
        }))}
      />

      <div className="form-group mb-4 text-center">
        <h3 className="text-xl font-semibold text-[#051094] mb-2">
          Serie i szczegóły
        </h3>
        {series.map((serie, index) => (
          <div key={index} className="mb-4">
            <label className="block text-sm font-semibold text-[#051094] mb-1">
              Seria {index + 1}
            </label>
            <div className="flex gap-4">
              <FormInput
                type="number"
                placeholder="Powtórzenia"
                value={serie.reps}
                setValue={(val) => updateSeries(index, "reps", val)}
              />
              <FormInput
                type="number"
                placeholder="Ciężar (kg)"
                value={serie.weight}
                setValue={(val) => updateSeries(index, "weight", val)}
              />
            </div>
          </div>
        ))}
        <button
          onClick={addSeries}
          className="bg-[#051094] text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200 mt-2"
        >
          Dodaj Serię
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={addExercise}
          className="bg-[#051094] text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
        >
          Dodaj do Treningu
        </button>
      </div>
    </section>
  );
}

function WorkoutSummary({ workout, removeExercise, saveWorkout }) {
  return (
    <section className="mt-8 bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
      <h3 className="text-2xl font-semibold text-center text-[#051094] mb-4">
        Twój Trening
      </h3>
      <ul>
        {workout.map((exercise, index) => (
          <li
            key={index}
            className="bg-gray-100 p-4 mb-4 rounded-lg border-l-4 border-[#051094] flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{exercise.name}</p>
              {exercise.series.map((serie, i) => (
                <p key={i}>
                  Seria {i + 1}: {serie.reps} powt., {serie.weight} kg
                </p>
              ))}
            </div>
            <button
              onClick={() => removeExercise(index)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Usuń
            </button>
          </li>
        ))}
      </ul>
      {workout.length > 0 && (
        <div className="text-center mt-4">
          <button
            onClick={saveWorkout}
            className="bg-[#051094] text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
          >
            Zapisz Trening
          </button>
        </div>
      )}
    </section>
  );
}

function FormSelect({ label, value, setValue, options }) {
  return (
    <div className="form-group mb-4 text-center">
      <label className="block font-semibold text-[#051094] mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      >
        <option value="">Wybierz opcję</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({ type, placeholder, value, setValue }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-1/2 p-2 border border-gray-300 rounded"
    />
  );
}

export default Workout;

import React, { useState, useEffect } from "react";
import api from "./api";

function Settings() {
  const [settings, setSettings] = useState({
    height: "",
    weight: "",
    age: "",
    gender: "male",
    dailyCaloriesGoal: "",
    dailyProteinGoal: "",
    activityLevel: "sedentary",
    plan: "weight-maintenance",
  });

  const [email, setEmail] = useState("");
  const [popup, setPopup] = useState(false);

  useEffect(() => {
    async function getData() {
      try {
        const [resSettings, resUser] = await Promise.all([
          api.get("/settings"),
          api.get("/users"),
        ]);

        if (resSettings.data) {
          setSettings((prev) => ({ ...prev, ...resSettings.data }));
        }

        setEmail(resUser.data?.email || localStorage.getItem("userEmail"));
      } catch {
        alert("Błąd podczas pobierania danych.");
      }
    }

    getData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  }

  function saveSettings(event) {
    event.preventDefault();
    async function postSettings() {
      try {
        await api.post("/settings", settings);
        alert("Ustawienia zostały zapisane.");

        const resSettings = await api.get("/settings");
        if (resSettings.data) {
          setSettings((prev) => ({ ...prev, ...resSettings.data }));
        }

        window.dispatchEvent(new Event("storage"));
      } catch {
        alert("Błąd podczas zapisywania ustawień.");
      }
    }
    postSettings();
  }

  function calculateGoals() {
    const { weight, height, age, gender, activityLevel, plan } = settings;
    if (!weight || !height || !age) return alert("Wprowadź swoje dane.");

    const BMR =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const PAL = {
      sedentary: 1.5,
      lightly_active: 1.6,
      moderately_active: 1.8,
      very_active: 2.0,
      super_active: 2.2,
    };

    const TDEE = BMR * PAL[activityLevel];

    const planGoals = {
      "weight-loss": { calories: TDEE * 0.85, protein: weight },
      "weight-maintenance": { calories: TDEE, protein: weight },
      "muscle-gain": { calories: TDEE + 500, protein: weight * 1.6 },
      recomposition: { calories: TDEE - 200, protein: weight * 1.6 },
    };

    setSettings((prev) => ({
      ...prev,
      dailyCaloriesGoal: Math.round(planGoals[plan]?.calories),
      dailyProteinGoal: Math.round(planGoals[plan]?.protein),
    }));

    setPopup(false);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl text-[#051094] font-bold text-center mb-6">
        Ustawienia użytkownika
      </h1>

      <SettingsForm
        settings={settings}
        handleChange={handleChange}
        saveSettings={saveSettings}
        setPopup={setPopup}
      />

      <PasswordReset email={email} />

      {popup && (
        <Popup
          closePopup={() => setPopup(false)}
          calculateGoals={calculateGoals}
          handleChange={handleChange}
          settings={settings}
        />
      )}
    </div>
  );
}

function PasswordReset({ email }) {
  const [newPassword, setNewPassword] = useState("");

  function changePassword() {
    if (!validatePassword(newPassword)) {
      alert(
        "Hasło musi mieć od 8 do 64 znaków i zawierać co najmniej jedną małą literę, wielką literę, cyfrę oraz znak specjalny."
      );
      return;
    }

    async function savePassword() {
      try {
        const res = await api.post("/change-password", { newPassword });
        alert(res.data.message);
        setNewPassword("");
      } catch {
        alert("Nie udało się zmienić hasła. Spróbuj ponownie.");
      }
    }
    savePassword();
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto mt-6">
      <p className="mb-4 font-semibold text-lg">
        Zalogowany jako: <span className="text-[#051094]">{email}</span>
      </p>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nowe hasło"
        className="w-full p-2 border rounded mb-2"
      />
      <small className="text-gray-500 block mb-4">
        Hasło musi mieć od 8 do 64 znaków, w tym co najmniej jedną małą literę,
        wielką literę, cyfrę oraz znak specjalny.
      </small>
      <button
        onClick={changePassword}
        className="w-full bg-[#051094] text-white py-2 px-4 rounded hover:bg-gray-700"
      >
        Zmień hasło
      </button>
    </section>
  );
}

function validatePassword(password) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;
  return passwordRegex.test(password);
}

function SettingsForm({ settings, handleChange, saveSettings, setPopup }) {
  return (
    <section className="bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl text-center font-semibold mb-4">Twoje dane</h2>
      <form onSubmit={saveSettings}>
        {[
          { label: "Wzrost (cm)", name: "height" },
          { label: "Waga (kg)", name: "weight" },
          { label: "Wiek", name: "age" },
        ].map(({ label, name }) => (
          <div key={name} className="mb-4">
            <label className="block font-semibold">{label}:</label>
            <input
              type="number"
              name={name}
              value={settings[name]}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        ))}

        <h2 className="text-2xl text-center font-semibold mb-4">Twoje cele</h2>
        <button
          type="button"
          onClick={() => setPopup(true)}
          className="w-full bg-[#051094] text-white py-2 px-4 rounded hover:bg-gray-700 mb-4"
        >
          Oblicz zalecenia
        </button>

        {[
          { label: "Cel dzienny kalorii (kcal)", name: "dailyCaloriesGoal" },
          { label: "Cel dzienny białka (g)", name: "dailyProteinGoal" },
        ].map(({ label, name }) => (
          <div key={name} className="mb-4">
            <label className="block font-semibold">{label}:</label>
            <input
              type="number"
              name={name}
              value={settings[name]}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-[#051094] text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Zapisz ustawienia
        </button>
      </form>
    </section>
  );
}

function Popup({ closePopup, calculateGoals, handleChange, settings }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg relative">
        <button
          onClick={closePopup}
          className="absolute top-2 right-2 text-gray-500 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Oblicz zalecenia
        </h2>

        <select
          name="activityLevel"
          value={settings.activityLevel}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
        >
          <option value="sedentary">Siedzący tryb życia</option>
          <option value="lightly_active">Niska aktywność</option>
          <option value="moderately_active">Umiarkowana aktywność</option>
          <option value="very_active">Wysoka aktywność</option>
          <option value="super_active">Bardzo wysoka aktywność</option>
        </select>

        <label className="block font-semibold mb-2">Wybierz plan:</label>
        <select
          name="plan"
          value={settings.plan}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
        >
          <option value="muscle-gain">Budowa masy mięśniowej</option>
          <option value="weight-loss">Redukcja masy ciała</option>
          <option value="weight-maintenance">Utrzymanie wagi</option>
          <option value="recomposition">Rekompozycja ciała</option>
        </select>

        <button
          onClick={calculateGoals}
          className="w-full bg-[#051094] text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Oblicz
        </button>
      </div>
    </div>
  );
}

export default Settings;

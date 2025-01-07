import React, { useState, useEffect } from "react";
import api from "./api";

function Sleep() {
  const [sleepHistory, setSleepHistory] = useState([]);
  const [sleepStart, setSleepStart] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");

  useEffect(() => {
    getSleep();
  }, []);

  async function getSleep() {
    try {
      const response = await api.get("/sleep");
      setSleepHistory(response.data);
    } catch (error) {
      console.error("Błąd podczas pobierania historii snu:", error);
    }
  }

  async function addSleep() {
    if (!sleepStart || !sleepEnd) {
      alert("Uzupełnij wszystkie pola.");
      return;
    }

    const start = new Date(`1970-01-01T${sleepStart}`);
    const end = new Date(`1970-01-01T${sleepEnd}`);

    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    const duration = (end - start) / (1000 * 60 * 60);
    const currentDate = new Intl.DateTimeFormat("sv-SE").format(new Date());

    const newSleep = {
      date: currentDate,
      startTime: sleepStart,
      endTime: sleepEnd,
      duration,
    };

    const alertConf = window.confirm(
      `Czy na pewno chcesz zapisać sen? 
      Data: ${currentDate} 
      Od: ${sleepStart} 
      Do: ${sleepEnd} 
      Czas trwania: ${duration.toFixed(2)} godziny.`
    );

    if (!alertConf) return;

    try {
      const response = await api.post("/sleep", newSleep);
      if (response.status === 201) {
        alert("Sen został zapisany!");
        setSleepHistory((prev) => [
          ...prev,
          { ...newSleep, id: response.data.id },
        ]);
        resetForm();
      }
    } catch (error) {
      console.error("Błąd podczas zapisywania snu:", error);
      alert("Nie udało się zapisać snu.");
    }
  }

  function resetForm() {
    setSleepStart("");
    setSleepEnd("");
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-4xl font-bold text-center mb-6 text-[#051094]">
        Monitorowanie Snu
      </h2>

      <SleepForm
        sleepStart={sleepStart}
        sleepEnd={sleepEnd}
        setSleepStart={setSleepStart}
        setSleepEnd={setSleepEnd}
        addSleep={addSleep}
      />

      <SleepHistory sleepHistory={sleepHistory} />
    </div>
  );
}

function SleepForm({
  sleepStart,
  sleepEnd,
  setSleepStart,
  setSleepEnd,
  addSleep,
}) {
  return (
    <section className="bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
      <h3 className="text-2xl font-semibold text-center text-[#051094] mb-4">
        Wprowadź swój sen
      </h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <FormInput
          label="Godzina zaśnięcia"
          type="time"
          value={sleepStart}
          setValue={setSleepStart}
        />
        <FormInput
          label="Godzina obudzenia"
          type="time"
          value={sleepEnd}
          setValue={setSleepEnd}
        />
        <div className="text-center">
          <button
            onClick={addSleep}
            className="bg-[#051094] text-white py-2 px-4 rounded hover:bg-blue-800 transition duration-200"
          >
            Zapisz Sen
          </button>
        </div>
      </form>
    </section>
  );
}

function SleepHistory({ sleepHistory }) {
  return (
    <section className="mt-8 bg-white border-2 border-[#051094] rounded-lg p-6 shadow-lg max-w-lg mx-auto">
      <h3 className="text-2xl font-semibold text-center text-[#051094] mb-4">
        Historia Snu
      </h3>
      {sleepHistory.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {sleepHistory.map((sleep) => (
            <li
              key={sleep.id}
              className="py-4 px-2 flex flex-col items-center text-center bg-gray-100 rounded mb-2 shadow-md"
            >
              <p className="font-semibold text-[#051094]">Data: {sleep.date}</p>
              <p>
                Od {sleep.startTime} do {sleep.endTime} -{" "}
                {sleep.duration.toFixed(2)} godziny
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">
          Brak zapisanej historii snu.
        </p>
      )}
    </section>
  );
}

function FormInput({ label, type, value, setValue }) {
  return (
    <div className="form-group mb-4">
      <label className="block font-semibold text-[#051094] mb-2">
        {label}:
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
        required
      />
    </div>
  );
}

export default Sleep;

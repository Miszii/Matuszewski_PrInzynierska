const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;
const SECRET = "testtest";

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("./backend/database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS sleep (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      products TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      exercises TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      height INTEGER,
      weight INTEGER,
      age INTEGER,
      gender TEXT,
      dailyCaloriesGoal INTEGER,
      dailyProteinGoal INTEGER,
      plan TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  db.run(`
    CREATE TABLE IF NOT EXISTS current_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE, 
      totalCalories REAL DEFAULT 0,
      totalProtein REAL DEFAULT 0,
      sleepDuration REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Brak tokenu." });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Błędny token." });
    req.user = user;
    next();
  });
};

app.get("/current-progress", authenticate, (req, res) => {
  const userId = req.user.id;
  db.get(
    "SELECT * FROM current_progress WHERE user_id = ?",
    [userId],
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Błąd pobierania current-progress." });
      }

      if (!row) {
        db.run(
          "INSERT INTO current_progress (user_id, totalCalories, totalProtein, sleepDuration) VALUES (?, 0, 0, 0)",
          [userId]
        );
      } else {
        res.json(row);
      }
    }
  );
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Wymagany email i hasło." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword],
      function (err) {
        if (err) {
          return res.status(400).json({ error: "Użytkownik już istnieje." });
        }
        res.status(201).json({ message: "Rejestracja zakończona sukcesem." });
      }
    );
  } catch {
    res.status(500).json({ error: "Błąd serwera." });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Wymagany email i hasło." });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: "Nieprawidłowe dane logowania." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Nieprawidłowe dane logowania." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  });
});

app.post("/change-password", authenticate, async (req, res) => {
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, req.user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Błąd zmiany hasła." });
        }
        res.status(200).json({ message: "Hasło zostało pomyślnie zmienione." });
      }
    );
  } catch {
    res.status(500).json({ error: "Błąd serwera." });
  }
});

app.post("/reset-current-progress", authenticate, (req, res) => {
  db.run(
    "UPDATE current_progress SET totalCalories = 0, totalProtein = 0, sleepDuration = 0 WHERE user_id = ?",
    [req.user.id],
    (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Błąd resetowania progress barów." });
      }
      res.status(200).json({ message: "Progress bary zresetowane." });
    }
  );
});

app.get("/settings", authenticate, (req, res) => {
  db.get(
    "SELECT * FROM settings WHERE user_id = ?",
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Błąd pobierania ustawień." });
      }
      res.json(row);
    }
  );
});

app.post("/settings", authenticate, (req, res) => {
  const {
    height,
    weight,
    age,
    gender,
    dailyCaloriesGoal,
    dailyProteinGoal,
    plan,
  } = req.body;

  db.get(
    "SELECT * FROM settings WHERE user_id = ?",
    [req.user.id],
    (err, row) => {
      if (err)
        return res.status(500).json({ error: "Błąd pobierania ustawień." });

      if (row) {
        db.run(
          `UPDATE settings 
         SET height = ?, weight = ?, age = ?, gender = ?, dailyCaloriesGoal = ?, dailyProteinGoal = ?, plan = ? 
         WHERE user_id = ?`,
          [
            height,
            weight,
            age,
            gender,
            dailyCaloriesGoal,
            dailyProteinGoal,
            plan,
            req.user.id,
          ],
          (updateErr) => {
            if (updateErr)
              return res
                .status(500)
                .json({ error: "Błąd aktualizacji ustawień." });
            res.status(200).json({
              message: "Ustawienia zaktualizowane.",
              settings: {
                height,
                weight,
                age,
                gender,
                dailyCaloriesGoal,
                dailyProteinGoal,
                plan,
              },
            });
          }
        );
      } else {
        db.run(
          `INSERT INTO settings (user_id, height, weight, age, gender, dailyCaloriesGoal, dailyProteinGoal, plan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            height,
            weight,
            age,
            gender,
            dailyCaloriesGoal,
            dailyProteinGoal,
            plan,
          ],
          (insertErr) => {
            if (insertErr)
              return res
                .status(500)
                .json({ error: "Błąd dodawania ustawień." });
            res.status(201).json({
              message: "Ustawienia dodane.",
              settings: {
                height,
                weight,
                age,
                gender,
                dailyCaloriesGoal,
                dailyProteinGoal,
                plan,
              },
            });
          }
        );
      }
    }
  );
});

app.get("/users", authenticate, (req, res) => {
  db.get("SELECT email FROM users WHERE id = ?", [req.user.id], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Błąd pobierania danych użytkownika." });
    }
    if (!row) {
      return res.status(404).json({ error: "Użytkownik nie znaleziony." });
    }
    res.json(row);
  });
});

app.post("/sleep", authenticate, (req, res) => {
  const { date, startTime, endTime, duration } = req.body;

  db.run(
    "INSERT INTO sleep (user_id, date, startTime, endTime, duration) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, date, startTime, endTime, duration],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Błąd podczas dodawania snu." });
      }

      db.run(
        "UPDATE current_progress SET sleepDuration = sleepDuration + ? WHERE user_id = ?",
        [duration, req.user.id]
      );
    }
  );
});

//Obsługa snu
app.get("/sleep", authenticate, (req, res) => {
  db.all(
    "SELECT * FROM sleep WHERE user_id = ? ORDER BY date DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Błąd pobierania historii snu." });
      }
      res.json(rows);
    }
  );
});

app.delete("/sleep/:id", authenticate, (req, res) => {
  db.get(
    "SELECT * FROM sleep WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, row) => {
      if (err || !row) {
        return res
          .status(404)
          .json({ error: "Rekord snu nie został znaleziony." });
      }

      const sleepDate = row.date;
      const currentDate = new Intl.DateTimeFormat("sv-SE").format(new Date());
      const sleepDuration = row.duration;

      db.run("DELETE FROM sleep WHERE id = ?", [req.params.id], (deleteErr) => {
        if (deleteErr) {
          return res
            .status(500)
            .json({ error: "Błąd podczas usuwania rekordu snu." });
        }

        if (sleepDate === currentDate) {
          db.run(
            "UPDATE current_progress SET sleepDuration = sleepDuration - ? WHERE user_id = ?",
            [Math.abs(sleepDuration), req.user.id]
          );
        }

        res.status(200).json({ message: "Rekord snu został usunięty." });
      });
    }
  );
});

//Obsługa treningów
app.post("/workouts", authenticate, (req, res) => {
  const { date, exercises } = req.body;
  db.run(
    "INSERT INTO workouts (user_id, date, exercises) VALUES (?, ?, ?)",
    [req.user.id, date, JSON.stringify(exercises)],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Błąd podczas dodawania treningu." });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get("/workouts", authenticate, (req, res) =>
  db.all(
    "SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC",
    [req.user.id],
    (_, rows) =>
      res.json(
        rows.map((row) => ({ ...row, exercises: JSON.parse(row.exercises) }))
      )
  )
);

app.delete("/workouts/:id", authenticate, (req, res) => {
  db.run(
    "DELETE FROM workouts WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err)
        return res.status(500).json({ error: "Błąd usuwania treningu." });
      res.status(200).json({ message: "Trening usunięty." });
    }
  );
});

//Obsługa posiłków i rekomendacji
app.post("/meals", authenticate, (req, res) => {
  const { name, products } = req.body;
  if (!name || !products || !Array.isArray(products)) {
    return res.status(400).json({ error: "Nieprawidłowe dane posiłku." });
  }

  const date = new Intl.DateTimeFormat("sv-SE").format(new Date());
  const protein = products.reduce(
    (accumulator, currentValue) => accumulator + parseInt(currentValue.protein),
    0
  );
  const calories = products.reduce(
    (accumulator, currentValue) =>
      accumulator + parseInt(currentValue.calories),
    0
  );

  db.run(
    "INSERT INTO meals (user_id, name, products, date) VALUES (?, ?, ?, ?)",
    [req.user.id, name, JSON.stringify(products), date],
    function (err) {
      if (err)
        return res.status(500).json({ error: "Błąd dodawania posiłku." });
      res.status(201).json({ id: this.lastID });

      db.run(
        "UPDATE current_progress SET totalCalories = totalCalories + ?, totalProtein = totalProtein + ? WHERE user_id = ?",
        [calories, protein, req.user.id]
      );
    }
  );
});

app.get("/meals", authenticate, (req, res) => {
  db.all(
    "SELECT * FROM meals WHERE user_id = ? ORDER BY date DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Błąd podczas pobierania posiłków." });
      }

      const meals = rows.map((row) => ({
        ...row,
        products: JSON.parse(row.products),
      }));

      res.json(meals);
    }
  );
});

app.delete("/meals/:id", authenticate, (req, res) => {
  db.get(
    "SELECT * FROM meals WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, row) => {
      if (err || !row) {
        return res
          .status(404)
          .json({ error: "Posiłek nie został znaleziony." });
      }

      const mealDate = row.date;
      const currentDate = new Intl.DateTimeFormat("sv-SE").format(new Date());
      const products = JSON.parse(row.products);

      const protein = products.reduce(
        (accumulator, currentValue) =>
          accumulator + parseInt(currentValue.protein),
        0
      );
      const calories = products.reduce(
        (accumulator, currentValue) =>
          accumulator + parseInt(currentValue.calories),
        0
      );

      db.run("DELETE FROM meals WHERE id = ?", [req.params.id]);

      if (mealDate === currentDate) {
        db.run(
          "UPDATE current_progress SET totalCalories = totalCalories - ?, totalProtein = totalProtein - ? WHERE user_id = ?",
          [calories, protein, req.user.id]
        );
      }

      res.status(200).json({ message: "Rekord snu został usunięty." });
    }
  );
});

app.get("/food-search", async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(
      "https://world.openfoodfacts.org/cgi/search.pl",
      {
        params: {
          search_terms: query,
          search_simple: 1,
          action: "process",
          json: 1,
          lc: "pl",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Błąd API Open Food Facts:", error.message);
    res.status(500).json({ error: "Nie udało się pobrać danych z API." });
  }
});

app.get("/recommendations", authenticate, async (req, res) => {
  try {
    const { spawn } = require("child_process");
    const process = spawn("python", ["./backend/recommendation.py"]);

    let recommendations = "";
    process.stdout.on("data", (data) => {
      recommendations += data.toString();
    });

    process.stderr.on("data", (data) => {
      console.error(`Błąd: ${data}`);
    });

    process.on("close", () => {
      const parsedRecommendations = JSON.parse(recommendations);
      res.json(parsedRecommendations);
    });
  } catch (error) {
    res.status(500).json({ error: "Błąd podczas generowania rekomendacji." });
  }
});

app.listen(PORT, () =>
  console.log(`Serwer działa na http://localhost:${PORT}`)
);

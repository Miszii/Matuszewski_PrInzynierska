import sqlite3
import pandas as pd
import json
from sklearn.cluster import KMeans
import seaborn as sns

def clusterPr(food, n_clusters=3):
    kmeans = KMeans(n_clusters=n_clusters, random_state=42).fit(food[["calories", "protein"]])
    food["cluster"] = kmeans.labels_
    return food

def generate(settings, food, clusterPref, weights):
    clusterData = food[food["cluster"] == clusterPref].copy()
    
    clusterData["score"] = (
        clusterData["calories"] * weights["calories"] +
        clusterData["protein"] * weights["protein"]
    )

    recommendations = clusterData.sort_values(by="score", ascending=True)
    return recommendations.head(5)[["name", "calories", "protein"]].to_dict("records")

def main():
    conn = sqlite3.connect("./backend/database.db")
    curs = conn.cursor()

    try:
        curs.execute("SELECT * FROM settings ORDER BY id DESC LIMIT 1")
        settings_row = curs.fetchone()
        curs.execute(
            """
            SELECT totalCalories, totalProtein 
            FROM current_progress 
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 1
            """, (settings_row[1],)
        )

        progress_row = curs.fetchone()
        settings = {
            "dailyCaloriesGoal": settings_row[6],
            "dailyProteinGoal": settings_row[7],
            "currentCalories": progress_row[0],
            "currentProtein": progress_row[1]
        }

        food = pd.read_sql_query("SELECT name, calories, protein FROM food_recommendations", conn)
        food["calories"] = pd.to_numeric(food["calories"])
        food["protein"] = pd.to_numeric(food["protein"])
        food = food[(food["calories"] <= 500) & (food["protein"] >= 5)]
        food = food.drop_duplicates(subset="name")
        data = clusterPr(food)
        plan = {
            "muscle-gain": {"calories": 0.7, "protein": 0.3},
            "weight-loss": {"calories": 0.6, "protein": 0.4},
            "weight-maintenance": {"calories": 0.5, "protein": 0.5},
            "recomposition": {"calories": 0.4, "protein": 0.6}
        }

        weights = plan.get(settings_row[8])
        col = data[["calories", "protein", "cluster"]]
        clusterAvg = col.groupby("cluster").mean()

        clusterPref = clusterAvg.apply(
            lambda row: row["calories"] * weights["calories"] + row["protein"] * weights["protein"],
            axis=1
        ).idxmax()

        recommendations = generate(settings, data, clusterPref, weights)

        print(json.dumps(recommendations, ensure_ascii=False, indent=4))

    finally:
        conn.close()

if __name__ == "__main__":
    main()

from flask import Flask, jsonify
import pandas as pd
import sqlite3
import os

app = Flask(__name__)

DB_PATH = os.getenv("DB_PATH", "/data/fantasy.sqlite")

@app.route("/analyze")
def analyze():
    try:
        # Abrir conexión a la base de datos
        conn = sqlite3.connect(DB_PATH)

        # Cargar datos de ejemplo desde la tabla de historial de mercado
        df = pd.read_sql_query("SELECT player_id, delta FROM player_market_history", conn)
        conn.close()

        if df.empty:
            return jsonify({"status": "ok", "records": 0, "results": []})

        # --- Conversión segura de tipos ---
        # Convertir la columna delta a numérica, forzando errores a NaN
        df["delta"] = pd.to_numeric(df["delta"], errors="coerce")

        # Reemplazar NaN por 0 (opcional, evita perder filas)
        df["delta"].fillna(0, inplace=True)

        # Asegurar tipo float para el cálculo
        df["delta"] = df["delta"].astype(float)

        # --- Cálculo de métricas ---
        result = (
            df.groupby("player_id")["delta"]
            .mean()
            .reset_index()
            .rename(columns={"delta": "avg_delta"})
            .sort_values("avg_delta", ascending=False)
            .to_dict(orient="records")
        )

        return jsonify({
            "status": "ok",
            "records": len(result),
            "results": result[:20]  # mostrar los 20 primeros
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

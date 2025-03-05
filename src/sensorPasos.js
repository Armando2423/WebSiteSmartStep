import React, { useEffect, useState } from "react";
import { Scatter, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  BarElement,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  BarElement
);

const ClusterScatterPlot = () => {
  const [chartData, setChartData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [jsonData, setJsonData] = useState([]);
  const [inputDuration, setInputDuration] = useState("");
  const [predictedSteps, setPredictedSteps] = useState(null);
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/resultados_clusters.json");
      const data = await response.json();
      setJsonData(data);

      const clusters = [[], [], []];
      data.forEach((entry) => {
        const clusterIndex = entry.Cluster;
        clusters[clusterIndex].push({
          x: new Date(entry.fecha).getTime(),
          y: entry.Pasos,
        });
      });

      setChartData({
        datasets: [
          { label: "Cluster 0", data: clusters[0], backgroundColor: "red" },
          { label: "Cluster 1", data: clusters[1], backgroundColor: "blue" },
          { label: "Cluster 2", data: clusters[2], backgroundColor: "green" },
        ],
      });

      const clusterSummary = [
        { cluster: "0", promedio: 1000 },
        { cluster: "1", promedio: 1450 },
        { cluster: "2", promedio: 1250 },
      ];

      setBarData({
        labels: clusterSummary.map((c) => c.cluster),
        datasets: [
          {
            label: "Pasos promedio",
            data: clusterSummary.map((c) => c.promedio),
            backgroundColor: "#4caf50",
            borderColor: "#388e3c",
            borderWidth: 1,
          },
        ],
      });
    };

    fetchData();
  }, []);

  useEffect(() => {
    setPredictedSteps(null);
  }, [inputDuration]);

  const handlePredict = () => {
    if (!inputDuration || isNaN(inputDuration)) {
      alert("Por favor, ingresa una duración válida en minutos.");
      return;
    }

    const k = 3;
    const inputDurationMinutes = parseFloat(inputDuration);

    if (!jsonData || jsonData.length === 0) {
      alert("No hay datos disponibles para realizar la predicción.");
      return;
    }

    const distances = jsonData
      .map((entry) => {
        const durationParts = entry.duracion.split(":");
        if (durationParts.length !== 3) return null;

        const durationMinutes =
          parseInt(durationParts[0], 10) * 60 +
          parseInt(durationParts[1], 10) +
          parseInt(durationParts[2], 10) / 60;

        if (isNaN(durationMinutes) || isNaN(entry.Pasos)) return null;

        return {
          ...entry,
          durationMinutes,
          distance: Math.abs(durationMinutes - inputDurationMinutes),
        };
      })
      .filter(Boolean);

    distances.sort((a, b) => a.distance - b.distance);

    if (distances.length < k) {
      alert("No hay suficientes datos para realizar una predicción precisa.");
      return;
    }

    const nearestNeighbors = distances.slice(0, k);
    const predicted = nearestNeighbors.reduce(
      (sum, neighbor) => sum + neighbor.Pasos,
      0
    ) / k;

    setPredictedSteps(Math.round(predicted));
  };

  const scatterOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Progreso Diario" },
    },
    scales: {
      x: { type: "time", title: { display: true, text: "Fecha" } },
      y: { title: { display: true, text: "Pasos" } },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "Pasos promedio por clúster" },
    },
    scales: {
      x: { title: { display: true, text: "Clúster" } },
      y: { title: { display: true, text: "Pasos promedio" } },
    },
  };

  const renderView = () => {
    if (viewIndex === 0 && chartData) return <Scatter data={chartData} options={scatterOptions} />;
    if (viewIndex === 1 && barData) return <Bar data={barData} options={barOptions} />;
    if (viewIndex === 2) {
      return (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              width: "100%",
              maxWidth: "300px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "#aaa",
              }}
            >
              👟
            </span>
            <input
              type="text"
              placeholder="Duración en minutos"
              value={inputDuration}
              onChange={(e) => setInputDuration(e.target.value)}
              style={{
                padding: "12px 12px 12px 36px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                width: "100%",
              }}
            />
          </div>
          <button
            onClick={handlePredict}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#4caf50",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              borderRadius: "8px",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#45a049")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#4caf50")}
          >
            Predecir
          </button>
          {predictedSteps && (
            <p style={{ marginTop: "10px", fontSize: "18px", color: "#333" }}>
              Pasos predichos: <strong>{predictedSteps}</strong>
            </p>
          )}
        </div>
      );
    }
    return <p>Cargando...</p>;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "20px",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        {viewIndex === 0
          ? "Gráfica de Clústeres"
          : viewIndex === 1
          ? "Gráfica de Barras"
          : "Predicción de Pasos"}
      </h1>
      <div style={{ width: "90%", display: "flex", flexDirection: "column", gap: "20px" }}>
        {renderView()}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            marginTop: "20px",
            transform: `rotate(${viewIndex === 2 ? 180 : 0}deg)`,
            transition: "transform 0.3s ease",
            cursor: "pointer",
          }}
          onClick={() => setViewIndex((prev) => (prev + 1) % 3)}
        >
          ➤
        </div>
      </div>
    </div>
  );
};

export default ClusterScatterPlot;

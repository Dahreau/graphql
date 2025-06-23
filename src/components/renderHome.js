"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchGraphQL } from "@/controllers/fetchGraphQL";
import { GET_FULL_STATS } from "@/queries/fullStatsQueries";
// (You can keep GET_PROFILE_INFOS etc. if needed elsewhere, but here we use only GET_FULL_STATS.)

export default function RenderHome() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [xpGains, setXPGains] = useState([]); // array of xp transactions (eventId 303)
  const [skills, setSkills] = useState([]); // array of skill transactions
  const [apiLevel, setApiLevel] = useState(null);
  const [totalXP, setTotalXP] = useState(0); // aggregate from server
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      router.push("/");
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch full stats in one query
        const resp = await fetchGraphQL(GET_FULL_STATS);
        if (resp.errors) {
          throw new Error(
            resp.errors[0]?.message || "GraphQL error in full stats"
          );
        }
        const data = resp.data;
        if (!data || !data.user || data.user.length === 0) {
          throw new Error("No user data returned");
        }
        const u = data.user[0];
        setUserData(u);

        // XP gains: array of xp transactions (already sorted ascending by createdAt)
        if (Array.isArray(u.transactions)) {
          setXPGains(u.transactions);
        } else {
          setXPGains([]);
        }

        // Total XP from aggregate
        const sumObj = u.XpTotal?.aggregate?.sum;
        const sumAmount =
          sumObj && typeof sumObj.amount === "number" ? sumObj.amount : 0;
        setTotalXP(sumAmount);

        // Level: latest level transaction
        if (Array.isArray(u.level) && u.level.length > 0) {
          const lvl = u.level[0]?.amount;
          if (typeof lvl === "number") {
            setApiLevel(lvl);
          } else {
            console.warn("Received non-numeric level:", lvl);
            setApiLevel(null);
          }
        } else {
          setApiLevel(null);
        }

        // Skills: latestSkills by type, but here we just store array for chart
        if (Array.isArray(u.skills)) {
          // We might want to take only the latest amount per skill type:
          // Since ordered ascending by createdAt, we can aggregate to keep last.
          const latestMap = {};
          u.skills.forEach((t) => {
            latestMap[t.type] = t.amount;
          });
          const skillsArray = Object.entries(latestMap)
            .map(([type, amount]) => ({
              type,
              amount,
            }))
            .sort((a, b) => b.amount - a.amount);
          setSkills(skillsArray);
        } else {
          setSkills([]);
        }
      } catch (err) {
        console.error("Error fetching full stats:", err);
        setError(err.message);
        localStorage.removeItem("jwtToken");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    router.push("/");
  };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!userData) return <p>User profile not available</p>;

  // Extract profile fields
  const firstName = userData.public?.firstName || "";
  const lastName = userData.public?.lastName || "";
  const rawAudit = userData.auditRatio ?? 0;
  const auditRatioRounded = Math.round(rawAudit * 10) / 10;
  const levelToDisplay = apiLevel !== null ? apiLevel : "-";

  return (
    <div className="app">
      <h1>
        Welcome {firstName} {lastName}
      </h1>

      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>

      <div className="dashboard">
        {/* Profile Info */}
        <div className="info-section">
          <h2>Profile Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Level:</span>
              <span className="info-value">{levelToDisplay}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Audit Ratio:</span>
              <span className="info-value">{auditRatioRounded}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total XP:</span>
              <span className="info-value">{totalXP.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* XP Evolution */}
        <div className="chart-section">
          <h2>XP Evolution</h2>
          <div className="linechart-container">
            <XPLineChart data={xpGains} />
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="chart-section">
            <h2>Skills</h2>
            <div className="skillschart-container">
              <SkillsChart skills={skills} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .app {
          padding: 20px;
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }
        .dashboard {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 20px;
          margin-top: 30px;
        }
        .info-section,
        .chart-section {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .info-section {
          grid-column: span 2;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: transform 0.3s ease;
        }
        .info-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        .info-label {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 8px;
        }
        .info-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        .logout-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }
        h1 {
          margin-bottom: 20px;
          color: #2c3e50;
        }
        h2 {
          color: #34495e;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #ecf0f1;
        }
        .linechart-container,
        .skillschart-container {
          width: 100%;
          overflow-x: auto;
        }
        @media (max-width: 1024px) {
          .dashboard {
            grid-template-columns: 1fr;
          }
          .info-section {
            grid-column: span 1;
          }
        }
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          .info-item {
            padding: 12px;
          }
          .info-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

// XPLineChart: renders cumulative XP by month from ascending-sorted transactions
function XPLineChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const prepareMonthlyData = () => {
    if (!data || data.length === 0) {
      return [];
    }
    // data is already sorted ascending by createdAt in the query.
    // But ensure sort just in case:
    const sortedData = [...data].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    const monthlyMap = {};
    let cumulativeXP = 0;
    sortedData.forEach((gain) => {
      const date = new Date(gain.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          year: date.getFullYear(),
          month: date.getMonth(),
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          displayDate: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          xp: 0,
          gain: 0,
        };
      }
      const amt = typeof gain.amount === "number" ? gain.amount : 0;
      monthlyMap[monthKey].gain += amt;
      cumulativeXP += amt;
      monthlyMap[monthKey].xp = cumulativeXP;
    });
    const monthlyData = Object.values(monthlyMap).sort(
      (a, b) => a.date - b.date
    );
    // Fill missing months
    const filledData = [];
    if (monthlyData.length > 0) {
      let currentDate = new Date(monthlyData[0].date);
      const endDate = new Date(monthlyData[monthlyData.length - 1].date);
      let lastXP = 0;
      while (currentDate <= endDate) {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        if (monthlyMap[monthKey]) {
          lastXP = monthlyMap[monthKey].xp;
          filledData.push(monthlyMap[monthKey]);
        } else {
          filledData.push({
            year: currentDate.getFullYear(),
            month: currentDate.getMonth(),
            date: new Date(currentDate),
            displayDate: currentDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            xp: lastXP,
            gain: 0,
          });
        }
        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        );
      }
    }
    return filledData;
  };

  const monthlyData = prepareMonthlyData();
  if (monthlyData.length === 0) {
    return <p>No XP data available</p>;
  }

  const VIRT_WIDTH = 800;
  const VIRT_HEIGHT = 400;
  const margin = { top: 30, right: 50, bottom: 70, left: 70 };
  const innerWidth = VIRT_WIDTH - margin.left - margin.right;
  const innerHeight = VIRT_HEIGHT - margin.top - margin.bottom;

  const minXp = Math.min(...monthlyData.map((d) => d.xp));
  const maxXp = Math.max(...monthlyData.map((d) => d.xp));

  // Y-axis ticks every 100k
  const yTicks = [];
  const step = 100000;
  for (let current = 0; current <= maxXp; current += step) {
    yTicks.push(current);
  }
  if (maxXp - (yTicks[yTicks.length - 1] ?? 0) > step * 0.5) {
    yTicks.push((yTicks[yTicks.length - 1] ?? 0) + step);
  }

  const xScale = (index) =>
    margin.left +
    (monthlyData.length > 1
      ? (index / (monthlyData.length - 1)) * innerWidth
      : innerWidth / 2);
  const yScale = (value) => {
    const maxYValue = yTicks.length > 0 ? Math.max(...yTicks) : maxXp;
    return (
      margin.top +
      innerHeight -
      ((value - minXp) / (maxYValue - minXp || 1)) * innerHeight
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toLocaleString()}k`;
    return num;
  };

  return (
    <div className="line-chart-wrapper" style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${VIRT_WIDTH} ${VIRT_HEIGHT}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid background */}
        <defs>
          <pattern
            id="grid"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Y axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + innerHeight}
          stroke="#333"
          strokeWidth="2"
        />
        {/* X axis */}
        <line
          x1={margin.left}
          y1={margin.top + innerHeight}
          x2={margin.left + innerWidth}
          y2={margin.top + innerHeight}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Y axis ticks */}
        {yTicks.map((tickValue, i) => {
          const y = yScale(tickValue);
          return (
            <g key={i}>
              <line
                x1={margin.left - 5}
                y1={y}
                x2={margin.left}
                y2={y}
                stroke="#333"
                strokeWidth="1"
              />
              <text
                x={margin.left - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
              >
                {formatNumber(tickValue)}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {monthlyData.map((d, i) => {
          const x = xScale(i);
          const showLabel = i % 2 === 0;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={margin.top + innerHeight}
                x2={x}
                y2={margin.top + innerHeight + 5}
                stroke="#333"
                strokeWidth="1"
              />
              {showLabel && (
                <text
                  x={x}
                  y={margin.top + innerHeight + 25}
                  textAnchor="middle"
                  fontSize="12"
                  transform={`rotate(45, ${x}, ${
                    margin.top + innerHeight + 25
                  })`}
                >
                  {d.displayDate}
                </text>
              )}
            </g>
          );
        })}

        {/* Line path */}
        <polyline
          fill="none"
          stroke="#4CAF50"
          strokeWidth="3"
          points={monthlyData
            .map((d, i) => `${xScale(i)},${yScale(d.xp)}`)
            .join(" ")}
        />

        {/* Data points */}
        {monthlyData.map((d, i) => (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(d.xp)}
              r="6"
              fill="#4CAF50"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <g>
            <rect
              x={xScale(hoveredIndex) - 100}
              y={yScale(monthlyData[hoveredIndex].xp) - 70}
              width={200}
              height={60}
              fill="white"
              stroke="#333"
              strokeWidth="1"
              rx="6"
              ry="6"
              style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.2))" }}
            />
            <text
              x={xScale(hoveredIndex)}
              y={yScale(monthlyData[hoveredIndex].xp) - 50}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#333"
            >
              {`Date: ${monthlyData[hoveredIndex].displayDate}`}
            </text>
            <text
              x={xScale(hoveredIndex)}
              y={yScale(monthlyData[hoveredIndex].xp) - 30}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {`XP Gained: ${monthlyData[hoveredIndex].gain.toLocaleString()}`}
            </text>
            <text
              x={xScale(hoveredIndex)}
              y={yScale(monthlyData[hoveredIndex].xp) - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {`Total XP: ${monthlyData[hoveredIndex].xp.toLocaleString()}`}
            </text>
          </g>
        )}

        {/* Axis labels */}
        <text
          x={margin.left - 50}
          y={margin.top + innerHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${margin.left - 50},${
            margin.top + innerHeight / 2
          })`}
          fontSize="14"
          fill="#333"
          fontWeight="bold"
        >
          Cumulative XP
        </text>
        <text
          x={margin.left + innerWidth / 2}
          y={VIRT_HEIGHT - 10}
          textAnchor="middle"
          fontSize="14"
          fill="#333"
          fontWeight="bold"
        >
          Month
        </text>
      </svg>
    </div>
  );
}

// SkillsChart: bar chart of latest skill amounts
function SkillsChart({ skills }) {
  const VIRT_WIDTH = 800;
  const VIRT_HEIGHT = 500;
  const margin = { top: 30, right: 50, bottom: 120, left: 70 };
  const innerWidth = VIRT_WIDTH - margin.left - margin.right;
  const innerHeight = VIRT_HEIGHT - margin.top - margin.bottom;

  const maxAmount = Math.max(...skills.map((s) => s.amount), 100);
  const barWidth = innerWidth / skills.length;

  return (
    <div className="skills-chart-wrapper" style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${VIRT_WIDTH} ${VIRT_HEIGHT}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + innerHeight}
          stroke="#333"
          strokeWidth="2"
        />
        {/* X axis */}
        <line
          x1={margin.left}
          y1={margin.top + innerHeight}
          x2={margin.left + innerWidth}
          y2={margin.top + innerHeight}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Y ticks */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = margin.top + innerHeight - (value / 100) * innerHeight;
          return (
            <g key={value}>
              <line
                x1={margin.left - 5}
                y1={y}
                x2={margin.left}
                y2={y}
                stroke="#333"
                strokeWidth="1"
              />
              <text
                x={margin.left - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
              >
                {value}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {skills.map((skill, i) => {
          const x = margin.left + i * barWidth;
          const percentage = (skill.amount / maxAmount) * 100;
          const barHeight = (percentage / 100) * innerHeight;
          const y = margin.top + innerHeight - barHeight;
          return (
            <g key={i}>
              <rect
                x={x + 10}
                y={y}
                width={barWidth - 20}
                height={barHeight}
                fill="#3498db"
                rx="4"
                ry="4"
              />
              <text
                x={x + barWidth / 2}
                y={margin.top + innerHeight + 35}
                textAnchor="middle"
                fontSize="12"
                transform={`rotate(45, ${x + barWidth / 2}, ${
                  margin.top + innerHeight + 35
                })`}
              >
                {skill.type}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#2c3e50"
              >
                {skill.amount}%
              </text>
            </g>
          );
        })}

        {/* Y label */}
        <text
          x={margin.left - 50}
          y={margin.top + innerHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${margin.left - 50},${
            margin.top + innerHeight / 2
          })`}
          fontSize="14"
          fill="#333"
          fontWeight="bold"
        >
          Skill Level (%)
        </text>
      </svg>
    </div>
  );
}

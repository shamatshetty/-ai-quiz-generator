import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart
} from 'lucide-react';

export default function AnalyticsTab({
  stats,
  history
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Line Chart Data (Chronological order)
  const lineChartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history]
      .sort((a, b) => new Date(a.attendedAt) - new Date(b.attendedAt))
      .map((item, index) => ({
        index,
        title: item.quizTitle,
        subject: item.subject,
        date: new Date(item.attendedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: item.score,
        accuracy: item.accuracyPercentage,
        totalQuestions: item.totalQuestions
      }));
  }, [history]);

  // 2. Subject-wise Strength / Weakness Bar Chart Data
  const subjectStats = useMemo(() => {
    const map = {};
    history.forEach((q) => {
      const s = q.subject || 'General';
      if (!map[s]) {
        map[s] = { subject: s, totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0 };
      }
      map[s].totalQuizzes += 1;
      map[s].totalCorrect += q.correctCount || 0;
      map[s].totalQuestions += q.totalQuestions || 0;
    });

    return Object.values(map).map((s) => {
      const accuracy = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;
      return {
        ...s,
        accuracy,
        rating: accuracy >= 80 ? 'Strength' : accuracy >= 60 ? 'Proficient' : 'Needs Practice'
      };
    }).sort((a, b) => b.accuracy - a.accuracy);
  }, [history]);

  // 3. Accuracy Breakdown (Correct vs Incorrect vs Unanswered)
  const accuracyDistribution = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    history.forEach((q) => {
      correct += q.correctCount || 0;
      incorrect += q.incorrectCount || 0;
      unanswered += q.unansweredCount || 0;
    });

    const total = correct + incorrect + unanswered || 1;
    return {
      correct,
      incorrect,
      unanswered,
      total,
      correctPct: Math.round((correct / total) * 100),
      incorrectPct: Math.round((incorrect / total) * 100),
      unansweredPct: Math.round((unanswered / total) * 100)
    };
  }, [history]);

  // SVG Coordinates for Line Chart
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 35;

  const points = useMemo(() => {
    if (lineChartData.length === 0) return [];
    if (lineChartData.length === 1) {
      return [{
        ...lineChartData[0],
        x: svgWidth / 2,
        y: svgHeight / 2
      }];
    }

    const maxScore = Math.max(...lineChartData.map((d) => d.accuracy), 100);
    const minScore = 0;

    return lineChartData.map((d, i) => {
      const x = paddingX + (i / (lineChartData.length - 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - ((d.accuracy - minScore) / (maxScore - minScore)) * (svgHeight - paddingY * 2);
      return { ...d, x, y };
    });
  }, [lineChartData]);

  // Generate smooth SVG curve path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  // Generate gradient area path below line
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = svgHeight - paddingY;
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [points, linePath]);

  // Donut Chart Math
  const donutRadius = 55;
  const donutCircumference = 2 * Math.PI * donutRadius;

  return (
    <div className="space-y-6 animate-tab-enter text-white">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-heading font-black text-white">Performance Analytics</h1>
        <p className="text-sm text-slate-400">
          Visual insights into your learning progression, subject strengths, and answer distributions.
        </p>
      </div>

      {/* 2. Top Metric Row: Score Progression Line Chart */}
      <div className="dashboard-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-heading font-bold text-white">
                Score Progression Over Time
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accuracy trajectory across chronological quiz attempts (hover over data points)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              Accuracy (%)
            </span>
            <span className="text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
              Avg: {stats?.overallAccuracy || 80}%
            </span>
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className="relative w-full overflow-x-auto pt-4">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 sm:h-56 overflow-visible select-none">
            <defs>
              <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2);
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#1E293B"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748B"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#scoreAreaGradient)" />
            )}

            {/* Main Progression Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#C084FC"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-stroke-draw"
              />
            )}

            {/* Data Circles with Interactive Hover */}
            {points.map((pt, i) => {
              const isHovered = hoveredPoint?.index === i;
              return (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#090D1F"
                    stroke="#C084FC"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X-axis Date label */}
                  <text
                    x={pt.x}
                    y={svgHeight - paddingY + 16}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {pt.date}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700 text-white text-xs shadow-2xl space-y-0.5 transform -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100}%`
              }}
            >
              <div className="font-heading font-bold text-amber-300">{hoveredPoint.title}</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span>Accuracy: <strong className="text-white">{hoveredPoint.accuracy}%</strong></span>
                <span>•</span>
                <span>Score: <strong className="text-emerald-400">{hoveredPoint.score}/{hoveredPoint.totalQuestions}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Two-Column Row: Subject Strengths Bar Chart + Accuracy Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Strength & Weakness (Animated Bar Chart) */}
        <div className="dashboard-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-heading font-bold text-white">
                Subject Mastery Strengths
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Mastery (%)</span>
          </div>

          <p className="text-xs text-slate-400">
            Performance broken down by subject curriculum. Bars expand automatically on load.
          </p>

          <div className="space-y-4 pt-2">
            {subjectStats.map((item) => (
              <div key={item.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-200">{item.subject}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold uppercase ${
                        item.accuracy >= 80
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.accuracy >= 60
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.rating}
                    </span>
                    <span className="font-mono text-white">{item.accuracy}%</span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out animate-bar-grow ${
                      item.accuracy >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : item.accuracy >= 60
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-500'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy Breakdown (SVG Donut Chart) */}
        <div className="dashboard-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-heading font-bold text-white">
              Accuracy Breakdown
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Total answer distribution across all answered questions in your history.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-3">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#1E293B"
                  strokeWidth="16"
                />
                {/* Correct Arc (Green) */}
                <circle
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray={donutCircumference}
                  strokeDashoffset={donutCircumference * (1 - accuracyDistribution.correctPct / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Incorrect Arc (Rose) */}
                <circle
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#F43F5E"
                  strokeWidth="16"
                  strokeDasharray={donutCircumference}
                  strokeDashoffset={donutCircumference * (1 - accuracyDistribution.incorrectPct / 100)}
                  style={{
                    transform: `rotate(${accuracyDistribution.correctPct * 3.6}deg)`,
                    transformOrigin: '70px 70px'
                  }}
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-heading font-black text-white">
                  {accuracyDistribution.correctPct}%
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Accuracy
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Correct</span>
                </div>
                <span className="font-mono text-white font-bold">
                  {accuracyDistribution.correct} ({accuracyDistribution.correctPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Incorrect</span>
                </div>
                <span className="font-mono text-white font-bold">
                  {accuracyDistribution.incorrect} ({accuracyDistribution.incorrectPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-600" />
                  <span className="text-slate-300">Unanswered</span>
                </div>
                <span className="font-mono text-white font-bold">
                  {accuracyDistribution.unanswered} ({accuracyDistribution.unansweredPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

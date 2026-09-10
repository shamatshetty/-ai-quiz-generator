/**
 * Utility functions for exporting and downloading quiz reports (CSV and Printable PDF).
 */

/**
 * Triggers a file download in the browser from a Blob or text string.
 */
export function triggerBlobDownload(blobOrContent, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob =
    blobOrContent instanceof Blob
      ? blobOrContent
      : new Blob([blobOrContent], { type: mimeType });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Escapes a field for CSV according to RFC 4180.
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

/**
 * Exports a student's personal quiz report as a CSV file.
 */
export function downloadStudentQuizReportCSV({
  studentName = 'Student',
  subject = 'General',
  quizTitle = 'Quiz Assessment',
  score = 0,
  maxScore = 0,
  accuracyPercentage = 0,
  timeTaken = 'N/A',
  date = new Date(),
  questions = [],
  studentAnswers = []
}) {
  const formattedDate = new Date(date).toLocaleString();
  const totalQuestions = questions.length || maxScore || 1;
  const rating =
    accuracyPercentage >= 90
      ? 'Outstanding Mastery'
      : accuracyPercentage >= 75
      ? 'Proficient'
      : accuracyPercentage >= 50
      ? 'Developing'
      : 'Needs Practice';

  const rows = [
    ['QUIZPOP! - STUDENT PERFORMANCE REPORT'],
    ['Generated On', formattedDate],
    ['Student Name', studentName],
    ['Quiz Title', quizTitle],
    ['Subject', subject],
    ['Final Score', `${score} / ${totalQuestions}`],
    ['Accuracy', `${accuracyPercentage}%`],
    ['Rating', rating],
    ['Time Taken', timeTaken],
    [],
    ['QUESTION BREAKDOWN'],
    [
      'Question #',
      'Question Text',
      'Your Answer',
      'Correct Answer',
      'Result',
      'Status',
      'Explanation'
    ]
  ];

  questions.forEach((q, idx) => {
    // Find matching student answer (supports various schema formats)
    let ans = null;
    if (Array.isArray(studentAnswers)) {
      ans =
        studentAnswers.find(
          (a) => a.questionIndex === idx || a.questionId === q.id || a.orderIndex === idx
        ) || studentAnswers[idx];
    }

    const options = Array.isArray(q.options)
      ? q.options
      : typeof q.options === 'string'
      ? JSON.parse(q.options || '[]')
      : [];

    let chosenText = 'Skipped / Timeout';
    if (ans && ans.selectedOption !== undefined && ans.selectedOption >= 0) {
      chosenText = options[ans.selectedOption] || `Option ${ans.selectedOption + 1}`;
    } else if (q.userAnswerText) {
      chosenText = q.userAnswerText;
    }

    let correctText = 'N/A';
    if (q.correctOptionIndex !== undefined && options[q.correctOptionIndex]) {
      correctText = options[q.correctOptionIndex];
    } else if (q.correctAnswerText) {
      correctText = q.correctAnswerText;
    }

    const isCorrect = ans ? Boolean(ans.isCorrect) : Boolean(q.isCorrect);
    const resultStr = isCorrect ? 'CORRECT' : 'INCORRECT';
    const statusIcon = isCorrect ? 'PASS' : 'FAIL';
    const explanation = q.explanation || 'No explanation provided.';

    rows.push([
      idx + 1,
      q.text || `Question ${idx + 1}`,
      chosenText,
      correctText,
      resultStr,
      statusIcon,
      explanation
    ]);
  });

  const csvContent = rows
    .map((row) => row.map(escapeCSV).join(','))
    .join('\r\n');

  const cleanSubject = (subject || 'Quiz').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `QuizReport_${cleanSubject}_${Date.now()}.csv`;

  triggerBlobDownload(csvContent, filename);
}

/**
 * Opens a clean, professional print dialog for saving as PDF or printing.
 */
export function printStudentQuizReport({
  studentName = 'Student',
  subject = 'General',
  quizTitle = 'Quiz Assessment',
  score = 0,
  maxScore = 0,
  accuracyPercentage = 0,
  timeTaken = 'N/A',
  date = new Date(),
  questions = [],
  studentAnswers = []
}) {
  const formattedDate = new Date(date).toLocaleString();
  const totalQuestions = questions.length || maxScore || 1;

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    alert('Popup was blocked by your browser. Please allow popups to view the printable report.');
    return;
  }

  const questionRowsHtml = questions
    .map((q, idx) => {
      let ans = null;
      if (Array.isArray(studentAnswers)) {
        ans =
          studentAnswers.find(
            (a) => a.questionIndex === idx || a.questionId === q.id || a.orderIndex === idx
          ) || studentAnswers[idx];
      }

      const options = Array.isArray(q.options)
        ? q.options
        : typeof q.options === 'string'
        ? JSON.parse(q.options || '[]')
        : [];

      let chosenText = 'Skipped / Timeout';
      if (ans && ans.selectedOption !== undefined && ans.selectedOption >= 0) {
        chosenText = options[ans.selectedOption] || `Option ${ans.selectedOption + 1}`;
      } else if (q.userAnswerText) {
        chosenText = q.userAnswerText;
      }

      let correctText = 'N/A';
      if (q.correctOptionIndex !== undefined && options[q.correctOptionIndex]) {
        correctText = options[q.correctOptionIndex];
      } else if (q.correctAnswerText) {
        correctText = q.correctAnswerText;
      }

      const isCorrect = ans ? Boolean(ans.isCorrect) : Boolean(q.isCorrect);

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${
          isCorrect ? '#f0fdf4' : '#fff1f2'
        };">
          <td style="padding: 10px; font-weight: bold; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px;">
            <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${q.text}</div>
            <div style="font-size: 11px; color: #475569;">
              <strong>Your Answer:</strong> <span style="color: ${
                isCorrect ? '#16a34a' : '#e11d48'
              }; font-weight: bold;">${chosenText}</span>
              ${
                !isCorrect
                  ? `<br/><strong>Correct Solution:</strong> <span style="color: #16a34a; font-weight: bold;">${correctText}</span>`
                  : ''
              }
              ${
                q.explanation
                  ? `<div style="margin-top: 4px; font-style: italic; color: #64748b;">💡 ${q.explanation}</div>`
                  : ''
              }
            </div>
          </td>
          <td style="padding: 10px; text-align: center; font-weight: bold; color: ${
            isCorrect ? '#16a34a' : '#e11d48'
          };">
            ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QuizPop! Report - ${quizTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 30px;
            margin: 0;
            line-height: 1.5;
          }
          .header {
            border-bottom: 3px solid #7c3aed;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand {
            font-size: 24px;
            font-weight: 900;
            color: #4f46e5;
          }
          .brand span {
            color: #ec4899;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
          }
          .card-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
          }
          .card-value {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f1f5f9;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #cbd5e1;
            font-weight: 700;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">QuizPop! <span>Assessment</span></div>
            <div style="font-size: 14px; color: #64748b; margin-top: 2px;">Student Performance Report</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <div><strong>Student:</strong> ${studentName}</div>
            <div><strong>Date:</strong> ${formattedDate}</div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 18px; color: #0f172a;">${quizTitle}</h2>
          <span style="font-size: 13px; color: #7c3aed; font-weight: bold;">${subject}</span>
        </div>

        <div class="meta-grid">
          <div class="card">
            <div class="card-label">Final Score</div>
            <div class="card-value" style="color: #7c3aed;">${score} / ${totalQuestions}</div>
          </div>
          <div class="card">
            <div class="card-label">Accuracy</div>
            <div class="card-value" style="color: #16a34a;">${accuracyPercentage}%</div>
          </div>
          <div class="card">
            <div class="card-label">Questions</div>
            <div class="card-value">${totalQuestions}</div>
          </div>
          <div class="card">
            <div class="card-label">Time Spent</div>
            <div class="card-value" style="font-size: 16px;">${timeTaken}</div>
          </div>
        </div>

        <h3 style="font-size: 15px; margin-bottom: 10px; color: #0f172a;">Detailed Question Review</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Question & Answers</th>
              <th style="width: 110px; text-align: center;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${questionRowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Report generated by QuizPop! Classroom Assessment Platform.
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Exports full class cohort standings as CSV.
 */
export function downloadCohortStandingsCSV(leaderboard = []) {
  const rows = [
    ['QUIZPOP! - CLASS COHORT LEADERBOARD STANDINGS'],
    ['Generated On', new Date().toLocaleString()],
    [],
    ['Rank', 'Student Name', 'Quizzes Attended', 'Accuracy %', 'Active Streak', 'Total Points']
  ];

  leaderboard.forEach((student, idx) => {
    rows.push([
      idx + 1,
      student.name || `Student ${idx + 1}`,
      student.quizzesPlayed || 1,
      `${student.accuracy || 85}%`,
      student.streak || 0,
      student.score || 0
    ]);
  });

  const csvContent = rows.map((row) => row.map(escapeCSV).join(',')).join('\r\n');
  triggerBlobDownload(csvContent, `CohortStandings_${Date.now()}.csv`);
}

import { AlternativeSections } from './components/AlternativeSections';
import React, { useState } from 'react';
import { ConversationalChat } from './components/ConversationalChat';

// --- Types ---
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface MeetingTime {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface CourseSection {
  id: string;
  courseCode: string;
  title: string;
  meetings: MeetingTime[];
}

export interface EvaluationResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  conflicts: string[];
}

// --- Mock Data & Constants ---
const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const MOCK_SECTIONS: CourseSection[] = [
  {
    id: 'sec-1',
    courseCode: 'CS 101',
    title: 'Intro to Computer Science',
    meetings: [
      { day: 'MON', startTime: '09:00', endTime: '10:30' },
      { day: 'WED', startTime: '09:00', endTime: '10:30' },
    ],
  },
  {
    id: 'sec-2',
    courseCode: 'MATH 201',
    title: 'Calculus I',
    meetings: [
      { day: 'MON', startTime: '10:00', endTime: '11:30' },
      { day: 'WED', startTime: '10:00', endTime: '11:30' },
    ],
  },
];

// --- Helpers ---
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getConflictingSectionIds(sections: CourseSection[]): Set<string> {
  const conflictingIds = new Set<string>();
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const secA = sections[i];
      const secB = sections[j];
      for (const mA of secA.meetings) {
        for (const mB of secB.meetings) {
          if (mA.day === mB.day && mA.startTime < mB.endTime && mB.startTime < mA.endTime) {
            conflictingIds.add(secA.id);
            conflictingIds.add(secB.id);
          }
        }
      }
    }
  }
  return conflictingIds;
}

function calculateBlockStyle(startTime: string, endTime: string) {
  const startMins = parseTimeToMinutes(startTime) - START_HOUR * 60;
  const durationMins = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
  return {
    top: `${(startMins / TOTAL_MINUTES) * 100}%`,
    height: `${(durationMins / TOTAL_MINUTES) * 100}%`,
  };
}

// --- Main Dashboard Component ---
export default function App() {
  const [major, setMajor] = useState('');
  const [modality, setModality] = useState('HYBRID');
  
  // Evaluation States (Live Risk & Conflict Integration)
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);

  const conflictingIds = getConflictingSectionIds(MOCK_SECTIONS);
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const handleRunEvaluation = async () => {
    setEvalLoading(true);
    setEvalError(null);
    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ major, modality }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
      }

      const data: EvaluationResult = await response.json();
      setEvaluationResults(data);
    } catch (err: any) {
      setEvaluationResults({
        riskScore: 65,
        riskLevel: 'MEDIUM',
        conflicts: ['CS 101 and MATH 201 overlap on Mon/Wed from 10:00 to 10:30.'],
      });
      setEvalError(err.message ? `Backend offline (using fallback mock data): ${err.message}` : null);
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '2rem' }}>
        
        {/* Header */}
        <header style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>
            SmartAdvisor Dashboard
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Assignee: Micen Desjardins</p>
        </header>

        {/* 1. Student Preferences Form */}
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Student Course Selection & Preferences
          </h2>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                Major / Program
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g., Computer Science"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                Modality Preference
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              >
                <option value="IN_PERSON">In Person</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <button
              onClick={handleRunEvaluation}
              disabled={evalLoading}
              style={{
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              {evalLoading ? 'Evaluating...' : 'Run Risk & Conflict Check'}
            </button>
          </div>

          {evalLoading && (
            <div style={{ marginTop: '1rem', color: '#2563eb', fontSize: '0.875rem' }}>
              Connecting to FastAPI backend and evaluating student flow...
            </div>
          )}

          {evalError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '4px', fontSize: '0.875rem' }}>
              {evalError}
            </div>
          )}

          {evaluationResults && !evalLoading && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1rem' }}>Evaluation Results</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <strong>Risk Score:</strong> {evaluationResults.riskScore} / 100 ({evaluationResults.riskLevel} Risk)
              </p>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                <strong>Conflict Highlights:</strong>
                <ul style={{ margin: '0.25rem 0 0 1.25rem', color: '#dc2626' }}>
                  {evaluationResults.conflicts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 2. Side-by-Side Dashboard Layout: Calendar (Left) & Chat Sidebar (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Calendar Grid Section */}
          <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Course Schedule Display
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', border: '1px solid #e5e7eb' }}>
              <div style={{ padding: '0.5rem', fontWeight: 'bold', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                Time
              </div>
              {DAYS.map((d) => (
                <div key={d} style={{ padding: '0.5rem', fontWeight: 'bold', textAlign: 'center', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  {d}
                </div>
              ))}

              <div style={{ borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                {hours.map((h) => (
                  <div key={h} style={{ height: '48px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', padding: '2px' }}>
                    {h}:00
                  </div>
                ))}
              </div>

              {DAYS.map((day) => (
                <div key={day} style={{ position: 'relative', borderRight: '1px solid #e5e7eb', height: '528px' }}>
                  {hours.map((h) => (
                    <div key={h} style={{ height: '48px', borderBottom: '1px solid #f3f4f6' }} />
                  ))}

                  {MOCK_SECTIONS.flatMap((sec) =>
                    sec.meetings
                      .filter((m) => m.day === day)
                      .map((m, idx) => {
                        const isConflict = conflictingIds.has(sec.id);
                        const stylePos = calculateBlockStyle(m.startTime, m.endTime);

                        return (
                          <div
                            key={`${sec.id}-${idx}`}
                            style={{
                              position: 'absolute',
                              width: '92%',
                              left: '4%',
                              ...stylePos,
                              padding: '6px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              border: isConflict ? '1px solid #ef4444' : '1px solid #60a5fa',
                              backgroundColor: isConflict ? '#fef2f2' : '#eff6ff',
                              color: isConflict ? '#991b1b' : '#1e40af',
                              boxSizing: 'border-box',
                            }}
                          >
                            <strong>{sec.courseCode}</strong>
                            <div>{sec.title}</div>
                            {isConflict && (
                              <span style={{ display: 'inline-block', marginTop: '4px', backgroundColor: '#dc2626', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '9px' }}>
                                ⚠️ Time Conflict
                              </span>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conversational Assistant Sidebar */}
          <div>
            <ConversationalChat />
          </div>

        </div>

      </div>
    </main>
  );
}
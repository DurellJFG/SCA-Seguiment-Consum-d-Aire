import React, { useState, useEffect } from 'react';

const AirConsumptionTracker = () => {
  // Styles
  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      padding: '1rem',
    },
    card: {
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      padding: '1rem',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    cardWarning: {
      border: '2px solid #ef4444',
    },
    header: {
      marginBottom: '1rem',
    },
    input: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.25rem',
      marginBottom: '0.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.25rem',
    },
    buttonGroup: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
    },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      flex: '1',
    },
    startButton: {
      backgroundColor: '#22c55e',
      color: 'white',
    },
    stopButton: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
    resetButton: {
      backgroundColor: '#e5e7eb',
      color: 'black',
    },
    readingsList: {
      marginTop: '1rem',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '1rem',
    },
    error: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '0.5rem',
    },
    stats: {
      marginTop: '1rem',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '1rem',
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.25rem',
    }
  };

  // Initial state for each intervinent
  const initialIntervinent = {
    id: 0,
    name: "",
    pressure: "",
    startTime: null,
    elapsedTime: 0,
    totalElapsedTime: 0,
    readings: [],
    newReading: "",
    error: "",
    estimatedTime: "N/A",
    estimatedPressure: "",
    warningTime: 15
  };

  // Create 6 intervinents
  const [intervinents, setIntervinents] = useState(
    Array.from({ length: 6 }, (_, i) => ({ ...initialIntervinent, id: i + 1 }))
  );

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIntervinents(prev =>
        prev.map(iv => {
          if (!iv.startTime) return iv;

          const currentElapsed = Math.floor((Date.now() - iv.startTime) / 1000);
          const totalElapsed = iv.totalElapsedTime + currentElapsed;
          let estimatedPressure = iv.pressure;
          let estimatedTime = "N/A";

          if (iv.readings.length > 0) {
            const lastReading = iv.readings[iv.readings.length - 1];
            const timeDiff = lastReading.time || 1;
            const pressureDiff = iv.pressure - lastReading.value;
            const consumptionRate = pressureDiff / timeDiff;

            if (consumptionRate > 0) {
              estimatedPressure = (lastReading.value - consumptionRate * (totalElapsed - lastReading.time)).toFixed(1);
              const remainingTime = Math.max(0, estimatedPressure / consumptionRate);
              const mins = Math.floor(remainingTime / 60);
              const secs = Math.floor(remainingTime % 60);
              estimatedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
          }

          return {
            ...iv,
            elapsedTime: totalElapsed,
            estimatedPressure: Math.max(0, estimatedPressure),
            estimatedTime
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = (id) => {
    setIntervinents(prev =>
      prev.map(iv =>
        iv.id === id ? { ...iv, startTime: Date.now() } : iv
      )
    );
  };

  const handleStop = (id) => {
    setIntervinents(prev =>
      prev.map(iv => {
        if (iv.id !== id) return iv;
        const currentSession = Math.floor((Date.now() - iv.startTime) / 1000);
        return {
          ...iv,
          startTime: null,
          totalElapsedTime: iv.totalElapsedTime + currentSession
        };
      })
    );
  };

  const handleReset = (id) => {
    setIntervinents(prev =>
      prev.map(iv =>
        iv.id === id ? { ...initialIntervinent, id } : iv
      )
    );
  };

  const handleAddReading = (id) => {
    setIntervinents(prev =>
      prev.map(iv => {
        if (iv.id !== id) return iv;

        const newReadingNum = parseFloat(iv.newReading);
        const pressureNum = parseFloat(iv.pressure);

        if (isNaN(newReadingNum) || isNaN(pressureNum)) {
          return { ...iv, error: "Si us plau, introduïu un valor vàlid." };
        }

        if (newReadingNum >= pressureNum) {
          return { ...iv, error: "La nova lectura ha de ser inferior a la pressió inicial." };
        }

        if (newReadingNum < 0) {
          return { ...iv, error: "La lectura no pot ser negativa." };
        }

        if (iv.readings.length > 0 && newReadingNum >= iv.readings[iv.readings.length - 1].value) {
          return { ...iv, error: "La nova lectura ha de ser inferior a l'anterior." };
        }

        return {
          ...iv,
          readings: [...iv.readings, { value: newReadingNum, time: iv.elapsedTime }],
          newReading: "",
          error: "",
          estimatedPressure: newReadingNum.toString()
        };
      })
    );
  };

  return (
    <div style={styles.grid}>
      {intervinents.map(iv => {
        const isActive = !!iv.startTime;
        const isWarning = parseFloat(iv.estimatedPressure) < 100 || 
                         (iv.estimatedTime !== "N/A" && parseInt(iv.estimatedTime.split(':')[0]) < iv.warningTime);

        return (
          <div key={iv.id} style={{
            ...styles.card,
            ...(isWarning ? styles.cardWarning : {})
          }}>
            <div style={styles.header}>
              <label style={styles.label}>Nom de l'Intervinent</label>
              <input
                type="text"
                style={styles.input}
                placeholder={`Intervinent ${iv.id}`}
                value={iv.name}
                onChange={e => setIntervinents(prev =>
                  prev.map(i => i.id === iv.id ? { ...i, name: e.target.value } : i)
                )}
              />
            </div>

            <div>
              <label style={styles.label}>Pressió Inicial (bars)</label>
              <input
                type="number"
                style={styles.input}
                placeholder="Pressió inicial"
                value={iv.pressure}
                onChange={e => setIntervinents(prev =>
                  prev.map(i => i.id === iv.id ? { ...i, pressure: e.target.value } : i)
                )}
                disabled={isActive}
              />
            </div>

            <div>
              <label style={styles.label}>Nova Lectura (bars)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  style={{ ...styles.input, marginBottom: 0 }}
                  placeholder="Nova lectura"
                  value={iv.newReading}
                  onChange={e => setIntervinents(prev =>
                    prev.map(i => i.id === iv.id ? { ...i, newReading: e.target.value } : i)
                  )}
                  disabled={!isActive}
                />
                <button
                  onClick={() => handleAddReading(iv.id)}
                  disabled={!isActive}
                  style={{
                    ...styles.button,
                    flex: '0 0 auto',
                    padding: '0.5rem',
                    backgroundColor: '#3b82f6'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label style={styles.label}>Temps de Preavís (min)</label>
              <input
                type="number"
                style={styles.input}
                placeholder="Temps de preavís"
                value={iv.warningTime}
                onChange={e => setIntervinents(prev =>
                  prev.map(i => i.id === iv.id ? { ...i, warningTime: parseInt(e.target.value) } : i)
                )}
              />
            </div>

            <div style={styles.buttonGroup}>
              {!isActive ? (
                <button
                  onClick={() => handleStart(iv.id)}
                  disabled={!iv.pressure}
                  style={{ ...styles.button, ...styles.startButton }}
                >
                  Iniciar
                </button>
              ) : (
                <button
                  onClick={() => handleStop(iv.id)}
                  style={{ ...styles.button, ...styles.stopButton }}
                >
                  Aturar
                </button>
              )}
              <button
                onClick={() => handleReset(iv.id)}
                style={{ ...styles.button, ...styles.resetButton }}
              >
                Reiniciar
              </button>
            </div>

            {iv.error && <p style={styles.error}>{iv.error}</p>}

            {iv.readings.length > 0 && (
              <div style={styles.readingsList}>
                <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Lectures:</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {iv.readings.map((reading, index) => (
                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{reading.value} bars</span>
                      <span>{formatTime(reading.time)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={styles.stats}>
              <div style={styles.statRow}>
                <span>Temps transcorregut:</span>
                <span>{formatTime(iv.elapsedTime)}</span>
              </div>
              <div style={styles.statRow}>
                <span>Pressió estimada:</span>
                <span style={{ color: isWarning ? '#ef4444' : 'inherit' }}>
                  {iv.estimatedPressure} bars
                </span>
              </div>
              <div style={styles.statRow}>
                <span>Temps estimat:</span>
                <span style={{ color: isWarning ? '#ef4444' : 'inherit' }}>
                  {iv.estimatedTime}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AirConsumptionTracker;
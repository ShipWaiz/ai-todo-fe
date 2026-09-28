import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Compass,
  Settings,
  X,
  Target,
  Zap,
  TrendingUp,
  BrainCircuit,
  RefreshCw,
  Globe
} from 'lucide-react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('General');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // AI Daily Briefing
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);

  // AI Breakdown Modal
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [goal, setGoal] = useState('');
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState({});

  // AI Prioritization Modal
  const [showPrioritize, setShowPrioritize] = useState(false);
  const [prioritizeLoading, setPrioritizeLoading] = useState(false);
  const [prioritizeResult, setPrioritizeResult] = useState(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem('GEMINI_API_KEY') || ''
  );
  const [apiUrl, setApiUrl] = useState(
    () => localStorage.getItem('VITE_API_URL') || (import.meta.env.VITE_API_URL || 'https://radiant-ganache-cd273a.netlify.app')
  );

  const API_BASE = apiUrl.trim().replace(/\/$/, '');

  useEffect(() => {
    fetchTodos();
  }, [apiUrl]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/todos`);
      const data = await res.json();
      if (data.success) {
        setTodos(data.data);
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e?.preventDefault();
    if (!newText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newText.trim(),
          priority: newPriority,
          category: newCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setTodos([data.data, ...todos]);
        setNewText('');
      }
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTodos(todos.map(t => (t.id === id ? data.data : t)));
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/todos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  // AI Feature: Smart Breakdown
  const handleAIBreakdown = async () => {
    if (!goal.trim()) return;
    try {
      setBreakdownLoading(true);
      const res = await fetch(`${API_BASE}/api/ai/breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          apiKey: geminiApiKey || undefined
        })
      });
      const data = await res.json();
      if (data.success && data.tasks) {
        setSuggestedTasks(data.tasks);
        const initialSelected = {};
        data.tasks.forEach((_, idx) => {
          initialSelected[idx] = true;
        });
        setSelectedSubtasks(initialSelected);
      }
    } catch (err) {
      console.error('Error in AI breakdown:', err);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleAddSelectedSubtasks = async () => {
    const toAdd = suggestedTasks.filter((_, idx) => selectedSubtasks[idx]);
    for (const task of toAdd) {
      await fetch(`${API_BASE}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: task.text,
          priority: task.priority || 'medium',
          category: task.category || 'Goal'
        })
      });
    }
    await fetchTodos();
    setShowBreakdown(false);
    setGoal('');
    setSuggestedTasks([]);
  };

  // AI Feature: Prioritization
  const handleAIPrioritize = async () => {
    try {
      setShowPrioritize(true);
      setPrioritizeLoading(true);
      const res = await fetch(`${API_BASE}/api/ai/prioritize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setPrioritizeResult(data);
      }
    } catch (err) {
      console.error('Error in AI prioritize:', err);
    } finally {
      setPrioritizeLoading(false);
    }
  };

  // AI Feature: Daily Briefing
  const handleFetchBriefing = async () => {
    try {
      setBriefingLoading(true);
      const res = await fetch(`${API_BASE}/api/ai/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error('Error fetching briefing:', err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey.trim());
    localStorage.setItem('VITE_API_URL', apiUrl.trim());
    setShowSettings(false);
    fetchTodos();
  };

  // Filtered & Searched Todos
  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  }).filter(t => {
    if (!search) return true;
    return t.text.toLowerCase().includes(search.toLowerCase()) ||
           t.category?.toLowerCase().includes(search.toLowerCase());
  });

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 className="brand-title">Smart To-Do</h1>
              <span className="brand-badge">Gemini AI</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
              Minimal full-stack AI task orchestrator PoC
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleFetchBriefing}
            disabled={briefingLoading}
            title="Generate AI Productivity Briefing"
          >
            {briefingLoading ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} color="#c084fc" />}
            Briefing
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleAIPrioritize}
            title="AI Task Coach & Prioritizer"
          >
            <BrainCircuit size={15} color="#38bdf8" />
            Coach
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(true)}
            title="Configure API and Gemini Keys"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Daily Briefing Banner (if generated) */}
      {briefing && (
        <div className="briefing-card">
          <Sparkles className="briefing-icon" size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c084fc', marginBottom: '4px' }}>
              AI Daily Motivation
            </div>
            <p className="briefing-text">{briefing}</p>
          </div>
          <button
            onClick={() => setBriefing('')}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Add Task Form */}
      <section className="add-task-card">
        <form onSubmit={handleAddTodo} className="add-task-form">
          <div className="input-row">
            <input
              type="text"
              className="input-text"
              placeholder="What needs to be accomplished today?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Add Task
            </button>
            <button
              type="button"
              className="btn btn-ai"
              onClick={() => setShowBreakdown(true)}
            >
              <Sparkles size={16} /> AI Breakdown
            </button>
          </div>

          <div className="options-row">
            <div className="selectors">
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Priority:</label>
              <select
                className="select-dropdown"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="high">🔥 High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">🌱 Low</option>
              </select>

              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px' }}>Category:</label>
              <select
                className="select-dropdown"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Work">💼 Work</option>
                <option value="Personal">🏡 Personal</option>
                <option value="Learning">📚 Learning</option>
                <option value="Health">🧘 Health</option>
                <option value="General">📌 General</option>
              </select>
            </div>

            <div className="stats-badge">
              {completedCount} of {totalCount} completed
            </div>
          </div>
        </form>
      </section>

      {/* Controls & Filter Bar */}
      <div className="controls-bar">
        <div className="filters-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({totalCount})
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({totalCount - completedCount})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        <input
          type="text"
          className="input-text"
          style={{ width: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Task List */}
      <main className="task-list">
        {loading ? (
          <div className="empty-state">Loading your tasks...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="empty-state">
            <Compass size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No tasks found in this view.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>
              Add a new task above or use <strong>AI Breakdown</strong> to turn a big goal into subtasks!
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`task-item ${todo.completed ? 'completed' : ''}`}
            >
              <div className="task-left">
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id, todo.completed)}
                />
                <div className="task-details">
                  <span className="task-text">{todo.text}</span>
                  <div className="task-tags">
                    <span className={`priority-pill ${todo.priority}`}>
                      {todo.priority}
                    </span>
                    <span className="category-tag">#{todo.category}</span>
                  </div>
                </div>
              </div>

              <button
                className="btn-delete"
                onClick={() => handleDelete(todo.id)}
                title="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </main>

      {/* AI Breakdown Modal */}
      {showBreakdown && (
        <div className="modal-overlay" onClick={() => setShowBreakdown(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#ec4899" />
                <h2 className="modal-title">AI Smart Task Breakdown</h2>
              </div>
              <button className="modal-close" onClick={() => setShowBreakdown(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Describe a high-level goal or project. Gemini AI will break it down into actionable, sequential tasks.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-text"
                placeholder="e.g., Prepare a SaaS pitch deck for investors"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIBreakdown()}
              />
              <button
                className="btn btn-ai"
                onClick={handleAIBreakdown}
                disabled={breakdownLoading}
              >
                {breakdownLoading ? 'Analyzing...' : 'Generate'}
              </button>
            </div>

            {suggestedTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc' }}>
                  Recommended Action Plan:
                </span>
                {suggestedTasks.map((task, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#0f172a',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={!!selectedSubtasks[idx]}
                      onChange={(e) =>
                        setSelectedSubtasks({
                          ...selectedSubtasks,
                          [idx]: e.target.checked
                        })
                      }
                    />
                    <span style={{ flex: 1 }}>{task.text}</span>
                    <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
                  </label>
                ))}

                <button
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  onClick={handleAddSelectedSubtasks}
                >
                  <Plus size={16} /> Add Selected to My List
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Prioritize Modal */}
      {showPrioritize && (
        <div className="modal-overlay" onClick={() => setShowPrioritize(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={20} color="#38bdf8" />
                <h2 className="modal-title">AI Productivity Coaching</h2>
              </div>
              <button className="modal-close" onClick={() => setShowPrioritize(false)}>
                <X size={18} />
              </button>
            </div>

            {prioritizeLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                Analyzing current task list with Gemini AI...
              </div>
            ) : prioritizeResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {prioritizeResult.focusTask && (
                  <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>
                      <Target size={14} /> TOP FOCUS RIGHT NOW
                    </div>
                    <p style={{ marginTop: '6px', fontSize: '0.95rem', fontWeight: 600 }}>
                      {prioritizeResult.focusTask}
                    </p>
                  </div>
                )}

                {prioritizeResult.quickWin && (
                  <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
                      <Zap size={14} /> QUICK WIN FOR MOMENTUM
                    </div>
                    <p style={{ marginTop: '6px', fontSize: '0.95rem', fontWeight: 600 }}>
                      {prioritizeResult.quickWin}
                    </p>
                  </div>
                )}

                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>
                    <TrendingUp size={14} /> STRATEGIC ADVICE
                  </div>
                  <p style={{ marginTop: '6px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {prioritizeResult.advice || prioritizeResult.analysis}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="#94a3b8" />
                <h2 className="modal-title">API & Deployment Settings</h2>
              </div>
              <button className="modal-close" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Globe size={14} /> Backend API URL (Optional):
                </label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. https://shipwaiz-ai-todo-be.netlify.app (Leave empty for default /api)"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Set this to your deployed Netlify backend URL or leave empty for local development.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Sparkles size={14} color="#ec4899" /> Google Gemini API Key (Optional):
                </label>
                <input
                  type="password"
                  className="input-text"
                  placeholder="AIzaSy..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Activates real-time Gemini 3.8 Flash model. If omitted, smart built-in heuristics are used.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

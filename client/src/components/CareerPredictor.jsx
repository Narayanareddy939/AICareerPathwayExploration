import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Target, 
  DollarSign, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  Send 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CareerPredictor({ activeStudent, studentList, onRequestMentorship }) {
  const [formData, setFormData] = useState({
    name: activeStudent?.name || 'Ananya Sharma',
    branch: activeStudent?.branch || 'Computer Science & Engineering',
    cgpa: activeStudent?.cgpa || 8.7,
    targetRole: activeStudent?.careerGoal || 'Data Scientist',
    skills: activeStudent?.skills ? activeStudent.skills.join(', ') : 'Python, Machine Learning, SQL, TensorFlow',
    certifications: activeStudent?.certifications ? activeStudent.certifications.join(', ') : 'Google Data Analytics'
  });

  const [recommendation, setRecommendation] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync state when activeStudent changes from Navbar selector
  useEffect(() => {
    if (activeStudent) {
      setFormData({
        name: activeStudent.name,
        branch: activeStudent.branch,
        cgpa: activeStudent.cgpa,
        targetRole: activeStudent.careerGoal || 'Software Engineer',
        skills: activeStudent.skills ? activeStudent.skills.join(', ') : '',
        certifications: activeStudent.certifications ? activeStudent.certifications.join(', ') : ''
      });
    }
  }, [activeStudent]);

  const handleRunPredictor = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const certsArray = formData.certifications.split(',').map(c => c.trim()).filter(Boolean);

    const payload = {
      name: formData.name,
      branch: formData.branch,
      cgpa: parseFloat(formData.cgpa),
      targetRole: formData.targetRole,
      skills: skillsArray,
      certifications: certsArray
    };

    try {
      // 1. Fetch AI Recommendation
      const resRec = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const dataRec = await resRec.json();

      // 2. Fetch Personalised Roadmap
      const resRoadmap = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: formData.targetRole, currentSkills: skillsArray })
      });
      const dataRoadmap = await resRoadmap.json();

      if (dataRec.success) {
        setRecommendation(dataRec);
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (dataRoadmap.success) {
        setRoadmap(dataRoadmap);
      }
    } catch (err) {
      console.error("Predictor API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction on load
  useEffect(() => {
    handleRunPredictor();
  }, [activeStudent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-indigo">KNN & Cosine Similarity ML Engine</span>
          <span className="badge badge-cyan">Real-time Analysis</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
          AI Career Predictor & <span className="gradient-text">Skill Gap Analyzer</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '700px' }}>
          Select a student profile or customize credentials to calculate your career match score, expected salary tier, missing skills, and step-by-step roadmap.
        </p>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Student Profile Input Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} color="#818cf8" />
            Target Student Credentials
          </h3>

          <form onSubmit={handleRunPredictor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                STUDENT NAME
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                BRANCH / MAJOR
              </label>
              <select
                value={formData.branch}
                onChange={e => setFormData({ ...formData, branch: e.target.value })}
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="CSE (Data Science)">CSE (Data Science)</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  CGPA
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="10"
                  value={formData.cgpa}
                  onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  TARGET ROLE
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g. Full Stack Developer"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                CURRENT SKILLS (Comma Separated)
              </label>
              <textarea
                rows={3}
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Python, React, SQL..."
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                CERTIFICATIONS
              </label>
              <input
                type="text"
                value={formData.certifications}
                onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="AWS, Google Data Analytics..."
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? <Zap size={18} className="spin" /> : <Sparkles size={18} />}
              {loading ? 'Analyzing Credentials...' : 'Run AI Recommendation'}
            </button>
          </form>
        </div>

        {/* Right Column: AI Analysis Results & Roadmap */}
        {recommendation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Recommendation Overview Cards */}
            <div className="grid-3">
              
              {/* Match Score Card */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(17, 24, 39, 0.8) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  OVERALL MATCH SCORE
                </span>
                <div style={{
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  color: '#818cf8',
                  lineHeight: 1,
                  margin: '0.5rem 0'
                }}>
                  {recommendation.overallMatchScore}%
                </div>
                <span className="badge badge-indigo">
                  High Alumni Alignment
                </span>
              </div>

              {/* Predicted Salary Card */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  PREDICTED SALARY PACKAGE
                </span>
                <h3 style={{ fontSize: '1.6rem', color: '#34d399', margin: '0.35rem 0' }}>
                  {recommendation.predictedSalaryRange}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Average: <strong style={{ color: '#fff' }}>{recommendation.averageSalary}</strong>
                </p>
              </div>

              {/* Predicted Target Role */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  ALUMNI TRAJECTORY ROLE
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#fbbf24', margin: '0.35rem 0' }}>
                  {recommendation.predictedRole}
                </h3>
                <span className="badge badge-amber" style={{ width: 'fit-content' }}>
                  {recommendation.targetDomain}
                </span>
              </div>
            </div>

            {/* Skill Gap Analysis & Recommended Certifications */}
            <div className="grid-2">
              
              {/* Missing High Impact Skills */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
                  <AlertCircle size={18} />
                  Skill Gap Analysis (Recommended Skills)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Key technical skills found in top matched alumni profiles that you currently lack:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {recommendation.missingSkills.map((sk, idx) => (
                    <span key={idx} className="badge badge-amber" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                      + {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Certifications */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                  <Award size={18} />
                  High Impact Certifications
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Industry certifications completed by top alumni working in this domain:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {recommendation.recommendedCertifications.map((cert, idx) => (
                    <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                      <CheckCircle2 size={12} /> {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Matched Alumni Mentors */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={18} color="#818cf8" />
                  Top Matched Alumni Mentors for You
                </h3>
                <span className="badge badge-indigo">Matching KNN Model</span>
              </div>

              <div className="grid-3">
                {recommendation.topMentors.map((mentor, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '1rem' }}>{mentor.name}</h4>
                        <span className="badge badge-emerald">{mentor.similarity}% Match</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600 }}>{mentor.currentRole}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{mentor.currentCompany} • {mentor.location}</p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(mentor.skills || []).slice(0, 3).map((s, i) => (
                        <span key={i} className="skill-chip">{s}</span>
                      ))}
                    </div>

                    <button 
                      className="btn-secondary" 
                      onClick={() => onRequestMentorship(mentor)}
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }}
                    >
                      <Send size={14} /> Request Mentorship
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Step-by-Step Career Roadmap */}
            {roadmap && (
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} color="#22d3ee" />
                  Personalized Step-by-Step Career Roadmap
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Actionable 4-phase execution plan to achieve your goal of <strong style={{ color: '#fff' }}>{roadmap.targetRole}</strong>:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {roadmap.milestones.map((m, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid #6366f1',
                      borderRadius: '10px',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span className="badge badge-indigo">{m.phase}</span>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>{m.recommendedCourse}</span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.35rem' }}>{m.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{m.description}</p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Key Focus Skills:</span>
                        {m.skillsToLearn.map((s, i) => (
                          <span key={i} className="skill-chip" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Sparkles size={40} color="#818cf8" style={{ margin: '0 auto 1rem auto' }} />
            <h3>Run the AI Predictor to see results</h3>
          </div>
        )}
      </div>
    </div>
  );
}

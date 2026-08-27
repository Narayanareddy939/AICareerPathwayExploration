import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Zap, 
  UploadCloud, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';

export default function ResumeAnalyzer({ activeStudent }) {
  const sampleResume = `ANANYA SHARMA
Email: ananya@university.edu | Phone: +91-9876543210 | Location: Bangalore
LinkedIn: linkedin.com/in/ananyasharma | GitHub: github.com/ananya-ml

EDUCATION
Bachelor of Technology in Computer Science & Engineering (2022 - 2026)
University Institute of Technology | CGPA: 8.7 / 10.0

EXPERIENCE
Data Science Intern | TechCorp (Jun 2025 - Aug 2025)
- Developed machine learning predictive model using Python, Scikit-Learn, and Pandas to forecast user retention.
- Optimized SQL database query execution times by 30%, improving API response speed.
- Built interactive data visualization dashboards in Power BI for leadership reporting.

PROJECTS
1. Sentiment Analysis Engine: Implemented NLP pipeline using PyTorch & Transformers to analyze 50,000 product reviews.
2. Image Classification App: Designed CNN neural network using TensorFlow & OpenCV with 94.2% test accuracy.

SKILLS
Programming: Python, SQL, Java, R
ML & AI: Machine Learning, TensorFlow, PyTorch, Scikit-Learn, Pandas, NumPy
Tools: Docker, Git, Power BI, AWS Cloud Practitioner

CERTIFICATIONS
- Google Data Analytics Professional Certificate
- AWS Cloud Practitioner Certification`;

  const [resumeText, setResumeText] = useState(sampleResume);
  const [targetRole, setTargetRole] = useState(activeStudent?.careerGoal || 'Data Scientist');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/api/analyze-resume', { resumeText, targetRole });
      const data = res.data;
      if (data.success) {
        setAnalysis(data);
      }
    } catch (err) {
      console.error("Resume analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(217, 70, 239, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-indigo">ATS Parser & Score Engine</span>
          <span className="badge badge-emerald">Instant Analysis</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
          AI Resume ATS <span className="gradient-text">Score & Optimizer</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '650px' }}>
          Paste your resume text below to scan against corporate Applicant Tracking Systems (ATS), detect missing role keywords, and score overall impact.
        </p>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left: Input Text area */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#d946ef" />
              Resume Text Content
            </h3>
            <button className="btn-secondary" onClick={() => setResumeText(sampleResume)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
              <RefreshCw size={12} /> Load Sample
            </button>
          </div>

          <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                TARGET JOB ROLE
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Data Scientist, Software Engineer"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                RESUME CONTENT (PASTE RAW TEXT)
              </label>
              <textarea
                rows={16}
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.6 }}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? <Zap size={18} className="spin" /> : <Sparkles size={18} />}
              {loading ? 'Scanning Resume...' : 'Analyze Resume Score'}
            </button>
          </form>
        </div>

        {/* Right: Results Analysis */}
        <div>
          {analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* ATS Score Radial Card */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(17, 24, 39, 0.9) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  OVERALL ATS COMPLIANCE SCORE
                </span>
                
                <div style={{
                  fontSize: '4rem',
                  fontWeight: 800,
                  color: analysis.atsScore >= 80 ? '#34d399' : analysis.atsScore >= 65 ? '#fbbf24' : '#f43f5e',
                  lineHeight: 1,
                  margin: '0.75rem 0'
                }}>
                  {analysis.atsScore}<span style={{ fontSize: '2rem' }}>/100</span>
                </div>

                <span className={`badge ${analysis.atsScore >= 80 ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                  Category: {analysis.scoreCategory}
                </span>
              </div>

              {/* Detected Sections Checklist */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  Key Section Verification
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['education', 'experience', 'projects', 'skills', 'certifications'].map((sec, i) => {
                    const found = analysis.sectionsFound.includes(sec);
                    return (
                      <div key={i} style={{
                        background: found ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        border: `1px solid ${found ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        borderRadius: '8px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textTransform: 'capitalize',
                        color: found ? '#34d399' : '#f43f5e'
                      }}>
                        {found ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {sec}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detected Skills vs Missing Target Keywords */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Skills & Keywords Analysis</h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    DETECTED TECH KEYWORDS ({analysis.detectedSkills.length})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {analysis.detectedSkills.map((sk, idx) => (
                      <span key={idx} className="badge badge-emerald">{sk}</span>
                    ))}
                  </div>
                </div>

                {analysis.missingKeywords.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      RECOMMENDED MISSING KEYWORDS FOR {targetRole.toUpperCase()}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {analysis.missingKeywords.map((kw, idx) => (
                        <span key={idx} className="badge badge-amber">+ {kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Improvement Recommendations */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} />
                  AI Improvement Recommendations
                </h4>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.suggestions.map((sug, idx) => (
                    <li key={idx} style={{ fontSize: '0.82rem', color: '#d1d5db', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#818cf8', fontWeight: 700 }}>•</span>
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <FileText size={40} color="#818cf8" style={{ margin: '0 auto 1rem auto' }} />
              <h3>Paste resume text and click Analyze Score</h3>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

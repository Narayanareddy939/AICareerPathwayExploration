# Machine Learning & AI Algorithms Specification

## 1. Hybrid Career Recommendation Engine

The platform employs a multi-criteria scoring algorithm that merges deterministic skill overlaps, historical alumni placement vectors, and market demand indices.

### Mathematical Formulation
$$\text{Score}(S, C) = w_1 \cdot \text{SkillMatch}(S, C) + w_2 \cdot \text{InterestMatch}(S, C) + w_3 \cdot \text{AcademicMatch}(S, C) + w_4 \cdot \text{AlumniSim}(S, C) + w_5 \cdot \text{MarketIndex}(C)$$

#### Default Weights:
- $w_1 = 0.35$ (Technical & Soft Skill Taxonomy Overlap)
- $w_2 = 0.20$ (Domain Preference & Career Objective Alignment)
- $w_3 = 0.20$ (Academic CGPA & Prerequisite Readiness)
- $w_4 = 0.15$ (Alumni Historical Pathway Density)
- $w_5 = 0.10$ (Live Hiring Demand & Growth Index)

---

## 2. Alumni Similarity Matching
Calculates peer distance across multidimensional vectors:

$$\text{Similarity}(S, A) = 0.40 \cdot \text{Jaccard}(S_{\text{skills}}, A_{\text{skills}}) + 0.25 \cdot \text{RoleMatch}(S_{\text{goal}}, A_{\text{role}}) + 0.20 \cdot \text{BranchMatch} + 0.15 \cdot \text{CGPADistance}$$

---

## 3. Natural Language Resume ATS Parser
- **Entity Extraction**: Tokenizes text into Section Headers, Technical Skills, Action Verbs, and Quantified Metric Sentences.
- **Scoring Breakdown**:
  - Section Completeness (25%)
  - Keyword Matching Density (35%)
  - Action Verb Strength (20%)
  - Formatting & Brevity (20%)

---

## 4. LLM-Assisted Adaptive Pathway Generation
Leverages **Google Gemini 1.5 Flash** with prompt templates containing:
- Student academic profile (CGPA, Branch, Year)
- Active skill portfolio vs. target role competencies
- Historical alumni trajectory case studies
- Curated course recommendations and milestone deadlines.

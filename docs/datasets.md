# Datasets & Provenance

## Processed Datasets

All raw CSV datasets have been parsed, normalized, deduplicated, and converted to structured JSON files located in `Datasets/processed/`:

| Dataset File | Source Raw File | Records | Content & Use Cases |
|---|---|---|---|
| `careers.json` | `career_dataset.csv` | 100 | Career profiles, industry categories, skill requirements, compensation bands, CAGR growth. |
| `skills.json` | `Abilities to Work Activities.xlsx` | 67 | Standardized skill taxonomy with aliases, categories (Programming, AI, Cloud, Databases), demand tiers. |
| `jobs.json` | `linkedin_job_postings_dataset.csv` + `job_data.csv` | 100 | Live tech vacancies, hiring organizations, experience levels, salary offerings. |
| `courses.json` | `coursera_courses.csv` | 100 | University & industry online certifications, ratings, providers, and skill mappings. |
| `alumni.json` | `Alumni_Data_1000_Rows.csv` | 1,000 | Verified alumni profiles, current roles, companies, graduation batches, CGPAs, and skills. |
| `data_sources.json` | System Metadata | 6 | Data provenance, update dates, and reliability audits. |

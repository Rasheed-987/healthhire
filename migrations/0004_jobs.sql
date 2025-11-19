-- Create jobs table
CREATE TABLE nhs_jobs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR UNIQUE,
  title VARCHAR NOT NULL,
  employer VARCHAR NOT NULL,
  location VARCHAR,
  band VARCHAR,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  person_spec TEXT,
  closing_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  visa_sponsorship BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create job_matches table
CREATE TABLE job_matches (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  job_id VARCHAR NOT NULL REFERENCES nhs_jobs(id),
  fit_score INTEGER,
  skills_match JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create applications table
CREATE TABLE applications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  job_title VARCHAR NOT NULL,
  employer VARCHAR NOT NULL,  
  location VARCHAR,
  salary VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'draft',
  applied_at TIMESTAMP,
  interview_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
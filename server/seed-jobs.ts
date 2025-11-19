import { storage } from "./storage";

const NHS_SAMPLE_JOBS = [
  {
    title: "Staff Nurse - Emergency Department",
    employer: "Guy's and St Thomas' NHS Foundation Trust",
    location: "London, SE1",
    band: "Band 5",
    salaryMin: 28407,
    salaryMax: 34581,
    description: `We are seeking a dedicated Staff Nurse to join our busy Emergency Department. This is an excellent opportunity for a newly qualified nurse or experienced professional looking to develop their emergency care skills.

Key Responsibilities:
- Provide high-quality nursing care to patients in the Emergency Department
- Work as part of a multidisciplinary team to deliver patient-centered care
- Assess, plan, implement and evaluate nursing care
- Maintain accurate patient records
- Support junior staff and students

Person Specification:
Essential:
- Registered Nurse (RN) with valid NMC registration
- Post-registration experience in acute care setting
- Strong communication and interpersonal skills
- Ability to work effectively under pressure
- Commitment to NHS values

Desirable:
- Emergency care experience
- Advanced life support training
- Mentorship qualification`,
    contractType: "Permanent",
    hoursPerWeek: 37.5,
    visaSponsorship: true,
    specialty: "Emergency Medicine",
    featured: true,
    isActive: true,
    requirements: [
      "NMC Registration",
      "6 months acute care experience",
      "Right to work in UK or visa sponsorship available"
    ],
    benefits: [
      "NHS Pension Scheme",
      "27 days annual leave plus bank holidays",
      "Career development opportunities",
      "Free parking"
    ]
  },
  {
    title: "Senior Physiotherapist - Musculoskeletal",
    employer: "Sheffield Teaching Hospitals NHS Foundation Trust",
    location: "Sheffield, S10",
    band: "Band 6",
    salaryMin: 35392,
    salaryMax: 42618,
    description: `Join our dynamic Musculoskeletal Physiotherapy team as a Senior Physiotherapist. You will work with patients with a range of musculoskeletal conditions in both outpatient and inpatient settings.

Key Responsibilities:
- Assess and treat patients with musculoskeletal conditions
- Develop and implement treatment plans
- Supervise junior physiotherapists and students
- Participate in service development initiatives
- Maintain clinical records and documentation

Person Specification:
Essential:
- BSc Physiotherapy or equivalent
- HCPC registration
- 2+ years post-qualification experience
- Experience in musculoskeletal physiotherapy
- Strong assessment and treatment skills

Desirable:
- Postgraduate qualification in musculoskeletal physiotherapy
- Manual therapy skills
- Research experience`,
    contractType: "Permanent",
    hoursPerWeek: 37.5,
    visaSponsorship: false,
    specialty: "Physiotherapy",
    featured: true,
    isActive: true,
    requirements: [
      "HCPC Registration",
      "BSc Physiotherapy",
      "2+ years experience"
    ],
    benefits: [
      "NHS Pension Scheme",
      "Professional development budget",
      "Study leave entitlement",
      "Cycle to work scheme"
    ]
  },
  {
    title: "Clinical Pharmacist - Cardiology",
    employer: "Imperial College Healthcare NHS Trust",
    location: "London, W12",
    band: "Band 7",
    salaryMin: 44606,
    salaryMax: 50056,
    description: `We are looking for an experienced Clinical Pharmacist to join our Cardiology team. This role involves providing pharmaceutical care to cardiology patients and supporting the multidisciplinary team.

Key Responsibilities:
- Provide clinical pharmacy services to cardiology patients
- Medicine reconciliation and optimization
- Patient counseling and education
- Drug monitoring and adverse event reporting
- Training and supervision of junior pharmacists

Person Specification:
Essential:
- MPharm degree or equivalent
- GPhC registration
- 3+ years post-registration experience
- Clinical pharmacy experience
- Knowledge of cardiovascular medicines

Desirable:
- Postgraduate clinical pharmacy qualification
- Cardiology experience
- Independent prescribing qualification`,
    contractType: "Permanent",
    hoursPerWeek: 37.5,
    visaSponsorship: true,
    specialty: "Pharmacy",
    featured: false,
    isActive: true,
    requirements: [
      "GPhC Registration",
      "MPharm Degree",
      "Clinical pharmacy experience"
    ],
    benefits: [
      "NHS Pension Scheme",
      "London Weighting",
      "Professional development opportunities",
      "Flexible working arrangements"
    ]
  },
  {
    title: "Biomedical Scientist - Haematology",
    employer: "Leeds Teaching Hospitals NHS Trust",
    location: "Leeds, LS1",
    band: "Band 5",
    salaryMin: 28407,
    salaryMax: 34581,
    description: `Join our Haematology laboratory team as a Biomedical Scientist. You will be responsible for performing routine and specialist haematology tests to support patient care.

Key Responsibilities:
- Perform haematology tests including FBC, blood films, and coagulation studies
- Operate and maintain laboratory equipment
- Quality control and quality assurance activities
- Report results and liaise with clinical staff
- Participate in laboratory development projects

Person Specification:
Essential:
- BSc Biomedical Science or equivalent
- HCPC registration
- Experience in haematology or related field
- Knowledge of laboratory information systems
- Attention to detail and accuracy

Desirable:
- MSc in relevant field
- Experience with automated analyzers
- Previous NHS experience`,
    contractType: "Permanent",
    hoursPerWeek: 37.5,
    visaSponsorship: true,
    specialty: "Biomedical Science",
    featured: false,
    isActive: true,
    requirements: [
      "HCPC Registration",
      "BSc Biomedical Science",
      "Laboratory experience"
    ],
    benefits: [
      "NHS Pension Scheme",
      "Career progression opportunities",
      "Training and development",
      "Staff discount schemes"
    ]
  },
  {
    title: "Consultant Radiologist",
    employer: "Oxford University Hospitals NHS Foundation Trust",
    location: "Oxford, OX3",
    band: "Consultant",
    salaryMin: 93666,
    salaryMax: 126281,
    description: `We are seeking a Consultant Radiologist to join our busy radiology department. This is an excellent opportunity for an experienced radiologist to work in a leading teaching hospital.

Key Responsibilities:
- Provide comprehensive radiology services across all modalities
- Supervise and train junior doctors and radiographers
- Participate in multidisciplinary team meetings
- Engage in research and teaching activities
- Quality assurance and clinical governance

Person Specification:
Essential:
- MBBS or equivalent medical qualification
- GMC registration with license to practice
- CCT in Clinical Radiology or equivalent
- At least 2 years post-CCT experience
- Experience in cross-sectional imaging

Desirable:
- Subspecialty expertise (MSK, Neuro, Cardiac)
- Research experience and publications
- Teaching qualifications`,
    contractType: "Permanent",
    hoursPerWeek: 40,
    visaSponsorship: true,
    specialty: "Radiology",
    featured: true,
    isActive: true,
    requirements: [
      "GMC Registration",
      "CCT in Clinical Radiology",
      "Post-CCT experience"
    ],
    benefits: [
      "NHS Pension Scheme",
      "Excellent research opportunities",
      "Study leave and educational support",
      "Competitive salary with increments"
    ]
  }
];

export async function seedNHSJobs() {
  console.log('Seeding NHS jobs...');
  
  for (const jobData of NHS_SAMPLE_JOBS) {
    try {
      await storage.createNhsJob(jobData);
      console.log(`✅ Created job: ${jobData.title} at ${jobData.employer}`);
    } catch (error) {
      console.error(`❌ Error creating job ${jobData.title}:`, error);
    }
  }
  
  console.log('NHS jobs seeding complete!');
}

// Run the seeding
seedNHSJobs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Job seeding failed:', error);
    process.exit(1);
  });
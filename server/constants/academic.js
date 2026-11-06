// Centralized academic branches with comprehensive sub-domains and specializations
const BRANCHES = [
  'Computer Science & Engineering',
  'CSE (Artificial Intelligence & Machine Learning)',
  'CSE (Data Science)',
  'CSE (Cyber Security)',
  'CSE (Cloud Computing)',
  'CSE (Internet of Things - IoT)',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Robotics & Automation Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology & Bioinformatics',
  'Master of Computer Applications (MCA)',
  'Bachelor of Computer Applications (BCA)',
  'Other Engineering / Science'
];

const ROLE_CERTIFICATIONS = {
  frontend: [
    'Meta Frontend Developer Professional Certificate',
    'AWS Certified Cloud Practitioner',
    'Google Mobile Web Specialist',
    'freeCodeCamp Full Stack Developer'
  ],
  backend: [
    'AWS Certified Developer - Associate',
    'Meta Backend Developer Professional Certificate',
    'Oracle Certified Professional: Java SE',
    'Docker Certified Associate (DCA)'
  ],
  fullstack: [
    'AWS Certified Solutions Architect - Associate',
    'Meta Full Stack Engineer Professional Certificate',
    'MongoDB Certified Developer Associate',
    'HashiCorp Certified: Terraform Associate'
  ],
  datascience: [
    'Google Professional Data Engineer',
    'IBM Data Science Professional Certificate',
    'Microsoft Certified: Azure Data Scientist Associate',
    'TensorFlow Developer Certificate'
  ],
  ai_ml: [
    'Google Professional Machine Learning Engineer',
    'AWS Certified Machine Learning - Specialty',
    'DeepLearning.AI Deep Learning Specialization',
    'TensorFlow Developer Certificate'
  ],
  devops: [
    'Certified Kubernetes Administrator (CKA)',
    'AWS Certified DevOps Engineer - Professional',
    'HashiCorp Certified: Terraform Associate',
    'Docker Certified Associate (DCA)'
  ],
  cloud: [
    'AWS Certified Solutions Architect - Associate',
    'Microsoft Certified: Azure Solutions Architect',
    'Google Cloud Certified Associate Cloud Engineer',
    'HashiCorp Certified: Terraform Associate'
  ],
  cybersecurity: [
    'CompTIA Security+ (SY0-701)',
    'Certified Ethical Hacker (CEH)',
    'Cisco Certified CyberOps Associate',
    'AWS Certified Security - Specialty'
  ],
  mobile: [
    'Google Associate Android Developer',
    'Meta React Native Specialization',
    'Apple Certified iOS App Developer (Swift)',
    'Flutter Certified Application Developer'
  ],
  electronics: [
    'ARM Accredited Engineer (AAE)',
    'Cisco Certified Network Associate (CCNA)',
    'Certified Embedded Systems Professional (CESP)',
    'IPC Standards Specialist Certification'
  ],
  product: [
    'Certified Scrum Product Owner (CSPO)',
    'Pragmatic Institute Certified Product Manager',
    'Google Project Management Professional',
    'Reforge Growth & Product Strategy'
  ],
  default: [
    'AWS Certified Cloud Practitioner',
    'Google Professional IT Support & Cloud',
    'Meta Professional Certification',
    'Certified ScrumMaster (CSM)'
  ]
};

function getRecommendedCertifications(role = '', branch = '') {
  const r = (role || '').toLowerCase();
  const b = (branch || '').toLowerCase();

  if (r.includes('front') || r.includes('ui') || r.includes('react') || r.includes('web')) {
    return ROLE_CERTIFICATIONS.frontend;
  }
  if (r.includes('back') || r.includes('node') || r.includes('java') || r.includes('api')) {
    return ROLE_CERTIFICATIONS.backend;
  }
  if (r.includes('full') || r.includes('stack') || r.includes('software')) {
    return ROLE_CERTIFICATIONS.fullstack;
  }
  if (r.includes('ai') || r.includes('ml') || r.includes('machine learning') || r.includes('deep learning')) {
    return ROLE_CERTIFICATIONS.ai_ml;
  }
  if (r.includes('data') || r.includes('analyst') || r.includes('business analyst')) {
    return ROLE_CERTIFICATIONS.datascience;
  }
  if (r.includes('devops') || r.includes('sre') || r.includes('reliability') || r.includes('kubernetes')) {
    return ROLE_CERTIFICATIONS.devops;
  }
  if (r.includes('cloud') || r.includes('aws') || r.includes('azure')) {
    return ROLE_CERTIFICATIONS.cloud;
  }
  if (r.includes('sec') || r.includes('cyber') || r.includes('penetration') || r.includes('soc')) {
    return ROLE_CERTIFICATIONS.cybersecurity;
  }
  if (r.includes('android') || r.includes('ios') || r.includes('mobile') || r.includes('flutter')) {
    return ROLE_CERTIFICATIONS.mobile;
  }
  if (r.includes('embed') || r.includes('vlsi') || r.includes('hardware') || b.includes('electronic') || b.includes('ece') || b.includes('eee')) {
    return ROLE_CERTIFICATIONS.electronics;
  }
  if (r.includes('product') || r.includes('manager') || r.includes('scrum')) {
    return ROLE_CERTIFICATIONS.product;
  }

  // Branch-specific fallback
  if (b.includes('data') || b.includes('ai')) return ROLE_CERTIFICATIONS.ai_ml;
  if (b.includes('cyber')) return ROLE_CERTIFICATIONS.cybersecurity;
  if (b.includes('cloud')) return ROLE_CERTIFICATIONS.cloud;
  if (b.includes('electronic') || b.includes('ece')) return ROLE_CERTIFICATIONS.electronics;

  return ROLE_CERTIFICATIONS.default;
}

module.exports = {
  BRANCHES,
  ROLE_CERTIFICATIONS,
  getRecommendedCertifications
};


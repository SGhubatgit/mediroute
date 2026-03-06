"""
Symptom Analysis Engine
Keyword-based mapping of symptoms to departments with severity detection.
"""

SYMPTOM_DEPARTMENT_MAP = {
    'Cardiology': {
        'keywords': [
            'chest pain', 'heart pain', 'shortness of breath', 'breathlessness',
            'palpitations', 'heart attack', 'irregular heartbeat', 'chest tightness',
            'chest pressure', 'angina', 'heart failure', 'cardiac', 'heart racing',
            'dizziness with chest pain', 'left arm pain', 'jaw pain',
        ],
        'high_severity_keywords': [
            'chest pain', 'heart attack', 'chest tightness', 'shortness of breath',
            'left arm pain', 'breathlessness',
        ],
        'description': 'Heart and cardiovascular conditions',
    },
    'Dermatology': {
        'keywords': [
            'skin rash', 'itching', 'allergy', 'eczema', 'psoriasis', 'acne',
            'hives', 'skin infection', 'redness', 'blisters', 'skin irritation',
            'dermatitis', 'fungal infection', 'warts', 'moles', 'hair loss',
            'nail infection', 'dry skin', 'peeling skin', 'skin lesion',
        ],
        'high_severity_keywords': [
            'severe skin rash', 'spreading rash', 'anaphylaxis',
        ],
        'description': 'Skin, hair, and nail conditions',
    },
    'Orthopedics': {
        'keywords': [
            'bone pain', 'fracture', 'joint pain', 'back pain', 'knee pain',
            'shoulder pain', 'hip pain', 'neck pain', 'muscle pain', 'sprain',
            'swollen joint', 'arthritis', 'osteoporosis', 'spine', 'disc',
            'ligament', 'tendon', 'wrist pain', 'ankle pain', 'foot pain',
            'sports injury', 'broken bone', 'dislocation',
        ],
        'high_severity_keywords': [
            'fracture', 'broken bone', 'severe back pain', 'cannot walk',
        ],
        'description': 'Bones, joints, and musculoskeletal conditions',
    },
    'General Medicine': {
        'keywords': [
            'fever', 'cough', 'headache', 'cold', 'flu', 'fatigue', 'weakness',
            'body ache', 'nausea', 'vomiting', 'diarrhea', 'constipation',
            'stomach pain', 'abdominal pain', 'loss of appetite', 'dehydration',
            'viral infection', 'bacterial infection', 'sore throat', 'runny nose',
            'chills', 'sweating', 'malaise', 'general weakness', 'tiredness',
        ],
        'high_severity_keywords': [
            'high fever', 'severe vomiting', 'severe dehydration',
        ],
        'description': 'General health conditions and common illnesses',
    },
    'Neurology': {
        'keywords': [
            'migraine', 'severe headache', 'numbness', 'tingling', 'seizure',
            'epilepsy', 'memory loss', 'confusion', 'stroke', 'tremor',
            'paralysis', 'vertigo', 'balance problems', 'coordination issues',
            'nerve pain', 'neuropathy', 'brain', 'spinal cord',
        ],
        'high_severity_keywords': [
            'stroke', 'seizure', 'sudden numbness', 'sudden confusion',
            'severe migraine', 'loss of consciousness',
        ],
        'description': 'Brain, spine, and nervous system conditions',
    },
    'Gastroenterology': {
        'keywords': [
            'bloating', 'gas', 'acid reflux', 'heartburn', 'ulcer', 'ibs',
            'irritable bowel', 'colitis', 'crohns', 'liver', 'hepatitis',
            'jaundice', 'gallstones', 'pancreatitis', 'indigestion',
            'abdominal cramps', 'rectal bleeding', 'blood in stool',
        ],
        'high_severity_keywords': [
            'blood in stool', 'rectal bleeding', 'severe abdominal pain',
            'jaundice', 'liver failure',
        ],
        'description': 'Digestive system and gastrointestinal conditions',
    },
    'ENT': {
        'keywords': [
            'ear pain', 'hearing loss', 'ear infection', 'tinnitus', 'nasal congestion',
            'sinus', 'sinusitis', 'tonsils', 'throat pain', 'hoarseness',
            'voice loss', 'snoring', 'sleep apnea', 'nose bleeding', 'ear discharge',
        ],
        'high_severity_keywords': [
            'nose bleeding', 'severe ear pain', 'sudden hearing loss',
        ],
        'description': 'Ear, nose, and throat conditions',
    },
    'Ophthalmology': {
        'keywords': [
            'eye pain', 'blurred vision', 'vision loss', 'red eye', 'eye infection',
            'conjunctivitis', 'glaucoma', 'cataract', 'floaters', 'double vision',
            'dry eyes', 'watery eyes', 'eye discharge', 'photophobia',
        ],
        'high_severity_keywords': [
            'sudden vision loss', 'severe eye pain', 'chemical in eye',
        ],
        'description': 'Eye and vision conditions',
    },
}

HIGH_SEVERITY_COMBOS = [
    (['chest pain', 'shortness of breath'], 'Possible cardiac emergency'),
    (['chest pain', 'breathlessness'], 'Possible cardiac emergency'),
    (['stroke', 'numbness'], 'Possible neurological emergency'),
    (['seizure'], 'Neurological emergency'),
    (['loss of consciousness'], 'Critical emergency'),
    (['heart attack'], 'Cardiac emergency'),
    (['blood in stool', 'severe pain'], 'Gastrointestinal emergency'),
    (['sudden vision loss'], 'Ophthalmological emergency'),
]

SYMPTOM_SUGGESTIONS = [
    'Fever', 'Cough', 'Headache', 'Chest Pain', 'Shortness of Breath',
    'Skin Rash', 'Joint Pain', 'Back Pain', 'Nausea', 'Vomiting',
    'Abdominal Pain', 'Dizziness', 'Fatigue', 'Sore Throat', 'Body Ache',
    'Ear Pain', 'Eye Pain', 'Knee Pain', 'Migraine', 'Itching',
    'Bone Pain', 'Weakness', 'Heart Palpitations', 'Acid Reflux', 'Bloating',
    'Nasal Congestion', 'Runny Nose', 'Muscle Pain', 'Swollen Joint', 'Chills',
]


def analyze_symptoms(symptom_text):
    """
    Analyze symptom text and return department, severity, and reason.
    Returns dict with: department, severity, reason, emergency_warning
    """
    symptom_lower = symptom_text.lower()
    
    department_scores = {}
    matched_keywords = {}
    
    for dept, data in SYMPTOM_DEPARTMENT_MAP.items():
        score = 0
        matched = []
        for keyword in data['keywords']:
            if keyword in symptom_lower:
                score += 1
                matched.append(keyword)
        if score > 0:
            department_scores[dept] = score
            matched_keywords[dept] = matched
    
    if not department_scores:
        # Default to General Medicine
        recommended_dept = 'General Medicine'
        reason = 'Your symptoms could not be specifically categorized. General Medicine is recommended for initial consultation.'
        matched_keywords['General Medicine'] = []
    else:
        recommended_dept = max(department_scores, key=department_scores.get)
        matched = matched_keywords[recommended_dept]
        dept_desc = SYMPTOM_DEPARTMENT_MAP[recommended_dept]['description']
        reason = (
            f"Your symptoms ({', '.join(matched[:3])}) are associated with "
            f"{dept_desc}. Therefore, the {recommended_dept} department is recommended."
        )
    
    # Severity detection
    severity = detect_severity(symptom_lower, recommended_dept)
    
    return {
        'department': recommended_dept,
        'severity': severity['level'],
        'reason': reason,
        'emergency_warning': severity['warning'],
        'matched_symptoms': matched_keywords.get(recommended_dept, []),
    }


def detect_severity(symptom_lower, department):
    """Detect severity level based on symptoms."""
    
    # Check high severity combos first
    for combo_keywords, warning in HIGH_SEVERITY_COMBOS:
        matches = sum(1 for kw in combo_keywords if kw in symptom_lower)
        if matches == len(combo_keywords):
            return {
                'level': 'High',
                'warning': f'⚠️ High Risk Symptoms Detected: {warning}. Please consult a doctor immediately.',
            }
    
    # Check department-specific high severity keywords
    if department in SYMPTOM_DEPARTMENT_MAP:
        dept_high = SYMPTOM_DEPARTMENT_MAP[department].get('high_severity_keywords', [])
        for keyword in dept_high:
            if keyword in symptom_lower:
                return {
                    'level': 'High',
                    'warning': '⚠️ High Risk Symptoms Detected. Please consult a doctor immediately.',
                }
    
    # Medium severity indicators
    medium_indicators = [
        'fever', 'weakness', 'persistent', 'recurring', 'severe', 'extreme',
        'vomiting', 'cannot', 'unable', 'difficulty', 'worsening',
    ]
    medium_count = sum(1 for ind in medium_indicators if ind in symptom_lower)
    
    if medium_count >= 2:
        return {
            'level': 'Medium',
            'warning': None,
        }
    
    return {
        'level': 'Low',
        'warning': None,
    }


def get_symptom_suggestions(query):
    """Return symptom suggestions matching query."""
    if not query or len(query) < 2:
        return SYMPTOM_SUGGESTIONS[:8]
    
    query_lower = query.lower()
    matches = [s for s in SYMPTOM_SUGGESTIONS if query_lower in s.lower()]
    return matches[:8]

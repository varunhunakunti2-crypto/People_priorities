import os
import re
import sqlite3
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

# Hardcoded dict of themes and keywords for classification fallback and label matching
themes_keywords = {
    "School Infrastructure": ["school", "classroom", "toilet", "bench", "desk", "playground", "blackboard", "building", "library", "anganwadi", "kitchen", "teachers", "computer", "lab", "pathshala", "vidyalaya", "shauchalay", "chat", "स्कूल", "शिक्षिका", "शिक्षक", "कक्षा", "शौचालय", "डेस्क", "बेंच", "पुस्तकालय", "आंगनवाड़ी", "ब्लैकबोर्ड"],
    "Water Supply": ["water", "drinking", "pump", "handpump", "borewell", "pipeline", "tap", "tank", "leak", "fluoride", "well", "potable", "filtration", "paani", "jal", "nal", "tanki", "kuan", "kuon", "पानी", "नल", "पाइपलाइन", "फ्लोराइड", "बोरवेल", "टंकी", "हैंडपंप", "कुआं"],
    "Road Connectivity": ["road", "pothole", "highway", "bridge", "paved", "streetlight", "bus", "cremation", "drainage", "PMGSY", "mud", "monsoon", "sadak", "rasta", "kichad", "gaddha", "gaddhe", "pul", "naali", "सड़क", "रास्ता", "कीचड़", "गड्ढे", "पुल", "नाली", "लाइट", "खड़ंजा", "शमशान"],
    "Healthcare": ["health", "subcentre", "clinic", "doctor", "nurse", "midwife", "ambulance", "medicine", "vaccination", "treatment", "hospital", "ANM", "PHC", "dawa", "dawaiya", "tika", "tikakaran", "bimari", "doctor", "स्वास्थ्य", "अस्पताल", "इलाज", "डॉक्टर", "नर्स", "दवाई", "दवाइयां", "टीकाकरण", "टीका", "एंबुलेंस", "बीमारी"],
    "Employment/Skills": ["mgnrega", "nrega", "job", "wage", "work", "payment", "skills", "training", "tailoring", "computer", "SHG", "poultry", "dairy", "employment", "migration", "rozgar", "nokri", "kam", "kaam", "pesa", "paisa", "bhatta", "मनरेगा", "रोजगार", "काम", "नौकरी", "मजदूरी", "भुगतान", "प्रशिक्षण", "ट्रेनिंग", "मस्टर"],
    "Electricity": ["electricity", "power", "transformer", "voltage", "streetlight", "bill", "connection", "wire", "poles", "solar", "grid", "light", "bijli", "line", "fluctuation", "meter", "बिजली", "ट्रांसफार्मर", "वोल्टेज", "बिल", "तार", "खंभे", "सोलर", "पावर", "लाइट", "मीटर"],
    "Irrigation": ["irrigation", "canal", "dam", "borewell", "pump", "drip", "pond", "reservoir", "desilting", "groundwater", "harvest", "recharge", "sinchai", "nahar", "khet", "talab", "paani", "fasal", "sookh", "सिंचाई", "नहर", "डेम", "चेक डैम", "फसल", "सूख", "तालाब", "वॉटर", "रिचार्ज", "नलकूप"]
}

# Stopwords for cleaning up TF-IDF keyword extraction
stop_words = [
    'hai', 'ki', 'ko', 'me', 'se', 'ke', 'ka', 'humare', 'gaon', 'ho', 'par', 'itne', 
    'hote', 'sath', 'aur', 'bhi', 'tha', 'thi', 'he', 'ye', 'pe', 'huare', 'bohot', 
    'lekin', 'kar', 'raha', 'rahe', 'sahi', 'sath', 'is', 'the', 'to', 'for', 'of', 
    'in', 'and', 'we', 'our', 'has', 'have', 'are', 'a', 'an', 'at', 'on', 'with', 
    'from', 'by', 'but', 'not', 'ke', 'mein', 'hai', 'ki', 'ko', 'se', 'ka', 'aur', 
    'bhi', 'tha', 'thi', 'hain', 'ho', 'कर', 'रहे', 'रहा', 'लिए', 'पर', 'नहीं', 
    'सकते', 'सकता', 'गया', 'गई', 'वार्ड', 'तरह', 'बहुत', 'कम', 'करके', 'करने', 'लोग'
]

def clean_and_tokenize(text):
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    return words

def get_or_create_theme(conn, label, keywords):
    cursor = conn.cursor()
    cursor.execute("SELECT theme_id FROM themes WHERE theme_label = ?", (label,))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute("INSERT INTO themes (theme_label, keyword_summary) VALUES (?, ?)", (label, keywords))
    conn.commit()
    return cursor.lastrowid

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "peoples_priorities.db")

    if not os.path.exists(db_path):
        print(f"Error: Database file '{db_path}' not found. Run load_database.py first.")
        return

    print("Connecting to database...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Load submissions
    df_subs = pd.read_sql_query("SELECT submission_id, raw_text, village_id FROM submissions", conn)
    if df_subs.empty:
        print("Error: No submissions found in database.")
        conn.close()
        return

    texts = df_subs['raw_text'].tolist()
    print(f"Loaded {len(texts)} submissions.")

    # We will compute fallback keyword mapping results just in case we need to trigger it
    print("Preparing fallback keyword mappings...")
    fallback_mappings = []
    for idx, row in df_subs.iterrows():
        text_words = clean_and_tokenize(row['raw_text'])
        best_theme = "Unclassified"
        max_matches = 0
        
        for theme, keywords in themes_keywords.items():
            matches = sum(1 for word in text_words if word in keywords)
            if matches > max_matches:
                max_matches = matches
                best_theme = theme
                
        confidence = min(1.0, float(max_matches) / 3.0) if max_matches > 0 else 0.0
        fallback_mappings.append((row['submission_id'], best_theme, confidence))

    use_fallback = False
    labels = None
    probabilities = None

    try:
        print("Importing sentence-transformers and embedding texts...")
        from sentence_transformers import SentenceTransformer
        # Load the sentence transformer model
        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        embeddings = model.encode(texts, show_progress_bar=True)

        print("Importing HDBSCAN and clustering...")
        from sklearn.cluster import HDBSCAN
        hdb = HDBSCAN(min_cluster_size=3)
        labels = hdb.fit_predict(embeddings)
        probabilities = hdb.probabilities_

        noise_count = np.sum(labels == -1)
        noise_ratio = noise_count / len(labels)
        print(f"HDBSCAN clustering complete. Noise ratio: {noise_ratio:.1%} ({noise_count}/{len(labels)} submissions)")

        if noise_ratio > 0.30:
            print(f"Warning: Noise ratio ({noise_ratio:.1%}) exceeds 30% threshold.")
            use_fallback = True
    except Exception as e:
        print(f"Warning: Error occurred during embedding/clustering: {e}")
        use_fallback = True

    # Clear existing data in themes and submission_themes to prevent duplicates
    cursor.execute("DELETE FROM submission_themes;")
    cursor.execute("DELETE FROM themes;")
    conn.commit()

    if use_fallback:
        print("\n*** FALLING BACK TO KEYWORD-MATCHING CLASSIFIER ***")
        # 1. Insert predefined themes
        theme_ids = {}
        for theme, keywords in themes_keywords.items():
            kw_summary = ", ".join(keywords[:8])
            theme_ids[theme] = get_or_create_theme(conn, theme, kw_summary)
        
        theme_ids["Unclassified"] = get_or_create_theme(conn, "Unclassified", "Unclassified or noisy items")

        # 2. Insert mappings
        for sub_id, theme, confidence in fallback_mappings:
            theme_id = theme_ids[theme]
            cursor.execute(
                "INSERT INTO submission_themes (submission_id, theme_id, confidence_score) VALUES (?, ?, ?)",
                (sub_id, theme_id, confidence)
            )
        conn.commit()
    else:
        print("\n*** USING HDBSCAN CLUSTERING RESULTS ***")
        # Initialize Tfidf Vectorizer to find distinguishing keywords for each cluster
        vectorizer = TfidfVectorizer(stop_words=stop_words, lowercase=True)
        tfidf_matrix = vectorizer.fit_transform(texts)
        feature_names = np.array(vectorizer.get_feature_names_out())

        unique_labels = [l for l in np.unique(labels) if l != -1]
        
        # 1. Extract themes for each cluster
        cluster_theme_ids = {}
        for c in unique_labels:
            indices = [i for i, label in enumerate(labels) if label == c]
            
            # Mean TF-IDF scores for documents in this cluster
            mean_tfidf = tfidf_matrix[indices].mean(axis=0).A1
            top_5_idx = mean_tfidf.argsort()[::-1][:5]
            top_5_words = feature_names[top_5_idx]
            keyword_summary = ", ".join(top_5_words)

            # Match with predefined themes using top 15 words
            top_15_idx = mean_tfidf.argsort()[::-1][:15]
            top_15_words = feature_names[top_15_idx]
            
            best_theme = "Other"
            best_score = 0
            for theme, keywords in themes_keywords.items():
                score = len(set(top_15_words).intersection(set(keywords)))
                if score > best_score:
                    best_score = score
                    best_theme = theme
            
            if best_theme == "Other":
                best_theme = f"Other ({', '.join(top_5_words[:3])})"
                
            theme_id = get_or_create_theme(conn, best_theme, keyword_summary)
            cluster_theme_ids[c] = theme_id
            print(f"Cluster {c} labeled as: '{best_theme}' with keywords: [{keyword_summary}]")

        # Create Unclassified theme for noise points
        unclassified_theme_id = get_or_create_theme(conn, "Unclassified", "Unclassified noise items")

        # 2. Insert associations into submission_themes
        for i, label in enumerate(labels):
            sub_id = df_subs.loc[i, 'submission_id']
            if label == -1:
                theme_id = unclassified_theme_id
                confidence = 0.0
            else:
                theme_id = cluster_theme_ids[label]
                confidence = float(probabilities[i])

            cursor.execute(
                "INSERT INTO submission_themes (submission_id, theme_id, confidence_score) VALUES (?, ?, ?)",
                (sub_id, theme_id, confidence)
            )
        conn.commit()

    # ==========================================
    # Print Summary Report
    # ==========================================
    print("\n==========================================")
    print("THEMATIC CLUSTERING REPORT")
    print("==========================================")
    
    query = """
    SELECT 
        t.theme_label, 
        COUNT(st.submission_id) as submission_count, 
        COUNT(DISTINCT s.village_id) as villages_affected
    FROM themes t
    JOIN submission_themes st ON t.theme_id = st.theme_id
    JOIN submissions s ON st.submission_id = s.submission_id
    GROUP BY t.theme_id
    ORDER BY submission_count DESC;
    """
    
    df_report = pd.read_sql_query(query, conn)
    print(df_report.to_string(index=False))
    print("==========================================")

    conn.close()
    print("Database update complete and connection closed.")

if __name__ == "__main__":
    main()

import os
import sqlite3
import pandas as pd
import numpy as np

def get_work_theme(work_type):
    wt = work_type.lower()
    if "road" in wt:
        return "Road Connectivity"
    if "borewell" in wt or "water" in wt:
        return "Water Supply"
    if "school" in wt or "anganwadi" in wt:
        return "School Infrastructure"
    if "streetlight" in wt or "electricity" in wt or "power" in wt:
        return "Electricity"
    if "dam" in wt or "pond" in wt or "irrigation" in wt:
        return "Irrigation"
    if "health" in wt or "subcentre" in wt or "clinic" in wt:
        return "Healthcare"
    if "community hall" in wt or "training" in wt:
        return "Employment/Skills"
    return "Unclassified"

def calculate_rankings(weights: dict = None):
    # Set default weights if none provided
    if weights is None:
        weights = {}
    
    w_demand = weights.get("demand", 0.35)
    w_need = weights.get("need", 0.35)
    w_neglect = weights.get("neglect", 0.20)
    w_feasibility = weights.get("feasibility", 0.10)

    # Normalize weights to sum to 1.0 just in case
    total_w = w_demand + w_need + w_neglect + w_feasibility
    if total_w > 0:
        w_demand /= total_w
        w_need /= total_w
        w_neglect /= total_w
        w_feasibility /= total_w

    # Determine database path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "data", "peoples_priorities.db")

    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at '{db_path}'. Make sure you run seed/load scripts first.")

    conn = sqlite3.connect(db_path)
    
    # 1. Load raw data tables into DataFrames
    df_villages = pd.read_sql_query("SELECT * FROM villages", conn)
    df_schools = pd.read_sql_query("SELECT * FROM schools", conn)
    df_works = pd.read_sql_query("SELECT * FROM existing_works", conn)
    df_subs = pd.read_sql_query("SELECT * FROM submissions", conn)
    df_sub_themes = pd.read_sql_query("SELECT * FROM submission_themes", conn)
    df_themes = pd.read_sql_query("SELECT * FROM themes", conn)

    # Pre-map existing works to themes
    df_works['mapped_theme'] = df_works['work_type'].apply(get_work_theme)

    # Join submissions with their themes
    df_subs_joined = df_subs.merge(df_sub_themes, on='submission_id').merge(df_themes, on='theme_id')

    # Get submission counts per (village_id, theme_id)
    df_counts = df_subs_joined.groupby(['village_id', 'theme_id', 'theme_label']).size().reset_index(name='submission_count')

    if df_counts.empty:
        conn.close()
        return []

    # Max count for normalization
    max_count = df_counts['submission_count'].max()

    # Pre-calculate average cost per theme from existing works
    theme_avg_costs = df_works.groupby('mapped_theme')['amount_lakh_inr'].mean().to_dict()
    # Default fallback cost if a theme has no existing works
    default_cost = 10.0 

    # Prepare maps for quick lookups
    villages_map = df_villages.set_index('village_id').to_dict(orient='index')
    
    # Pre-aggregate school statistics per village
    schools_grouped = df_schools.groupby('village_id').agg(
        avg_ratio=('enrollment_capacity_ratio', 'mean'),
        avg_ptr=('pupil_teacher_ratio', 'mean'),
        avg_toilets=('functional_toilets', 'mean')
    ).to_dict(orient='index')

    results = []

    # We first calculate raw values for all pairs to compute global ranges for feasibility
    raw_pairs = []
    for _, row in df_counts.iterrows():
        v_id = row['village_id']
        t_id = row['theme_id']
        t_label = row['theme_label']
        sub_count = row['submission_count']

        # Get cost for feasibility normalization
        cost = theme_avg_costs.get(t_label, default_cost)
        raw_pairs.append({
            'village_id': v_id,
            'theme_id': t_id,
            'theme_label': t_label,
            'submission_count': sub_count,
            'cost': cost
        })

    df_raw_pairs = pd.DataFrame(raw_pairs)
    c_min = df_raw_pairs['cost'].min()
    c_max = df_raw_pairs['cost'].max()

    # Process each pair
    for _, row in df_counts.iterrows():
        v_id = row['village_id']
        t_id = row['theme_id']
        t_label = row['theme_label']
        sub_count = row['submission_count']

        village = villages_map[v_id]
        v_name = village['village_name']

        # -----------------------------------------------------------------
        # A. Demand Score: Normalized submission count (0 - 100)
        # -----------------------------------------------------------------
        demand_score = round((sub_count / max_count) * 100.0, 1) if max_count > 0 else 0.0

        # -----------------------------------------------------------------
        # B. Need Score: Theme-specific metrics (0 - 100)
        # -----------------------------------------------------------------
        school_stats = schools_grouped.get(v_id, {'avg_ratio': 1.0, 'avg_ptr': 30.0, 'avg_toilets': 2.0})
        avg_ratio = school_stats['avg_ratio']
        dist = village['distance_to_town_km']
        pop = village['population']
        
        # Max bounds in dataset for normalizations
        max_dist = 45.0
        max_pop = 4500.0

        if t_label == "School Infrastructure":
            ratio_score = min(100.0, max(0.0, avg_ratio - 1.0) * 100.0)
            absence_score = 100.0 if village['has_secondary_school'] == 'No' else 0.0
            dist_score = min(100.0, (dist / max_dist) * 100.0)
            need_score = 0.40 * ratio_score + 0.30 * absence_score + 0.30 * dist_score

        elif t_label == "Water Supply":
            absence_score = 100.0 if village['has_tap_water'] == 'No' else 0.0
            dist_score = min(100.0, (dist / max_dist) * 100.0)
            pop_score = min(100.0, (pop / max_pop) * 100.0)
            need_score = 0.50 * absence_score + 0.25 * dist_score + 0.25 * pop_score

        elif t_label == "Road Connectivity":
            absence_score = 100.0 if village['has_paved_road'] == 'No' else 0.0
            dist_score = min(100.0, (dist / max_dist) * 100.0)
            pop_score = min(100.0, (pop / max_pop) * 100.0)
            need_score = 0.50 * absence_score + 0.30 * dist_score + 0.20 * pop_score

        elif t_label == "Healthcare":
            absence_score = 100.0 if village['has_health_subcentre'] == 'No' else 0.0
            dist_score = min(100.0, (dist / max_dist) * 100.0)
            pop_score = min(100.0, (pop / max_pop) * 100.0)
            need_score = 0.40 * absence_score + 0.40 * dist_score + 0.20 * pop_score

        elif t_label == "Employment/Skills":
            lit_score = 100.0 - village['literacy_rate_pct']
            sc_st_score = village['sc_st_pct']
            pop_score = min(100.0, (pop / max_pop) * 100.0)
            need_score = 0.40 * lit_score + 0.40 * sc_st_score + 0.20 * pop_score

        elif t_label == "Electricity":
            dist_score = min(100.0, (dist / max_dist) * 100.0)
            lit_score = 100.0 - village['literacy_rate_pct']
            need_score = 0.60 * dist_score + 0.40 * lit_score

        elif t_label == "Irrigation":
            dist_score = min(100.0, (dist / max_dist) * 100.0)
            absence_water_score = 100.0 if village['has_tap_water'] == 'No' else 0.0
            sc_st_score = village['sc_st_pct']
            need_score = 0.40 * dist_score + 0.30 * absence_water_score + 0.30 * sc_st_score

        else: # Default for Unclassified/Other
            need_score = 50.0

        need_score = round(float(need_score), 1)

        # -----------------------------------------------------------------
        # C. Neglect Score: Based on existing works mapped to theme (0 - 100)
        # -----------------------------------------------------------------
        village_theme_works = df_works[(df_works['village_id'] == v_id) & (df_works['mapped_theme'] == t_label)]
        
        if village_theme_works.empty:
            neglect_score = 100.0
        else:
            work_scores = []
            for _, work in village_theme_works.iterrows():
                status = work['status']
                year = int(work['year'])
                
                if status in ["In Progress", "Sanctioned-Not-Started"]:
                    score = 50.0
                elif status == "Completed" and year >= 2024:
                    score = 10.0
                elif status == "Completed" and year < 2024:
                    score = 40.0
                elif status == "Proposed":
                    score = 80.0
                else:
                    score = 100.0
                work_scores.append(score)
            
            neglect_score = min(work_scores)
            
        neglect_score = round(float(neglect_score), 1)

        # -----------------------------------------------------------------
        # D. Feasibility Score: Based on average theme cost (0 - 100)
        # -----------------------------------------------------------------
        cost = theme_avg_costs.get(t_label, default_cost)
        if c_max > c_min:
            norm_cost = ((cost - c_min) / (c_max - c_min)) * 100.0
        else:
            norm_cost = 50.0
            
        feasibility_score = round(100.0 - norm_cost, 1)

        # -----------------------------------------------------------------
        # E. Priority Score Combination
        # -----------------------------------------------------------------
        priority_score = (
            w_demand * demand_score +
            w_need * need_score +
            w_neglect * neglect_score +
            w_feasibility * feasibility_score
        )
        priority_score = round(float(priority_score), 2)

        # -----------------------------------------------------------------
        # F. Sample Complaints (up to 3)
        # -----------------------------------------------------------------
        pair_subs = df_subs_joined[
            (df_subs_joined['village_id'] == v_id) & 
            (df_subs_joined['theme_id'] == t_id)
        ]
        
        # Pull up to 3 random samples
        samples = pair_subs['raw_text'].tolist()
        # Seed for reproducibility if needed, or simple sampling
        sample_complaints = samples[:3]

        results.append({
            "village_id": v_id,
            "village_name": v_name,
            "theme_id": int(t_id),
            "theme_label": t_label,
            "demand_score": demand_score,
            "need_score": need_score,
            "neglect_score": neglect_score,
            "feasibility_score": feasibility_score,
            "priority_score": priority_score,
            "submission_count": int(sub_count),
            "sample_complaints": sample_complaints
        })

    conn.close()

    # Sort by priority_score descending
    results = sorted(results, key=lambda x: x['priority_score'], reverse=True)
    return results

if __name__ == "__main__":
    # Test execution
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    try:
        rankings = calculate_rankings()
        print(f"Successfully calculated rankings for {len(rankings)} pairs.")
        if rankings:
            print("\nTop 3 Priorities:")
            for i, item in enumerate(rankings[:3]):
                print(f"\n{i+1}. Village: {item['village_name']} | Theme: {item['theme_label']}")
                print(f"   Priority Score: {item['priority_score']} (Demand: {item['demand_score']}, Need: {item['need_score']}, Neglect: {item['neglect_score']}, Feasibility: {item['feasibility_score']})")
                print(f"   Submissions: {item['submission_count']} | Samples:")
                for s in item['sample_complaints']:
                    print(f"     - {s}")
    except Exception as e:
        print(f"Error testing calculate_rankings: {e}")

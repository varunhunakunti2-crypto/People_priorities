import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def main():
    # Set fixed random seeds for reproducibility
    np.random.seed(42)
    random.seed(42)

    # Base path of peoples-priorities-ai project
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    print(f"Generating seed data in: {data_dir}")

    # ==========================================
    # 1. VILLAGES DATASET (20 rows)
    # ==========================================
    village_names = [
        "Bishnupur", "Rampur", "Kalyanpur", "Piparia", "Gopalpur",
        "Haripur", "Sultanpur", "Chandpur", "Madhupur", "Jagdishpur",
        "Belgaon", "Sonpur", "Karamtoli", "Bhaktiarpur", "Rajpur",
        "Fatehpur", "Daulatpur", "Govindpur", "Pratapgarh", "Ramgarh"
    ]
    subdistricts = ["Chandanpur", "Rampur-East", "Sundarnagar"]
    
    villages = []
    for i, name in enumerate(village_names):
        v_id = f"VIL{i+1:03d}"
        sub = random.choice(subdistricts)
        pop = int(np.random.randint(450, 4500))
        lit_rate = round(float(np.random.uniform(42.5, 87.0)), 1)
        sc_st = round(float(np.random.uniform(5.0, 78.0)), 1)
        dist = round(float(np.random.uniform(0.8, 45.0)), 1)
        
        # Probabilities dependent on population and distance
        has_primary = "Yes" if random.random() < 0.9 else "No"
        has_secondary = "Yes" if (has_primary == "Yes" and pop > 1200 and random.random() < 0.7) else "No"
        has_health = "Yes" if (pop > 1500 and dist > 10.0 and random.random() < 0.6) else "No"
        has_tap = "Yes" if random.random() < 0.55 else "No"
        has_paved = "Yes" if dist < 15.0 or random.random() < 0.7 else "No"
        
        villages.append({
            "village_id": v_id,
            "village_name": name,
            "subdistrict": sub,
            "population": pop,
            "literacy_rate_pct": lit_rate,
            "sc_st_pct": sc_st,
            "distance_to_town_km": dist,
            "has_primary_school": has_primary,
            "has_secondary_school": has_secondary,
            "has_health_subcentre": has_health,
            "has_tap_water": has_tap,
            "has_paved_road": has_paved
        })

    df_villages = pd.DataFrame(villages)
    df_villages.to_csv(os.path.join(data_dir, "villages.csv"), index=False)
    print("Created villages.csv")

    # ==========================================
    # 2. SCHOOLS DATASET (45 rows)
    # ==========================================
    # UDISE+ style codes: 11-digit codes starting with state code (e.g. 27 for Maharashtra)
    udise_prefix = "2724010"
    categories = ["Primary", "Upper Primary", "Secondary", "Higher Secondary"]
    category_weights = [0.5, 0.25, 0.15, 0.1]
    
    schools = []
    for i in range(45):
        udise_code = f"{udise_prefix}{i+1:04d}"
        v_id = f"VIL{random.randint(1, 20):03d}"
        cat = np.random.choice(categories, p=category_weights)
        
        if cat == "Primary":
            enroll = int(np.random.randint(20, 110))
            cap = int(enroll * np.random.uniform(0.85, 1.4))
            ptr = int(np.random.randint(20, 45))
        elif cat == "Upper Primary":
            enroll = int(np.random.randint(40, 170))
            cap = int(enroll * np.random.uniform(0.9, 1.3))
            ptr = int(np.random.randint(20, 40))
        elif cat == "Secondary":
            enroll = int(np.random.randint(60, 240))
            cap = int(enroll * np.random.uniform(0.95, 1.25))
            ptr = int(np.random.randint(15, 35))
        else: # Higher Secondary
            enroll = int(np.random.randint(90, 380))
            cap = int(enroll * np.random.uniform(0.95, 1.2))
            ptr = int(np.random.randint(15, 30))
            
        ratio = round(enroll / max(1, cap), 2)
        toilets = int(np.random.choice([0, 1, 2, 3, 4, 6], p=[0.1, 0.2, 0.3, 0.2, 0.15, 0.05]))
        
        schools.append({
            "udise_code": udise_code,
            "village_id": v_id,
            "school_category": cat,
            "total_enrollment": enroll,
            "building_capacity": cap,
            "enrollment_capacity_ratio": ratio,
            "pupil_teacher_ratio": ptr,
            "functional_toilets": toilets
        })

    df_schools = pd.DataFrame(schools)
    df_schools.to_csv(os.path.join(data_dir, "schools.csv"), index=False)
    print("Created schools.csv")

    # ==========================================
    # 3. EXISTING WORKS DATASET (35 rows)
    # ==========================================
    work_types = [
        "Road Paving", "Borewell Installation", "Water Pipeline Extension", 
        "School Toilet Block construction", "Streetlight Installation", 
        "Check Dam Repair", "Health Subcentre Renovation", "Pond Desilting",
        "Community Hall building", "Anganwadi Center Repair"
    ]
    sources = ["GPDP", "MPLADS"]
    statuses = ["Completed", "In Progress", "Sanctioned-Not-Started", "Proposed"]
    status_weights = [0.4, 0.3, 0.2, 0.1]
    years = [2023, 2024, 2025, 2026]
    
    works = []
    for i in range(35):
        w_id = f"WRK{i+1:03d}"
        v_id = f"VIL{random.randint(1, 20):03d}"
        src = random.choice(sources)
        wt = random.choice(work_types)
        
        # Decide amount based on project type
        if "construction" in wt.lower() or "building" in wt.lower() or "dam" in wt.lower() or "road" in wt.lower():
            amt = round(float(np.random.uniform(5.5, 28.0)), 2)
        else:
            amt = round(float(np.random.uniform(0.8, 6.0)), 2)
            
        status = np.random.choice(statuses, p=status_weights)
        year = random.choice(years)
        
        works.append({
            "work_id": w_id,
            "village_id": v_id,
            "source": src,
            "work_type": wt,
            "amount_lakh_inr": amt,
            "status": status,
            "year": year
        })

    df_works = pd.DataFrame(works)
    df_works.to_csv(os.path.join(data_dir, "existing_works.csv"), index=False)
    print("Created existing_works.csv")

    # ==========================================
    # 4. SUBMISSIONS DATASET (85 rows)
    # ==========================================
    # 85 complaints spanning Hindi (Devanagari), Hinglish, and English
    complaints_data = [
        # School Infrastructure (13 complaints)
        ("The government primary school building has developed large cracks. It is unsafe for our children.", "school infrastructure", "English"),
        ("हमारे गांव के सरकारी मिडिल स्कूल की छत बारिश में बहुत टपकती है, बच्चे पढ़ नहीं पाते।", "school infrastructure", "Hindi"),
        ("Humare high school me ladkiyo ke liye koi saaf bathroom nahi hai. Iski wajah se bohot dikkat hoti hai.", "school infrastructure", "Hinglish"),
        ("Primary school boundary wall is broken. Cow and goats enter the school yard during classes.", "school infrastructure", "English"),
        ("स्कूल में पीने के पानी की टंकी पिछले 6 महीने से टूटी पड़ी है। बच्चों को घर से पानी लाना पड़ता है।", "school infrastructure", "Hindi"),
        ("School me bench aur desk ki bohot kami hai, bache zameen par baith kar padhai karte hain.", "school infrastructure", "Hinglish"),
        ("We need a computer lab or at least a few computers in our secondary school for students.", "school infrastructure", "English"),
        ("सरकारी स्कूल में ब्लैकबोर्ड बहुत पुराना और खराब हो चुका है। कुछ भी साफ दिखाई नहीं देता।", "school infrastructure", "Hindi"),
        ("Humare anganwadi kendra ki halat kharab hai, chat ka plaster gir raha hai.", "school infrastructure", "Hinglish"),
        ("No proper electricity or fans in the school. During summer it gets extremely hot inside.", "school infrastructure", "English"),
        ("उच्च माध्यमिक विद्यालय में खेल का मैदान झाड़ियों से भरा है, बच्चे खेल नहीं सकते।", "school infrastructure", "Hindi"),
        ("Primary school ke kitchen shed ki deewar toot rahi hai, mid day meal banana unsafe hai.", "school infrastructure", "Hinglish"),
        ("Our village school library does not have enough books for students to read.", "school infrastructure", "English"),

        # Water Supply (12 complaints)
        ("The public hand pump near the main temple is broken for three weeks. Please repair.", "water supply", "English"),
        ("गांव में नल-जल योजना के पाइप बिछाए गए थे, पर आज तक नल में पानी नहीं आया।", "water supply", "Hindi"),
        ("Pani ki supply roz subah sirf 15-20 minute ke liye aati hai, wo bhi bohot ganda pani hota hai.", "water supply", "Hinglish"),
        ("Groundwater has gone down and the community borewell has dried up. We need a new deep borewell.", "water supply", "English"),
        ("दलित बस्ती के कुएं में पानी बहुत कम बचा है और वहां कोई नल कनेक्शन नहीं है। कृपया ध्यान दें।", "water supply", "Hindi"),
        ("Gaon ki tanki se pani leak ho raha hai, sadak par jal-jamao ho jata hai par pani gharo me nahi milta.", "water supply", "Hinglish"),
        ("High fluoride levels in our village well water are causing joint problems. We need a filtration unit.", "water supply", "English"),
        ("पीने के पानी में बहुत बदबू आ रही है, गांव के कई बच्चे दस्त और पेट दर्द से बीमार हो गए हैं।", "water supply", "Hindi"),
        ("Main water pipeline rasta banane ke time toot gayi thi, abhi tak repair nahi ki gayi.", "water supply", "Hinglish"),
        ("We request the administration to install three new public taps near the weekly market ground.", "water supply", "English"),
        ("वार्ड नंबर 4 में पानी की कोई व्यवस्था नहीं है, महिलाओं को 2 किलोमीटर दूर से पानी लाना पड़ता है।", "water supply", "Hindi"),
        ("Bleaching powder aur chlorine tablets pani ke kuon me daalne ke liye nahi bheji ja rahi hain.", "water supply", "Hinglish"),

        # Road Connectivity (12 complaints)
        ("The road connecting our village to the block headquarter is full of deep potholes.", "road connectivity", "English"),
        ("बरसात में गांव का रास्ता पूरा कीचड़ बन जाता है, एम्बुलेंस भी गांव के अंदर नहीं आ पाती।", "road connectivity", "Hindi"),
        ("Gaon ki main road banaye hue sirf 6 mahine hue the par abhi se tar-coal ukhar gaya hai.", "road connectivity", "Hinglish"),
        ("We need a small concrete bridge over the local stream. During heavy rains, we get cut off.", "road connectivity", "English"),
        ("गांव की गलियों में खड़ंजा (paved path) नहीं होने से बुजुर्गों को चलने में बड़ी परेशानी होती है।", "road connectivity", "Hindi"),
        ("Gaon me enters hone wali road par street lights nahi hain, raat ko andhere me accidents hote hain.", "road connectivity", "Hinglish"),
        ("The public bus service has stopped visiting our village due to the damaged condition of the link road.", "road connectivity", "English"),
        ("शमशान घाट तक जाने वाला रास्ता कच्चा है, बारिश के मौसम में वहां जाना बहुत मुश्किल हो जाता है।", "road connectivity", "Hindi"),
        ("Drainage system block hone se naali ka pani sadak par beh raha hai. Bohot badbu aati hai.", "road connectivity", "Hinglish"),
        ("Speed breakers are urgently required near the village primary school to avoid speeding trucks.", "road connectivity", "English"),
        ("स्वास्थ्य उपकेंद्र जाने वाला रास्ता बहुत उबड़-खाबड़ है, गर्भवती महिलाओं को ले जाने में डर लगता है।", "road connectivity", "Hindi"),
        ("Heavy rain wash away the side gravels of PMGSY road, it is becoming narrow and dangerous.", "road connectivity", "English"),

        # Healthcare (12 complaints)
        ("The primary health subcentre is locked most of the time. The ANM nurse rarely visits.", "healthcare", "English"),
        ("हमारे उप स्वास्थ्य केंद्र में बुखार और सामान्य दर्द की दवाइयां भी उपलब्ध नहीं हैं।", "healthcare", "Hindi"),
        ("Gaon me koi delivery room ya midwife nahi hai. Emergency me sheher jana padta hai jo 25km door hai.", "healthcare", "Hinglish"),
        ("There is no doctor available during weekends. For emergencies we have to run to private clinics.", "healthcare", "English"),
        ("स्वास्थ्य केंद्र की इमारत जर्जर हो चुकी है। वहां न तो बिजली है और न ही शौचालय की व्यवस्था।", "healthcare", "Hindi"),
        ("Gaon ke bacho ke liye regular vaccination camps (tika karan) nahi lagaye ja rahe hain.", "healthcare", "Hinglish"),
        ("The staff at the community health center asks for money even for free government medicines.", "healthcare", "English"),
        ("गांव में मलेरिया और डेंगू के मामले बढ़ रहे हैं, लेकिन स्वास्थ्य विभाग ने कोई फॉगिंग नहीं कराई।", "healthcare", "Hindi"),
        ("PHC me basic blood test ya malaria test ke liye bhi facility nahi hai, lab technician nahi aata.", "healthcare", "Hinglish"),
        ("We need an ambulance or medical vehicle stationed at our cluster level for immediate emergencies.", "healthcare", "English"),
        ("उप-केंद्र के आसपास बहुत गंदगी फैली रहती है, जिससे वहां संक्रमण फैलने का खतरा बना रहता है।", "healthcare", "Hindi"),
        ("Anti-venom injection is not available in the local government clinic for snake bites.", "healthcare", "Hinglish"),

        # Employment/Skills (12 complaints)
        ("No MGNREGA work has been started in our panchayat for the last three months. We need work.", "employment/skills", "English"),
        ("मनरेगा के तहत किए गए काम का भुगतान पिछले 4 महीनों से लंबित है। कृपया हमारी मजदूरी दिलाएं।", "employment/skills", "Hindi"),
        ("Gaon ke ladke-ladkiyon ke liye computer training ya computer center shuru kiya jana chahiye.", "employment/skills", "Hinglish"),
        ("Requesting a skill development center for youth in mobile repairing, electrician, and tailoring.", "employment/skills", "English"),
        ("नया जॉब कार्ड बनवाने के लिए ग्राम रोजगार सहायक पैसे मांगते हैं, गरीब लोग कहां जाएं?", "employment/skills", "Hindi"),
        ("Mahila self help groups (SHGs) ko stitching aur pickle making ke training ki zaroorat hai.", "employment/skills", "Hinglish"),
        ("Local youth are migrating to distant cities because there are zero employment opportunities here.", "employment/skills", "English"),
        ("जैविक खेती और नई कृषि तकनीकों के बारे में प्रशिक्षण शिविर का आयोजन किया जाना चाहिए।", "employment/skills", "Hindi"),
        ("Dairy farming aur poultry industry set up karne ke liye subsidy aur guidance ki request hai.", "employment/skills", "Hinglish"),
        ("No vocational course options are available in our block after 10th or 12th standard.", "employment/skills", "English"),
        ("मनरेगा के मस्टर रोल में गड़बड़ी की जा रही है, जो लोग काम नहीं कर रहे उनके नाम भी डाले जा रहे हैं।", "employment/skills", "Hindi"),
        ("Need support for processing units of local crops like mango, cashew so youth get local jobs.", "employment/skills", "Hinglish"),

        # Electricity (12 complaints)
        ("Power cuts last for 14-16 hours daily. Students are unable to study during exam times.", "electricity", "English"),
        ("हमारे मोहल्ले का बिजली ट्रांसफार्मर जल गया है। पूरा वार्ड 10 दिनों से अंधेरे में है।", "electricity", "Hindi"),
        ("Voltage fluctuation itna jyada hota hai ki ghar ke bulb jal jate hain aur motor nahi chalti.", "electricity", "Hinglish"),
        ("High tension wires are hanging too low over the main street. It is very dangerous.", "electricity", "English"),
        ("गांव के प्रमुख चौराहों पर स्ट्रीट लाइट की जरूरत है ताकि रात में महिलाएं सुरक्षित महसूस करें।", "electricity", "Hindi"),
        ("Bina meter reading liye hi har mahine bohot bada electricity bill bhej diya jata hai.", "electricity", "Hinglish"),
        ("Many households in the outer colony are still waiting for domestic electricity connections.", "electricity", "English"),
        ("बिजली विभाग का कोई भी लाइनमैन शिकायत करने के बाद भी तार ठीक करने नहीं आता है।", "electricity", "Hindi"),
        ("Requesting solar street lights for our village path because grid power is highly unreliable.", "electricity", "Hinglish"),
        ("The old wooden poles supporting the power lines are rotting and could collapse at any time.", "electricity", "English"),
        ("कृषि फीडर में केवल रात को 2 घंटे बिजली मिलती है, जिससे रात में सिंचाई करना कठिन होता है।", "electricity", "Hindi"),
        ("Gaon ki solar microgrid scheme kharab battery ki wajah se 1 saal se band padi hai.", "electricity", "Hinglish"),

        # Irrigation (12 complaints)
        ("The irrigation canal is damaged and water does not reach the fields located at the tail end.", "irrigation", "English"),
        ("खेतों में पानी के संरक्षण के लिए एक छोटे चेक डैम का निर्माण बहुत जरूरी है।", "irrigation", "Hindi"),
        ("Sarkari tubewell ki motor kharab ho gayi hai, khet sookh rahe hain, please jaldi thik karein.", "irrigation", "Hinglish"),
        ("We need subsidies and access to drip irrigation kits for low-water cultivation.", "irrigation", "English"),
        ("नहर में गाद (silt) जमा होने के कारण पानी का प्रवाह रुक गया है, नहर की सफाई कराई जाए।", "irrigation", "Hindi"),
        ("Panchayat ki lift irrigation scheme electric connection na hone ki wajah se bekar padi hai.", "irrigation", "Hinglish"),
        ("We request financial assistance for digging farm ponds (khet talab) to store rainwater.", "irrigation", "English"),
        ("भूजल स्तर (groundwater level) बहुत नीचे चला गया है, वॉटर रिचार्जिंग स्ट्रक्चर की जरूरत है।", "irrigation", "Hindi"),
        ("Nahar ke sluice gate jam hain, paani release karne me kafi dikkat aati hai.", "irrigation", "Hinglish"),
        ("The canal banks have breached in multiple places, flooding nearby farms while others dry up.", "irrigation", "English"),
        ("सिंचाई विभाग के अधिकारी नहर में पानी छोड़ने का कोई निश्चित समय नहीं बताते हैं।", "irrigation", "Hindi"),
        ("Solar water pump sets scheme ke subsidy approvals block level par fansi hui hain.", "irrigation", "Hinglish"),
    ]

    # Let's add 2 additional complaints to make it exactly 85
    complaints_data.extend([
        ("Primary school middle section needs a laboratory for basic science practicals.", "school infrastructure", "English"),
        ("हमारे गांव के सार्वजनिक कुएं की सफाई पिछले दो सालों से नहीं हुई है, पानी पीने योग्य नहीं है।", "water supply", "Hindi")
    ])

    channels = ["web_form", "whatsapp", "sms", "grievance_portal", "public_meeting"]
    channel_weights = [0.15, 0.4, 0.1, 0.2, 0.15]
    
    statuses = ["Open", "In Progress", "Resolved"]
    status_weights = [0.5, 0.3, 0.2]
    
    # Generate dates over the last 1.5 years
    end_date = datetime(2026, 6, 30)
    start_date = end_date - timedelta(days=540)
    
    submissions = []
    for i, (text, theme, lang) in enumerate(complaints_data):
        sub_id = f"SUB{i+1:03d}"
        v_id = f"VIL{random.randint(1, 20):03d}"
        ch = np.random.choice(channels, p=channel_weights)
        st = np.random.choice(statuses, p=status_weights)
        
        # Random date generation
        random_days = random.randint(0, 540)
        sub_date = start_date + timedelta(days=random_days)
        sub_date_str = sub_date.strftime("%Y-%m-%d %H:%M:%S")
        
        submissions.append({
            "submission_id": sub_id,
            "village_id": v_id,
            "raw_text": text,
            "channel": ch,
            "language_detected": lang,
            "submitted_on": sub_date_str,
            "status": st
        })

    df_subs = pd.DataFrame(submissions)
    df_subs.to_csv(os.path.join(data_dir, "submissions.csv"), index=False)
    print("Created submissions.csv")
    print(f"Total submissions generated: {len(df_subs)}")

    print("\nAll seed CSVs generated successfully.")

if __name__ == "__main__":
    main()

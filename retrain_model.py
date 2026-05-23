import os
import torch
import shutil
from datetime import datetime

import os
import torch
import shutil
import json
from datetime import datetime
import psycopg2 # For DB integration

# --- DB CONNECTION (Reusing existing config) ---
def get_db_connection():
    # In production, use environment variables
    return psycopg2.connect("dbname=postgres user=postgres password=postgres host=localhost")

def evaluate_model(model_path):
    # Simulated evaluation on test set
    # In production, this runs actual inference on test images
    import random
    return random.uniform(0.85, 0.98) 

def evolve_model(new_data_path, base_model_path="ink_model_v2.pt"):
    print(f"🔄 Starting Safe Model Evolution at {datetime.now()}")
    
    if not os.path.exists(new_data_path) or len(os.listdir(new_data_path)) == 0:
        print("No new retraining data found. Skipping.")
        return

    # 1. EVALUATE CURRENT BEST
    current_acc = 0.92 # Default fallback
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT accuracy FROM model_registry WHERE is_active = true")
    row = cur.fetchone()
    if row: current_acc = row[0]

    # 2. TRAIN & EVALUATE CANDIDATE
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    version = f"v_{timestamp}"
    candidate_path = f"models/ink_model_{version}.pt"
    os.makedirs("models", exist_ok=True)
    
    shutil.copy2(base_model_path, candidate_path) # Simulate training
    candidate_acc = evaluate_model(candidate_path)

    print(f"Current Model Accuracy: {current_acc:.4f}")
    print(f"Candidate Model Accuracy: {candidate_acc:.4f}")

    # 3. SAFE DEPLOYMENT DECISION
    if candidate_acc > current_acc:
        print("🚀 Improvement detected! Promoting candidate to ACTIVE.")
        
        # Update DB Registry
        cur.execute("UPDATE model_registry SET is_active = false, status = 'archived' WHERE is_active = true")
        cur.execute("INSERT INTO model_registry (version, status, accuracy, is_active) VALUES (%s, %s, %s, %s)",
                    (version, 'active', candidate_acc, True))
        
        # Update Config
        with open("config.json", "r+") as f:
            conf = json.load(f)
            conf["active_model_version"] = version
            f.seek(0)
            json.dump(conf, f, indent=4)
            f.truncate()
        
        print(f"✅ Model promoted: {version}")
    else:
        print("❌ Candidate failed to outperform current model. Rejecting deployment.")
        cur.execute("INSERT INTO model_registry (version, status, accuracy, is_active) VALUES (%s, %s, %s, %s)",
                    (version, 'candidate', candidate_acc, False))

    conn.commit()
    cur.close()
    conn.close()

    # Archive images
    archive_dir = f"dataset/archive/{timestamp}"
    os.makedirs(archive_dir, recursive=True)
    for f in os.listdir(new_data_path):
        shutil.move(os.path.join(new_data_path, f), os.path.join(archive_dir, f))

if __name__ == "__main__":
    RETRAIN_DATA = "dataset/retraining"
    evolve_model(RETRAIN_DATA)

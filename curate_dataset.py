import os
import shutil
import cv2
import numpy as np
from PIL import Image, ImageStat
import imagehash

# Config
RETRAIN_DIR = "dataset/retraining"
CLEAN_DIR = "dataset/curated"
LUMINANCE_THRESHOLD = 35
BLUR_THRESHOLD = 100 # Laplacian variance

def is_blurry(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var() < BLUR_THRESHOLD

def get_luminance(image_path):
    img = Image.open(image_path).convert('L')
    stat = ImageStat.Stat(img)
    return stat.mean[0]

def curate():
    print("🧹 Starting Dataset Curation...")
    if not os.path.exists(CLEAN_DIR): os.makedirs(CLEAN_DIR)
    
    seen_hashes = {}
    curated_count = 0
    
    for filename in os.listdir(RETRAIN_DIR):
        if not filename.endswith(".jpg"): continue
        
        path = os.path.join(RETRAIN_DIR, filename)
        
        try:
            # 1. Quality Filters
            if get_luminance(path) < LUMINANCE_THRESHOLD: continue
            if is_blurry(path): continue
            
            # 2. De-duplication
            with Image.open(path) as img:
                phash = str(imagehash.phash(img))
                if phash in seen_hashes: continue
                seen_hashes[phash] = True
            
            # 3. Acceptance
            shutil.copy2(path, os.path.join(CLEAN_DIR, filename))
            curated_count += 1
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"✅ Curation complete. {curated_count} samples added to curated set.")

if __name__ == "__main__":
    curate()

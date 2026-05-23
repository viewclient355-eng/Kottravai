import torch
import pandas as pd
import numpy as np
from PIL import Image, ImageOps
from torchvision import transforms, models
import json
from sklearn.metrics import precision_recall_curve, f1_score

def calibrate():
    print("🚀 Starting Threshold Calibration...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # 1. Load Model
    model = torch.jit.load("ink_model_v2.pt", map_location=device)
    model.eval()

    # 2. Validation Transforms
    val_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 3. Load Validation Data
    df = pd.read_csv("dataset/metadata.csv")
    val_df = df[df['image_path'].str.contains('val')]
    
    scores = []
    labels = []

    print(f"Analyzing {len(val_df)} validation images...")
    with torch.no_grad():
        for _, row in val_df.iterrows():
            img_path = row['image_path']
            label = int(row['label'])
            
            image = Image.open(img_path).convert("RGB")
            image = ImageOps.autocontrast(image)
            tensor = val_transforms(image).unsqueeze(0).to(device)
            
            output = model(tensor)
            scores.append(output.item())
            labels.append(label)

    scores = np.array(scores)
    labels = np.array(labels)

    # 4. Find Optimal Thresholds
    # Goal: Maximize F1-score
    precision, recall, thresholds = precision_recall_curve(labels, scores)
    f1 = 2 * (precision * recall) / (precision + recall + 1e-8)
    best_idx = np.argmax(f1)
    center_threshold = thresholds[best_idx]

    # Buffer for uncertainty (e.g., +/- 10% of precision range)
    # We want a high threshold for "inked" and low for "not_inked"
    high_threshold = float(np.percentile(scores[labels == 1], 15)) # 85th percentile of inked
    low_threshold = float(np.percentile(scores[labels == 0], 85))  # 15th percentile of not_inked
    
    # fallback to safe defaults if calculation is noisy
    high_threshold = max(0.6, min(high_threshold, 0.85))
    low_threshold = min(0.4, max(low_threshold, 0.15))

    print(f"Optimal Center Threshold: {center_threshold:.4f}")
    print(f"Calibrated Bands: [{low_threshold:.2f} - {high_threshold:.2f}]")

    # 5. Update Config
    config = {
        "low_threshold": round(low_threshold, 3),
        "high_threshold": round(high_threshold, 3),
        "max_attempts": 3,
        "cooldown_minutes": 10,
        "ip_limit_per_hour": 5
    }
    
    with open("config.json", "w") as f:
        json.dump(config, f, indent=4)
    
    print("✅ Config updated with calibrated thresholds.")

if __name__ == "__main__":
    calibrate()

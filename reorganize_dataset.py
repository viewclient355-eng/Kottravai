import os
import shutil
import random
import pandas as pd
from PIL import Image

def build_dataset(source_base, target_base):
    source_inked = os.path.join(source_base, "with ink")
    source_not_inked = os.path.join(source_base, "without") # Adjusted based on actual folder name found
    
    classes = {
        "inked": source_inked,
        "not_inked": source_not_inked
    }
    
    # Create target directories
    for split in ["train", "val"]:
        for cls in classes.keys():
            os.makedirs(os.path.join(target_base, split, cls), exist_ok=True)
            
    all_data = []
    skipped_files = []
    
    for label_name, source_dir in classes.items():
        if not os.path.exists(source_dir):
            print(f"Warning: Source directory {source_dir} does not exist.")
            continue
            
        files = [f for f in os.listdir(source_dir) if os.path.isfile(os.path.join(source_dir, f))]
        
        # Validation and splitting
        valid_files = []
        for f in files:
            file_path = os.path.join(source_dir, f)
            try:
                with Image.open(file_path) as img:
                    img.verify() # Verify image integrity
                valid_files.append(f)
            except Exception as e:
                skipped_files.append((file_path, str(e)))
        
        random.shuffle(valid_files)
        split_idx = int(len(valid_files) * 0.8)
        
        train_files = valid_files[:split_idx]
        val_files = valid_files[split_idx:]
        
        # Move files and collect data for CSV
        for f in train_files:
            dest = os.path.join(target_base, "train", label_name, f)
            shutil.copy2(os.path.join(source_dir, f), dest)
            all_data.append({"image_path": dest, "label": 1 if label_name == "inked" else 0})
            
        for f in val_files:
            dest = os.path.join(target_base, "val", label_name, f)
            shutil.copy2(os.path.join(source_dir, f), dest)
            all_data.append({"image_path": dest, "label": 1 if label_name == "inked" else 0})

    # Save CSV
    df = pd.DataFrame(all_data)
    csv_path = os.path.join(target_base, "dataset_metadata.csv")
    df.to_csv(csv_path, index=False)
    
    # Print Summary
    print("\n" + "="*30)
    print("DATASET REORGANIZATION SUMMARY")
    print("="*30)
    print(f"Total images processed: {len(all_data)}")
    print(f"Train count: {len(df[df['image_path'].str.contains('/train/')])}")
    print(f"Validation count: {len(df[df['image_path'].str.contains('/val/')])}")
    print(f"Skipped/Corrupted: {len(skipped_files)}")
    print(f"CSV Metadata saved to: {csv_path}")
    
    if skipped_files:
        print("\nSkipped Files Log:")
        for f, err in skipped_files:
            print(f"- {os.path.basename(f)}: {err}")

if __name__ == "__main__":
    SOURCE = "public/catalog/voter data"
    TARGET = "dataset"
    build_dataset(SOURCE, TARGET)

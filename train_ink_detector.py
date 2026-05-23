import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import pandas as pd
import os
import time

# --- 1. Dataset Loader ---
class VoterInkDataset(Dataset):
    def __init__(self, csv_file, transform=None):
        self.data = pd.read_csv(csv_file)
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path = self.data.iloc[idx, 0]
        label = int(self.data.iloc[idx, 1])
        
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
            
        return image, label

# --- 2. Data Preprocessing & Augmentation ---
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# --- 3. Model Building ---
def build_model():
    # Use MobileNetV2 for production efficiency
    model = models.mobilenet_v2(pretrained=True)
    
    # Freeze background
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace classifier
    # MobileNetV2 uses a simple Dropout -> Linear classifier
    # last layer index is model.classifier[1]
    num_ftrs = model.last_channel 
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(num_ftrs, 1),
        nn.Sigmoid()
    )
    return model

# --- 4. Training Loop ---
def train_model(model, train_loader, val_loader, epochs=20, device="cpu"):
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.0001)
    
    best_val_loss = float('inf')
    early_stop_counter = 0
    patience = 5
    
    model.to(device)
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device).float().unsqueeze(1)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            preds = (outputs > 0.5).float()
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            
        train_loss = running_loss / total
        train_acc = correct / total
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device).float().unsqueeze(1)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * inputs.size(0)
                preds = (outputs > 0.5).float()
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)
                
        val_loss = val_loss / val_total
        val_acc = val_correct / val_total
        
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}")
        
        # Early Stopping & Checkpoint
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), "model_ink_detector.pth")
            early_stop_counter = 0
        else:
            early_stop_counter += 1
            if early_stop_counter >= patience:
                print("Early stopping triggered.")
                break
                
        # Optional: Unfreeze last blocks of MobileNet after epoch 10
        if epoch == 10:
            print("Unfreezing base layers for fine-tuning...")
            for param in model.features.parameters():
                param.requires_grad = True
            optimizer = optim.Adam(model.parameters(), lr=0.00001) # Lower LR for fine-tuning

    print(f"Best model saved to model_ink_detector.pth")

# --- 5. Inference Function ---
def predict_image(image_path, model_path="model_ink_detector.pth"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Rebuild & Load Model
    model = build_model()
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    
    # Process Image
    img = Image.open(image_path).convert("RGB")
    img_tensor = val_transforms(img).unsqueeze(0).to(device)
    
    with torch.no_grad():
        output = model(img_tensor)
        prob = output.item()
        is_inked = prob > 0.5
        
    print(f"\nFinal Probability: {prob:.4f}")
    if is_inked:
        print("Result: Inked Finger Detected ✅")
    else:
        print("Result: No Ink Detected ❌")

if __name__ == "__main__":
    # Setup Paths
    metadata_csv = "dataset/metadata.csv" # Ensure this points to the file created in previous step
    
    # Handle local vs global pathing (if metadata has absolute paths)
    df = pd.read_csv(metadata_csv)
    
    # Split for loader
    train_df = df[df['image_path'].str.contains('train')].to_csv("train_meta.csv", index=False)
    val_df = df[df['image_path'].str.contains('val')].to_csv("val_meta.csv", index=False)
    
    train_ds = VoterInkDataset("train_meta.csv", transform=train_transforms)
    val_ds = VoterInkDataset("val_meta.csv", transform=val_transforms)
    
    train_loader = DataLoader(train_ds, batch_size=4, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=2, shuffle=False)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = build_model()
    
    TRAIN_MODE = True # Set to False for inference test
    
    if TRAIN_MODE:
        train_model(model, train_loader, val_loader, epochs=20, device=device)
    else:
        # Example Inference
        test_img = df.iloc[0, 0] 
        predict_image(test_img)

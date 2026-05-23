import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import models, transforms
from PIL import Image, ImageOps
import pandas as pd
import os
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# --- 1. Robust Preprocessing (ML-ready) ---
class ImageEnhancer:
    @staticmethod
    def apply(image):
        # Auto contrast
        image = ImageOps.autocontrast(image)
        # Convert to HSV and back could be complex in PIL here, 
        # but we can do some simple enhancements
        return image

class VoterDatasetV2(Dataset):
    def __init__(self, dataframe, transform=None):
        self.data = dataframe
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path = self.data.iloc[idx, 0]
        label = int(self.data.iloc[idx, 1])
        
        image = Image.open(img_path).convert("RGB")
        image = ImageEnhancer.apply(image)
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

# --- 2. Advanced Augmentation ---
train_transforms = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.GaussianBlur(kernel_size=(5, 9), sigma=(0.1, 5)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# --- 3. Production Model Setup ---
def get_model():
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    # Freeze most layers initially
    for param in model.parameters():
        param.requires_grad = False
    
    model.classifier[1] = nn.Sequential(
        nn.Linear(model.last_channel, 512),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(512, 1),
        nn.Sigmoid()
    )
    return model

# --- 4. Training Engine ---
def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    df = pd.read_csv("dataset/metadata.csv")
    
    # Split into Train (70%), Val (15%), Test (15%)
    train_df = df.sample(frac=0.7, random_state=42)
    temp_df = df.drop(train_df.index)
    val_df = temp_df.sample(frac=0.5, random_state=42)
    test_df = temp_df.drop(val_df.index)

    train_loader = DataLoader(VoterDatasetV2(train_df, train_transforms), batch_size=8, shuffle=True)
    val_loader = DataLoader(VoterDatasetV2(val_df, val_transforms), batch_size=8)
    test_loader = DataLoader(VoterDatasetV2(test_df, val_transforms), batch_size=8)

    model = get_model().to(device)
    
    # Label Smoothing Loss for regularization
    criterion = nn.BCELoss() # Sigmoid output requires BCELoss
    # For label smoothing with BCE, we manually adjust targets below
    
    optimizer = optim.Adam(model.classifier.parameters(), lr=1e-4)

    best_acc = 0
    for epoch in range(15):
        model.train()
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device).float().unsqueeze(1)
            
            # Manual Label Smoothing
            smooth_labels = labels * 0.9 + 0.05
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, smooth_labels)
            loss.backward()
            optimizer.step()

        # Validation
        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device).float().unsqueeze(1)
                outputs = model(images)
                preds = (outputs > 0.5).float()
                correct += (preds == labels).sum().item()
                total += labels.size(0)
        
        val_acc = correct/total if total > 0 else 0
        print(f"Epoch {epoch+1}, Val Acc: {val_acc:.4f}")
        
        if val_acc >= best_acc:
            best_acc = val_acc
            # Save TorchScript for optimized inference
            scripted_model = torch.jit.script(model)
            scripted_model.save("ink_model_v2.pt")

    # --- 5. Evaluation Loop (Test Set) ---
    print("\n--- TEST SET EVALUATION ---")
    model.eval()
    y_true, y_pred = [], []
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device).float().unsqueeze(1)
            outputs = model(images)
            preds = (outputs > 0.5).float()
            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())
    
    print(classification_report(y_true, y_pred, target_names=['not_inked', 'inked']))
    print("Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))

if __name__ == "__main__":
    train()

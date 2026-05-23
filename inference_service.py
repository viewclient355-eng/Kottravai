import torch
import sys
import json
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
from torchvision import transforms


def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    Enhanced preprocessing pipeline (mirrors ml_service.py):
    1. Auto contrast normalization
    2. Sharpening filter (UnsharpMask)
    3. Color enhancement
    4. Center crop to square
    5. Resize to 224x224 + ImageNet normalization
    """
    # Step 1: Auto-contrast normalization
    image = ImageOps.autocontrast(image, cutoff=1)

    # Step 2: Gentle sharpening
    image = image.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

    # Step 3: Boost saturation slightly to help ink pop
    enhancer = ImageEnhance.Color(image)
    image = enhancer.enhance(1.25)

    # Step 4: Center crop to square
    w, h = image.size
    crop_size = min(w, h)
    left = (w - crop_size) // 2
    top  = (h - crop_size) // 2
    image = image.crop((left, top, left + crop_size, top + crop_size))

    # Step 5: Resize + normalize
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return transform(image)


def load_config(config_path="config.json"):
    try:
        with open(config_path, "r") as f:
            return json.load(f)
    except Exception:
        return {
            "low_threshold": 0.30,
            "high_threshold": 0.70,
            "soft_approval_margin": 0.08
        }


def run_inference(image_path, model_path="ink_model_v2.pt", config_path="config.json"):
    try:
        config = load_config(config_path)
        low    = config.get("low_threshold", 0.30)
        high   = config.get("high_threshold", 0.70)
        margin = config.get("soft_approval_margin", 0.08)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load TorchScript model
        model = torch.jit.load(model_path, map_location=device)
        model.eval()

        # Load and preprocess image
        image = Image.open(image_path).convert("RGB")
        input_tensor = preprocess_image(image).unsqueeze(0).to(device)

        # Inference
        with torch.no_grad():
            output = model(input_tensor)
            confidence = float(output.item())

        # Thresholding with soft-approval
        if confidence > high:
            result = "inked"
            reason = "ok"
        elif confidence >= low:
            result = "uncertain"
            reason = "uncertain_zone"
        elif confidence >= (low - margin):
            # Soft approval: borderline — allow with reduced confidence flag
            result = "uncertain_soft"
            reason = "soft_approval"
        else:
            result = "not_inked"
            reason = "low_confidence"

        return {
            "status": "success",
            "result": result,
            "confidence": round(confidence, 4),
            "reason": reason,
            "thresholds": {"low": low, "high": high}
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No image path provided"}))
    else:
        img_path = sys.argv[1]
        print(json.dumps(run_inference(img_path)))

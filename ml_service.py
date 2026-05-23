from fastapi import FastAPI, UploadFile, File, HTTPException
import torch
import json
import io
import logging
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
from torchvision import transforms
import uvicorn
import imagehash
import time

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("ink_service")

app = FastAPI(title="Ink Detection ML Service")

# --- 1. Load Configuration & Thresholds ---
def load_config():
    try:
        with open("config.json", "r") as f:
            data = json.load(f)
            return data
    except Exception as e:
        logger.warning(f"Config Load Error: {e}. Using defaults.")
        return {
            "low_threshold": 0.30,
            "high_threshold": 0.70,
            "soft_approval_margin": 0.08
        }

CONFIG = load_config()

# --- 2. Load Optimized Model & Warmup ---
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
try:
    MODEL = torch.jit.load("ink_model_v2.pt", map_location=DEVICE)
    MODEL.eval()
    # Warmup pass
    dummy = torch.randn(1, 3, 224, 224).to(DEVICE)
    MODEL(dummy)
    MODEL_STATUS = "ready"
    logger.info(f"✅ Model loaded on {DEVICE}")
except Exception as e:
    logger.critical(f"MODEL LOAD FAILED: {e}")
    MODEL = None
    MODEL_STATUS = "error"

# --- 3. Enhanced Preprocessing Pipeline ---
def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    Full preprocessing pipeline:
    1. Auto contrast normalization  – compensates for poor lighting
    2. Sharpening filter            – recovers edge detail from blurry photos
    3. Center-crop to finger region – focus on the relevant region
    4. Resize to 224x224            – match training input size
    5. Normalize to ImageNet stats  – expected by MobileNetV2
    """
    # Step 1: Auto-contrast normalization (stretches histogram)
    image = ImageOps.autocontrast(image, cutoff=1)

    # Step 2: Subtle sharpening (UnsharpMask is gentler than SHARPEN)
    image = image.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

    # Step 3: Slightly enhance color saturation for ink detection
    enhancer = ImageEnhance.Color(image)
    image = enhancer.enhance(1.25)

    # Step 4: Center crop (tight crop focuses on finger region)
    w, h = image.size
    crop_size = min(w, h)
    left = (w - crop_size) // 2
    top  = (h - crop_size) // 2
    image = image.crop((left, top, left + crop_size, top + crop_size))

    # Step 5: Resize to 224x224 and normalize
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return transform(image)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="ML Service Unavailable")

    start_time = time.time()
    debug_log = {}

    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Calculate pHash for duplicate/similarity detection
        phash = str(imagehash.phash(image))

        # Apply enhanced preprocessing pipeline
        input_tensor = preprocess_image(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            output = MODEL(input_tensor)
            confidence = float(output.item())

        # Load latest thresholds (hot-reload from config.json)
        current_config = load_config()
        low    = current_config.get("low_threshold", 0.30)
        high   = current_config.get("high_threshold", 0.70)
        margin = current_config.get("soft_approval_margin", 0.08)

        # --- Classification with soft-approval band ---
        if confidence > high:
            result = "inked"
            hint = None
        elif confidence < low:
            result = "not_inked"
            hint = (
                "We couldn't detect the ink clearly. Please:\n"
                "• Use good lighting\n"
                "• Keep finger close to camera\n"
                "• Ensure ink mark is visible"
            )
        elif confidence >= (low - margin):
            # Borderline uncertain: soft approval zone
            result = "uncertain_soft"
            hint = "Ink mark detected with low confidence. Please ensure good lighting and a clear view."
        else:
            result = "uncertain"
            hint = (
                "We couldn't detect the ink clearly. Please:\n"
                "• Use good lighting\n"
                "• Keep finger close to camera\n"
                "• Ensure ink mark is visible"
            )

        # --- Structured Debug Log ---
        debug_log = {
            "confidence": round(confidence, 4),
            "source": "ml",
            "result": result,
            "low_threshold": low,
            "high_threshold": high,
            "reason": (
                "low_confidence" if confidence < low
                else ("uncertain_zone" if result.startswith("uncertain") else "ok")
            ),
            "latency_ms": round((time.time() - start_time) * 1000, 2)
        }
        logger.info(f"[PREDICT] {json.dumps(debug_log)}")

        return {
            "result": result,
            "confidence": round(confidence, 4),
            "phash": phash,
            "source": "ml",
            "hint": hint,
            "latency_ms": debug_log["latency_ms"]
        }

    except Exception as e:
        logger.error(f"[PREDICT_ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "ok" if MODEL_STATUS == "ready" else "degraded",
        "model": MODEL_STATUS,
        "device": str(DEVICE),
        "config": load_config(),
        "timestamp": time.time()
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

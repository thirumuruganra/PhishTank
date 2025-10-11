from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Print startup message before slow imports
print("="*60)
print("Starting Phishing Email Detection API...")
print("Loading libraries (this may take 30-60 seconds on first run)...")
print("="*60)
sys.stdout.flush()


# Now import the slow modules
print("Loading transformers...")
sys.stdout.flush()
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification


print("Loading torch...")
sys.stdout.flush()
import torch


print("✓ All libraries loaded successfully!")
print("="*60)
sys.stdout.flush()


# Initialize FastAPI app
app = FastAPI(title="Phishing Email Detection API", version="1.0")


# Enable CORS for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global variables for model and tokenizer
model = None
tokenizer = None
device = None


# Label mapping
LABEL_MAP = {
    0: "legitimate",
    1: "phishing"
}


# Request model - date field removed
class EmailRequest(BaseModel):
    sender: str
    subject: str
    body: str


# Response model
class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    label: int
    processed_date: str


@app.on_event("startup")
async def load_model():
    """Load model and tokenizer on startup"""
    global model, tokenizer, device
    
    try:
        logger.info("Initializing model...")
        
        # Set device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {device}")
        
        # Path to your saved model files
        model_path = "./distilbert_phishing_model"
        
        # Load tokenizer and model
        logger.info("Loading tokenizer...")
        tokenizer = DistilBertTokenizer.from_pretrained(model_path)
        
        logger.info("Loading model weights...")
        model = DistilBertForSequenceClassification.from_pretrained(model_path)
        model.to(device)
        model.eval()
        
        logger.info("✓ Model loaded successfully and ready to serve requests!")
        
    except Exception as e:
        logger.error(f"✗ Error loading model: {str(e)}")
        raise


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Phishing Email Detection API",
        "model": "DistilBERT",
        "version": "1.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_phishing(request: EmailRequest):
    """Predict if an email is phishing or legitimate"""
    try:
        if model is None or tokenizer is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Automatically use current system date
        email_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        email_text = request.body
        
        logger.info(f"Processing email from: {request.sender} at {email_date}")
        
        # Tokenize input
        inputs = tokenizer(
            email_text,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )
        
        inputs = {key: val.to(device) for key, val in inputs.items()}
        
        # Make prediction
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            confidence, predicted_class = torch.max(probabilities, dim=1)
        
        pred_label = predicted_class.item()
        pred_confidence = confidence.item()
        pred_text = LABEL_MAP[pred_label]
        
        logger.info(f"Prediction: {pred_text} (confidence: {pred_confidence:.4f})")
        
        return PredictionResponse(
            prediction=pred_text,
            confidence=round(pred_confidence, 4),
            label=pred_label,
            processed_date=email_date
        )
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict_batch")
async def predict_batch(emails: list[EmailRequest]):
    """Batch prediction endpoint for multiple emails"""
    try:
        results = []
        for email in emails:
            result = await predict_phishing(email)
            results.append(result)
        return {"predictions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("Starting FastAPI server...")
    print("API will be available at: http://localhost:8000")
    print("Interactive docs at: http://localhost:8000/docs")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
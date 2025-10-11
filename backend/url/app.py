from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import logging
import joblib
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("="*60)
print("Starting URL Phishing Detection API...")
print("="*60)
sys.stdout.flush()

# Initialize FastAPI app
app = FastAPI(
    title="URL Phishing Detection API",
    description="Detect phishing URLs using Logistic Regression",
    version="1.0"
)

# Enable CORS for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for URL model
url_model = None
url_vectorizer = None

# Label mapping
LABEL_MAP = {
    0: "legitimate",
    1: "phishing"
}

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class URLRequest(BaseModel):
    url: str

class URLPredictionResponse(BaseModel):
    url: str
    prediction: str  # "legitimate" or "phishing"
    label: int  # 0 or 1
    timestamp: str

class BatchURLRequest(BaseModel):
    urls: list[str]

class BatchURLResponse(BaseModel):
    predictions: list[URLPredictionResponse]
    total_urls: int
    phishing_count: int
    legitimate_count: int

# ============================================
# STARTUP: LOAD MODEL
# ============================================

@app.on_event("startup")
async def load_model():
    """Load URL classifier model on startup"""
    global url_model, url_vectorizer
    
    try:
        logger.info("="*60)
        logger.info("LOADING URL CLASSIFIER MODEL")
        logger.info("="*60)
        
        # Path to your saved model files
        model_path = './logreg_phishing_model/url_classifier_lr_model.pkl'
        vectorizer_path = './logreg_phishing_model/url_vectorizer.pkl'
        
        logger.info(f"Model path: {model_path}")
        logger.info(f"Vectorizer path: {vectorizer_path}")
        
        # Load model and vectorizer
        logger.info("Loading model...")
        url_model = joblib.load(model_path)
        
        logger.info("Loading vectorizer...")
        url_vectorizer = joblib.load(vectorizer_path)
        
        logger.info("="*60)
        logger.info("✓ MODEL LOADED SUCCESSFULLY!")
        logger.info("="*60)
        
    except FileNotFoundError as e:
        logger.error(f"✗ Model files not found: {str(e)}")
        logger.error("Please ensure the model files are in './logreg_phishing_model/' directory")
        raise
    except Exception as e:
        logger.error(f"✗ Error loading model: {str(e)}")
        raise

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "status": "running",
        "service": "URL Phishing Detection API",
        "model": "Logistic Regression with TF-IDF",
        "version": "1.0",
        "endpoints": {
            "predict": "/predict",
            "batch": "/predict/batch",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": url_model is not None,
        "vectorizer_loaded": url_vectorizer is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict", response_model=URLPredictionResponse)
async def predict_url(request: URLRequest):
    """
    Predict if a URL is phishing or legitimate
    
    Args:
        request: URLRequest containing url
    
    Returns:
        URLPredictionResponse with prediction and label
    """
    try:
        # Check if model is loaded
        if url_model is None or url_vectorizer is None:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Please check server logs."
            )
        
        logger.info(f"Processing URL: {request.url}")
        
        # Vectorize the URL
        url_vectorized = url_vectorizer.transform([request.url])
        
        # Make prediction
        prediction = url_model.predict(url_vectorized)[0]
        pred_label = int(prediction)
        pred_text = LABEL_MAP[pred_label]
        
        logger.info(f"Prediction: {pred_text} (label: {pred_label})")
        
        return URLPredictionResponse(
            url=request.url,
            prediction=pred_text,
            label=pred_label,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch", response_model=BatchURLResponse)
async def predict_urls_batch(request: BatchURLRequest):
    """
    Predict multiple URLs at once
    
    Args:
        request: BatchURLRequest containing list of URLs
    
    Returns:
        BatchURLResponse with all predictions and statistics
    """
    try:
        # Check if model is loaded
        if url_model is None or url_vectorizer is None:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Please check server logs."
            )
        
        logger.info(f"Processing batch of {len(request.urls)} URLs")
        
        results = []
        phishing_count = 0
        legitimate_count = 0
        
        for url in request.urls:
            # Vectorize the URL
            url_vectorized = url_vectorizer.transform([url])
            
            # Make prediction
            prediction = url_model.predict(url_vectorized)[0]
            pred_label = int(prediction)
            pred_text = LABEL_MAP[pred_label]
            
            # Count predictions
            if pred_label == 1:
                phishing_count += 1
            else:
                legitimate_count += 1
            
            results.append(URLPredictionResponse(
                url=url,
                prediction=pred_text,
                label=pred_label,
                timestamp=datetime.now().isoformat()
            ))
        
        logger.info(f"Batch complete: {phishing_count} phishing, {legitimate_count} legitimate")
        
        return BatchURLResponse(
            predictions=results,
            total_urls=len(request.urls),
            phishing_count=phishing_count,
            legitimate_count=legitimate_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("Starting FastAPI server...")
    print("API will be available at: http://localhost:8000")
    print("Interactive docs at: http://localhost:8000/docs")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

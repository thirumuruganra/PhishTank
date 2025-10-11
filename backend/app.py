from fastapi import FastAPI
from pydantic import BaseModel
from model_utils import classify_url
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow Chrome Extension CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UrlRequest(BaseModel):
    url: str


@app.get("/")
def read_root():
    return {"message": "FastAPI is running"}

@app.get("/.well-known/appspecific/com.chrome.devtools.json")
def devtools_json():
    return {}


@app.post("/check_url") #model running
async def check_url(data: UrlRequest):
    classification = classify_url(data.url)
    print(data.url)  # Debugging line
    return {"classification": classification}

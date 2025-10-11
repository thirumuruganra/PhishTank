# load your model here
# import joblib REPLACE WITH ACTUAL MODEL LOADING

# Example placeholder
#model = joblib.load("phish_model.pkl")

def classify_url(url: str) -> str:
    return "blacklist" if "hello" in url else "whitelist" #fake test fn

''' Preprocess URL -> feature extraction - PASTE WRT ACTUAL MODEL LOGIC  
INSTEAD OF ABOVE RETURN STATEMENT AND BELOW COMMENTED CODE
features = extract_features(url)

    # Predict using model
result = model.predict([features])[0]

    # Convert result to readable label
return "blacklist" if result == 1 else "whitelist"'''

def extract_features(url: str):
    # your URL preprocessing logic here
    # Example placeholder:
    return [len(url), url.count('.')]

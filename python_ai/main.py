from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import time

app = FastAPI(title="Carbon Sentinel AI Shield", description="Fraud Detection Engine")

class TransactionRequest(BaseModel):
    wallet_address: str
    amount: float
    ip_address: str
    timestamp: float
    user_id: str

class DetectionResponse(BaseModel):
    is_safe: bool
    risk_score: float
    flags: list[str]
    time_taken_ms: float

@app.post("/analyze_transaction", response_model=DetectionResponse)
async def analyze_transaction(tx: TransactionRequest):
    start_time = time.time()
    
    # In a production environment, this is where we would load a pre-trained scikit-learn
    # or TensorFlow model. We would pass the 'tx' parameters into the model.predict().
    # For this beginner phase, we are using Heuristic (Rule-Based) Models.
    
    risk_score = 0.0
    flags = []
    
    # Rule 1: IP Address check (Mocking a VPN / High-Risk IP list check)
    if tx.ip_address.startswith("192.168."):
        # Assuming local IPs are suspicious for an enterprise platform
        pass
        
    # Rule 2: Unusually high purchase amount
    if tx.amount > 100000:
        risk_score += 0.4
        flags.append("HIGH_VOLUME_TRANSACTION")
        
    # Rule 3: Velocity Check Mock (Simulated AI anomaly detection)
    # The 'AI' randomly determines a baseline deviation for demo purposes.
    ai_confidence_deviation = random.uniform(0.0, 0.5)
    risk_score += ai_confidence_deviation
    
    if ai_confidence_deviation > 0.4:
        flags.append("BEHAVIORAL_ANOMALY_DETECTED")
        
    is_safe = risk_score < 0.7  # Threshold for blocking
    
    processing_time = (time.time() - start_time) * 1000
    
    return DetectionResponse(
        is_safe=is_safe,
        risk_score=round(risk_score, 2),
        flags=flags,
        time_taken_ms=round(processing_time, 2)
    )

@app.get("/health")
async def health_check():
    return {"status": "AI Engine Online", "active_models": ["heuristic_v1", "mock_lstm_v2"]}

if __name__ == "__main__":
    import uvicorn
    # Runs the AI Engine on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

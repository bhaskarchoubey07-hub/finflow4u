from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI(title="FinFlow ML Service")

# Load model
MODEL_PATH = "models/loan_default_model.pkl"
model = None

def get_model():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            raise Exception("Model file not found. Please run training first.")
    return model

class LoanApplication(BaseModel):
    annual_income: float
    existing_debt: float
    loan_amount: float
    employment_years: int
    credit_score: int
    term_months: int

@app.get("/")
async def root():
    return {"message": "FinFlow ML Service is running"}

@app.post("/predict")
async def predict_risk(app_data: LoanApplication):
    try:
        clf = get_model()
        
        # Prepare data
        df = pd.DataFrame([app_data.dict()])
        df['dti'] = df['existing_debt'] / df['annual_income']
        
        # Features must match training order
        features = ['annual_income', 'existing_debt', 'loan_amount', 'employment_years', 'credit_score', 'term_months', 'dti']
        X = df[features]
        
        # Predict
        prob_default = clf.predict_proba(X)[0][1]
        
        # Determine risk grade
        risk_grade = "A"
        if prob_default > 0.3: risk_grade = "D"
        elif prob_default > 0.15: risk_grade = "C"
        elif prob_default > 0.05: risk_grade = "B"
        
        # Explainability (Simple feature importance for this sample)
        # In a real app, use SHAP
        importances = clf.feature_importances_
        explanation = []
        for i, feat in enumerate(features):
            if i < len(importances):
                explanation.append({"feature": feat, "importance": float(importances[i])})
                
        return {
            "probability_of_default": float(prob_default),
            "risk_grade": risk_grade,
            "credit_score_dynamic": int(app_data.credit_score), # Placeholder for dynamic score
            "explanation": explanation,
            "recommendation": "APPROVE" if prob_default < 0.2 else "REJECT"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/advisor/chat")
async def advisor_chat(query: dict):
    text = query.get("message", "").lower()
    
    # Simple rule-based expert system logic
    if "grade a" in text:
        return {"response": "Grade A loans have the lowest risk (PD < 5%) but offer lower interest rates (around 8-10%). They are ideal for capital preservation."}
    elif "grade d" in text:
        return {"response": "Grade D loans are high-risk (PD > 30%) with interest rates often exceeding 18%. Only invest a small fraction of your portfolio here for aggressive yield."}
    elif "interest rate" in text:
        return {"response": "Interest rates on FinFlow are dynamically calculated using ML based on your credit score, income, and market conditions."}
    elif "repayment" in text or "emi" in text:
        return {"response": "Missing an EMI can lower your credit score by 100+ points and lead to default penalties. We recommend enabling Auto-Pay in your dashboard."}
    elif "invest" in text:
        return {"response": "A balanced portfolio strategy involves 60% Grade A/B loans, 30% Grade C, and 10% Grade D for optimal risk-adjusted returns."}
    elif "score" in text:
        return {"response": "Our AI looks at 50+ factors including income, debt, and employment history to generate your FinFlow Credit Score (300-850 range)."}
    elif "borrow" in text:
        return {"response": "Borrowers with a Debt-to-Income ratio below 35% typically receive better interest rates and higher approval chances."}
    else:
        return {"response": f"I'm training on thousands of loan scenarios to help you. Ask me about specific 'Risk Grades', 'Investment Strategies', or how to 'Improve Score'."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

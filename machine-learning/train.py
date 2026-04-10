import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Create dummy loan dataset
def generate_synthetic_data(n_samples=1000):
    np.random.seed(42)
    
    data = {
        'annual_income': np.random.normal(50000, 20000, n_samples).clip(15000, 200000),
        'existing_debt': np.random.normal(10000, 8000, n_samples).clip(0, 100000),
        'loan_amount': np.random.normal(15000, 10000, n_samples).clip(1000, 50000),
        'employment_years': np.random.randint(0, 20, n_samples),
        'credit_score': np.random.randint(300, 851, n_samples),
        'term_months': np.random.choice([12, 24, 36, 60], n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Debt-to-Income (DTI)
    df['dti'] = df['existing_debt'] / df['annual_income']
    
    # Simple probability of default logic
    # Higher DTI, Lower Credit Score, Higher Loan/Income = Higher Default Risk
    logit = (df['dti'] * 2.5) - (df['credit_score'] / 400) + (df['loan_amount'] / df['annual_income'] * 2.0) - (df['employment_years'] * 0.05)
    prob = 1 / (1 + np.exp(-logit))
    
    df['default'] = (prob > 0.5).astype(int)
    
    return df

def train_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data(2000)
    
    X = df.drop('default', axis=1)
    y = df['default']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test)
    print(f"Model accuracy: {accuracy:.2f}")
    
    # Save the model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/loan_default_model.pkl')
    print("Model saved to models/loan_default_model.pkl")

if __name__ == "__main__":
    train_model()

export default function LoanTable({ loans, onInvest, showAction = false }) {
  return (
    <div className="table-card">
      <table className="loan-table">
        <thead>
          <tr>
            <th>Borrower</th>
            <th>Amount</th>
            <th>Rate</th>
            <th>Risk</th>
            <th>Status</th>
            <th>Expected Return</th>
            <th>Funding</th>
            {showAction ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td>
                <div className="stack">
                  <strong>{loan.borrower?.name || "Borrower"}</strong>
                  <span>Score {loan.borrower?.creditScore ?? "N/A"}</span>
                </div>
              </td>
              <td>${Number(loan.amount).toLocaleString()}</td>
              <td>{loan.interestRate}%</td>
              <td>
                <span className={`pill risk-${String(loan.riskGrade).toLowerCase()}`}>
                  {loan.riskGrade}
                </span>
                <div className="stack compact">
                  <span>{loan.riskBand || "Risk pending"}</span>
                  <span>PD {Number(loan.probabilityOfDefault || 0).toFixed(2)}%</span>
                </div>
              </td>
              <td>
                <span className={`pill status-${String(loan.status).toLowerCase()}`}>
                  {loan.status}
                </span>
              </td>
              <td>${Number(loan.expectedReturn || 0).toLocaleString()}</td>
              <td>
                ${Number(loan.fundedAmount || 0).toLocaleString()} / $
                {Number(loan.amount).toLocaleString()}
              </td>
              {showAction ? (
                <td>
                  <button className="ghost-button" onClick={() => onInvest?.(loan)}>
                    Invest
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

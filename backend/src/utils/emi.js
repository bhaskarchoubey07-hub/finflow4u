function calculateEmi(principal, annualInterestRate, termMonths) {
  const monthlyRate = annualInterestRate / 12 / 100;

  if (monthlyRate === 0) {
    return Number((principal / termMonths).toFixed(2));
  }

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Number(emi.toFixed(2));
}

module.exports = {
  calculateEmi
};

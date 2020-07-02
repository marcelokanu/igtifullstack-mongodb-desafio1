const moneyFormatter = Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDate(date) {
  const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date);

  return dateTimeFormat;
}

function formatMoney(number) {
  return moneyFormatter.format(number);
}

function formatPercentage(number) {
  return `${number.toFixed(2).replace('.', ',')} %`;
}

export { formatMoney, formatPercentage, formatDate };

export const validateEmail = (email) => {
    const Regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return Regex.test(email)
}   

export const addThousandsSeparator = (num) => {
    if (num === null || isNaN(num)) return '';
    const [integerPart, decimalPart] = num.toString().split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}
export const validateEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string) => {
  // Password should be at least 8 characters long
  return password.length >= 8;
};

export const validateCompanyName = (name: string) => {
  // Company name should be at least 2 characters long and not just whitespace
  return name && name.trim().length >= 2;
};

// Function to check if the password has at least one number and one uppercase letter
export const validatePasswordStrength = (password: string) => {
  const hasNumber = /[0-9]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  
  return {
    isValid: hasNumber && hasUpperCase,
    hasNumber,
    hasUpperCase
  };
};



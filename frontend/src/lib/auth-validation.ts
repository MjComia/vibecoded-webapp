export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabel: "Too Weak" | "Weak" | "Fair" | "Strong";
  criteria: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  errors: string[];
}

/**
 * Validates clinical student password strength:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*...)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!minLength) errors.push("At least 8 characters");
  if (!hasUppercase) errors.push("At least one uppercase letter (A-Z)");
  if (!hasLowercase) errors.push("At least one lowercase letter (a-z)");
  if (!hasNumber) errors.push("At least one number (0-9)");
  if (!hasSpecial) errors.push("At least one special character (!@#$%^&*)");

  let score = 0;
  if (minLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let strengthLabel: "Too Weak" | "Weak" | "Fair" | "Strong" = "Too Weak";
  if (score === 4) strengthLabel = "Strong";
  else if (score === 3) strengthLabel = "Fair";
  else if (score >= 1) strengthLabel = "Weak";

  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  return {
    isValid,
    score,
    strengthLabel,
    criteria: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    },
    errors,
  };
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): { matches: boolean; error?: string } {
  if (!confirmPassword) {
    return { matches: false, error: "Please verify your password by typing it again." };
  }
  if (password !== confirmPassword) {
    return { matches: false, error: "Passwords do not match." };
  }
  return { matches: true };
}

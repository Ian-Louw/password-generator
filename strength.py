import string

COMMON_PATTERNS = [
    "password", "123456", "qwerty", "abc123", "letmein", "admin",
    "welcome", "monkey", "master", "dragon", "login", "princess",
    "football", "shadow", "sunshine", "trustno1", "iloveyou",
    "1234", "0000", "passw0rd",
]


def evaluate_strength(password: str) -> dict:
    score = 0

    # Length scoring (up to 40 points)
    length = len(password)
    if length >= 24:
        score += 40
    elif length >= 16:
        score += 30
    elif length >= 12:
        score += 20
    elif length >= 8:
        score += 10

    # Character diversity (up to 40 points)
    has_upper = any(c in string.ascii_uppercase for c in password)
    has_lower = any(c in string.ascii_lowercase for c in password)
    has_digit = any(c in string.digits for c in password)
    has_symbol = any(c in string.punctuation for c in password)

    diversity = sum([has_upper, has_lower, has_digit, has_symbol])
    score += diversity * 10

    # Common pattern penalty (up to -20 points)
    lower_pw = password.lower()
    for pattern in COMMON_PATTERNS:
        if pattern in lower_pw:
            score -= 20
            break

    # Repeated characters penalty
    if len(set(password)) < len(password) * 0.5:
        score -= 10

    score = max(0, min(100, score))

    if score >= 75:
        label = "Very Strong"
        color = "#2ECC71"
    elif score >= 50:
        label = "Strong"
        color = "#F1C40F"
    elif score >= 25:
        label = "Fair"
        color = "#E67E22"
    else:
        label = "Weak"
        color = "#E74C3C"

    return {"score": score, "label": label, "color": color}

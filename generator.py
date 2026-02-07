import secrets
import string


def generate_password(
    length: int = 16,
    uppercase: bool = True,
    lowercase: bool = True,
    digits: bool = True,
    symbols: bool = True,
) -> str:
    pools = []
    if uppercase:
        pools.append(string.ascii_uppercase)
    if lowercase:
        pools.append(string.ascii_lowercase)
    if digits:
        pools.append(string.digits)
    if symbols:
        pools.append(string.punctuation)

    if not pools:
        raise ValueError("At least one character type must be selected.")

    # Guarantee at least one character from each selected type
    guaranteed = [secrets.choice(pool) for pool in pools]

    # Fill the remaining length from the combined pool
    combined = "".join(pools)
    remaining = length - len(guaranteed)
    if remaining < 0:
        remaining = 0
        guaranteed = guaranteed[:length]

    fill = [secrets.choice(combined) for _ in range(remaining)]

    # Combine and shuffle
    password_chars = guaranteed + fill
    # Fisher-Yates shuffle using secrets for randomness
    for i in range(len(password_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        password_chars[i], password_chars[j] = password_chars[j], password_chars[i]

    return "".join(password_chars)

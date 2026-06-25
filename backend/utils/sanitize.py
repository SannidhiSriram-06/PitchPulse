import re
import unicodedata

def sanitize_company(name):
    """
    Sanitize company name. Allows Unicode letters/numbers plus common
    punctuation. Returns None for empty or clearly malicious input.
    """
    if not name or not name.strip():
        return None
    # Normalize unicode (NFC) and strip surrounding whitespace
    name = unicodedata.normalize("NFC", name.strip())[:120]
    # Allow Unicode word chars, spaces, and common company punctuation
    # Reject if it contains SQL/script injection patterns
    if re.search(r"[<>{}\[\];\"\\]", name):
        return None
    # Must contain at least one letter (Unicode)
    if not re.search(r"[^\W\d_]", name, re.UNICODE):
        return None
    return name

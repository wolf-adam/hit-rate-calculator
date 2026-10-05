import re
from urllib.parse import unquote, urlsplit, urlunsplit


def normalize_card_link(link: str) -> str:
    value = link.strip()
    parts = urlsplit(value)
    if not parts.scheme or not parts.netloc:
        return value

    return urlunsplit(
        (
            parts.scheme.lower(),
            parts.netloc.lower(),
            parts.path.rstrip("/"),
            parts.query,
            "",
        )
    )


def card_name_from_link(link: str) -> str:
    path = urlsplit(link).path
    last_segment = path.replace("\\", "/").rstrip("/").split("/")[-1]
    decoded_name = unquote(last_segment)
    decoded_name = re.sub(r"-V\d+(?=-|$)", "", decoded_name, flags=re.IGNORECASE)
    decoded_name = decoded_name.strip()

    extended_code_match = re.match(
        r"^(.+?)-(\d+[A-Za-z])([A-Za-z]*?)-?(\d{1,3})$",
        decoded_name,
    )
    if extended_code_match:
        name, code_prefix, code_suffix, code_digits = extended_code_match.groups()
        code = f"{code_prefix} {code_suffix}" if code_suffix else code_prefix
        if name.lower().endswith("-legend"):
            return f"{name.replace('-', ' ')} {code_prefix}{code_suffix} {code_digits}"
        return f"{name.replace('-', ' ').strip()} ({code} {code_digits})"

    normalized_name = decoded_name.replace("-", " ").strip()
    code_match = re.match(r"^(.*?)-?([A-Za-z]+)(\d{3})$", normalized_name)
    if not code_match:
        return normalized_name

    name, code_letters, code_digits = code_match.groups()
    return f"{name.strip()} ({code_letters} {code_digits})"
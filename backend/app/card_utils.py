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
    decoded_name = unquote(last_segment).replace("-V", "-v")
    decoded_name = decoded_name.strip()

    if "-v" in decoded_name.lower():
        prefix, _, suffix = decoded_name.rpartition("-v")
        if suffix.isdigit():
            decoded_name = prefix

    parts = decoded_name.rsplit("-", 2)
    if len(parts) == 3 and parts[1] and parts[2].isdigit():
        name, code, number = parts
        if code[-1:].isdigit() or code.isalpha():
            return f"{name.replace('-', ' ').strip()} ({code} {number})"

    normalized_name = decoded_name.replace("-", " ").strip()
    return normalized_name or link
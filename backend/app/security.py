"""Empreintes SHA-256. Aucune clé n'est stockée en clair."""
import hashlib
import hmac


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def same_hash(value: str, digest: str) -> bool:
    return hmac.compare_digest(sha256_hex(value), digest)

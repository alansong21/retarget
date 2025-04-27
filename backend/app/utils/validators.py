APPROVED_DOMAINS = [
    "target.com",
    "traderjoes.com",
    "ralphs.com"
]

def is_valid_retailer_url(url):
    from urllib.parse import urlparse
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return any(approved in domain for approved in APPROVED_DOMAINS)
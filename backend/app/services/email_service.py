import html
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from string import Template
from urllib.parse import quote

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False


logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
TEMPLATE_DIR = BACKEND_DIR / "app" / "templates"
PASSWORD_RESET_TEMPLATE = TEMPLATE_DIR / "password_reset_email.html"
PASSWORD_RESET_SUBJECT = "Reset your Budget Tracker password"
DEFAULT_APP_URL = "http://localhost:5173"
DEFAULT_RESET_TOKEN_EXPIRE_MINUTES = 30


load_dotenv()
load_dotenv(BACKEND_DIR / ".env", override=False)


@dataclass(frozen=True)
class EmailConfig:
    resend_api_key: str
    email_from: str
    app_url: str

    @classmethod
    def from_env(cls):
        resend_api_key = os.getenv("RESEND_API_KEY", "").strip()
        email_from = os.getenv("EMAIL_FROM", "").strip()
        app_url = os.getenv("APP_URL", DEFAULT_APP_URL).strip()

        missing = []
        if not resend_api_key:
            missing.append("RESEND_API_KEY")
        if not email_from:
            missing.append("EMAIL_FROM")

        if missing:
            raise ValueError(
                "Missing email configuration: " + ", ".join(missing)
            )

        return cls(
            resend_api_key=resend_api_key,
            email_from=email_from,
            app_url=app_url.rstrip("/") or DEFAULT_APP_URL,
        )


class EmailService:
    def __init__(self, config: EmailConfig | None = None):
        resolved_config = config or EmailConfig.from_env()
        self.config = EmailConfig(
            resend_api_key=resolved_config.resend_api_key,
            email_from=resolved_config.email_from,
            app_url=resolved_config.app_url.rstrip("/") or DEFAULT_APP_URL,
        )

    def build_password_reset_url(self, token: str) -> str:
        encoded_token = quote(token, safe="")
        return f"{self.config.app_url}/reset-password/{encoded_token}"

    def render_password_reset_email(
        self,
        reset_url: str,
        expires_minutes: int = DEFAULT_RESET_TOKEN_EXPIRE_MINUTES,
    ) -> str:
        template = Template(PASSWORD_RESET_TEMPLATE.read_text(encoding="utf-8"))
        return template.safe_substitute(
            reset_url=html.escape(reset_url, quote=True),
            expires_minutes=html.escape(str(expires_minutes), quote=True),
        )

    def send_password_reset_email(
        self,
        to_email: str,
        token: str,
        expires_minutes: int = DEFAULT_RESET_TOKEN_EXPIRE_MINUTES,
    ):
        try:
            import resend

            resend.api_key = self.config.resend_api_key
            reset_url = self.build_password_reset_url(token)
            html_body = self.render_password_reset_email(
                reset_url=reset_url,
                expires_minutes=expires_minutes,
            )

            return resend.Emails.send(
                {
                    "from": self.config.email_from,
                    "to": [to_email],
                    "subject": PASSWORD_RESET_SUBJECT,
                    "html": html_body,
                }
            )
        except Exception:
            logger.exception(
                "Failed to send password reset email to %s",
                to_email,
            )
            raise

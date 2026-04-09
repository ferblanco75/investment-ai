from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "investment-ai"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "changeme"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/investment_ai"

    JWT_SECRET_KEY: str = "changeme-jwt"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ANTHROPIC_API_KEY: str = ""
    ALPHA_VANTAGE_API_KEY: str = ""
    YAHOO_FINANCE_ENABLED: bool = True

    RATE_LIMIT_PER_MINUTE: int = 10

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

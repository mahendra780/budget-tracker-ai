from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def normalize_email(value: str):
    normalized = value.strip().lower()

    if "@" not in normalized or "." not in normalized.split("@")[-1]:
        raise ValueError("Invalid email address")

    return normalized


class UserRegister(BaseModel):
    full_name: str = Field(min_length=1)
    email: str
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str):
        return normalize_email(value)


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str):
        return normalize_email(value)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterResponse(BaseModel):
    message: str
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str):
        return normalize_email(value)


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


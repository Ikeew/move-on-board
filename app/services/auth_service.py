from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse, UpdateProfileRequest, ChangePasswordRequest


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, data: RegisterRequest) -> UserResponse:
        if self.repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )
        user = User(
            name=data.name,
            email=data.email,
            hashed_password=hash_password(data.password),
        )
        self.repo.save(user)
        return UserResponse.model_validate(user)

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled.",
            )
        token = create_access_token(subject=user.id)
        return TokenResponse(access_token=token)

    def update_profile(self, user: User, data: UpdateProfileRequest) -> UserResponse:
        if data.email and data.email != user.email:
            if self.repo.email_exists(data.email):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já em uso.")
            user.email = data.email
        if data.name is not None:
            user.name = data.name
        if data.bio is not None:
            user.bio = data.bio
        self.repo.save(user)
        return UserResponse.model_validate(user)

    def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta.")
        if len(data.new_password) < 6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A nova senha deve ter pelo menos 6 caracteres.")
        user.hashed_password = hash_password(data.new_password)
        self.repo.save(user)

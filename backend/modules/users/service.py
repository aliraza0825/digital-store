from sqlalchemy import select
from sqlalchemy.orm import Session

from modules.auth.service import hash_password
from modules.users.models import ROLE_CUSTOMER, VALID_ROLES, User


def get_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email.lower().strip())
    return db.scalars(stmt).first()


def get_by_id(db: Session, user_id) -> User | None:
    return db.get(User, user_id)


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


def split_name(name: str | None) -> tuple[str | None, str | None]:
    if not name:
        return None, None
    parts = name.strip().split(None, 1)
    if len(parts) == 1:
        return parts[0], None
    return parts[0], parts[1]


def get_or_create(
    db: Session,
    *,
    email: str,
    name: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
) -> User:
    normalized = email.lower().strip()
    user = get_by_email(db, normalized)
    if first_name is None and last_name is None and name:
        first_name, last_name = split_name(name)

    if user:
        if first_name and not user.first_name:
            user.first_name = first_name
        if last_name and not user.last_name:
            user.last_name = last_name
        db.commit()
        return user

    user = User(
        email=normalized,
        first_name=first_name,
        last_name=last_name,
        role=ROLE_CUSTOMER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_user(
    db: Session,
    *,
    email: str,
    first_name: str | None,
    last_name: str | None,
    role: str,
    password: str | None = None,
) -> User:
    if role not in VALID_ROLES:
        raise ValueError("Invalid role")
    if get_by_email(db, email):
        raise ValueError("Email already exists")

    user = User(
        email=email.lower().strip(),
        first_name=first_name,
        last_name=last_name,
        role=role,
        password_hash=hash_password(password) if password else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user: User,
    *,
    first_name: str | None = None,
    last_name: str | None = None,
    role: str | None = None,
    password: str | None = None,
) -> User:
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if role is not None:
        if role not in VALID_ROLES:
            raise ValueError("Invalid role")
        user.role = role
    if password:
        user.password_hash = hash_password(password)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def ensure_admin_user(db: Session, *, email: str, password: str) -> User:
    user = get_by_email(db, email)
    if user:
        if user.role != "admin" or not user.password_hash:
            user.role = "admin"
            user.password_hash = hash_password(password)
            if not user.first_name:
                user.first_name = "Admin"
            db.commit()
            db.refresh(user)
        return user

    return create_user(
        db,
        email=email,
        first_name="Admin",
        last_name=None,
        role="admin",
        password=password,
    )

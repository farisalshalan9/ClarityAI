import logging
from typing import Optional, Dict, Any
import httpx
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("clarityai.supabase")

class SupabaseAuthService:
    """
    Manages communication with Supabase Auth (GoTrue REST API)
    for email/password registration, login, and token verification.
    """

    def is_enabled(self) -> bool:
        return bool(settings.USE_SUPABASE_AUTH or (settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY)))

    def _get_headers(self, token: Optional[str] = None, use_service_role: bool = False) -> Dict[str, str]:
        key = settings.SUPABASE_SERVICE_ROLE_KEY if (use_service_role and settings.SUPABASE_SERVICE_ROLE_KEY) else (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY)
        auth_bearer = token or key
        return {
            "apikey": key,
            "Authorization": f"Bearer {auth_bearer}",
            "Content-Type": "application/json",
        }

    def signup(self, email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Registers a new user account in Supabase Auth.
        If SUPABASE_SERVICE_ROLE_KEY is provided, auto-confirms email for instant access.
        """
        if not self.is_enabled():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase Auth is not configured on this server."
            )

        url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

        # If admin service key is available, use admin create user (auto-confirms email)
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            admin_url = f"{url}/admin/users"
            payload = {
                "email": email.lower(),
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name or email.split("@")[0].capitalize()
                }
            }
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(admin_url, json=payload, headers=self._get_headers(use_service_role=True))
                    if resp.status_code in [200, 201]:
                        # Now log the user in to get an access token
                        return self.login(email=email, password=password)
                    elif resp.status_code == 422 or "already registered" in resp.text.lower():
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="An account with this email already exists in Supabase."
                        )
                    else:
                        logger.warning(f"Supabase Admin signup response: {resp.status_code} {resp.text}")
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"Admin signup failed, falling back to public signup: {e}")

        # Standard public signup
        signup_url = f"{url}/signup"
        payload = {
            "email": email.lower(),
            "password": password,
            "data": {
                "full_name": full_name or email.split("@")[0].capitalize()
            }
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(signup_url, json=payload, headers=self._get_headers())
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    user = data.get("user") or data
                    access_token = data.get("access_token")
                    
                    # If signup didn't return token (e.g. requires email confirmation or already auto-confirmed), try logging in
                    if not access_token and "id" in user:
                        try:
                            return self.login(email=email, password=password)
                        except Exception:
                            pass

                    return {
                        "user_id": user.get("id"),
                        "email": user.get("email"),
                        "full_name": (user.get("user_metadata") or {}).get("full_name", full_name),
                        "access_token": access_token
                    }
                else:
                    err_msg = resp.json().get("msg") or resp.json().get("error_description") or resp.text
                    if "already registered" in err_msg.lower():
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="An account with this email already exists in Supabase."
                        )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Supabase signup failed: {err_msg}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error connecting to Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not connect to Supabase Auth service: {str(e)}"
            )

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticates user credentials against Supabase Auth.
        """
        if not self.is_enabled():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase Auth is not configured on this server."
            )

        token_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password"
        payload = {
            "email": email.lower(),
            "password": password
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(token_url, json=payload, headers=self._get_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    user = data.get("user", {})
                    return {
                        "access_token": data.get("access_token"),
                        "token_type": data.get("token_type", "bearer"),
                        "user_id": user.get("id"),
                        "email": user.get("email"),
                        "full_name": (user.get("user_metadata") or {}).get("full_name")
                    }
                else:
                    err_msg = resp.json().get("error_description") or resp.json().get("msg") or "Invalid login credentials"
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Supabase authentication failed: {err_msg}",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error connecting to Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not reach Supabase Auth: {str(e)}"
            )

    def get_user_from_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Validates access token against Supabase Auth API (/auth/v1/user).
        """
        if not self.is_enabled():
            return None

        user_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(user_url, headers=self._get_headers(token=access_token))
                if resp.status_code == 200:
                    user_data = resp.json()
                    return {
                        "id": user_data.get("id"),
                        "email": user_data.get("email"),
                        "full_name": (user_data.get("user_metadata") or {}).get("full_name")
                    }
        except Exception as e:
            logger.warning(f"Failed to validate Supabase token: {e}")
        return None

supabase_service = SupabaseAuthService()

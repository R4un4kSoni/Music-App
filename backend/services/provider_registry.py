from backend.services.providers.base_provider import BaseMusicProvider


class ProviderRegistry:

    def __init__(self):
        self.providers = {}

    def register(self, name: str, provider: BaseMusicProvider):
        """Register a music provider."""

        if not name or not name.strip():
            raise ValueError("Provider name cannot be empty.")

        if not isinstance(provider, BaseMusicProvider):
            raise TypeError("Provider must inherit BaseMusicProvider.")

        name = name.strip().lower()

        if name in self.providers:
            raise ValueError(f"Provider '{name}' is already registered.")

        self.providers[name] = provider

        return True

    def get(self, name: str):
        """Get a registered provider."""

        if not name:
            return None

        return self.providers.get(name.strip().lower())

    def list_providers(self):
        """Return all registered provider names."""

        return list(self.providers.keys())

    def remove(self, name: str):
        """Remove a registered provider."""

        if not name:
            return False

        return self.providers.pop(name.strip().lower(), None) is not None
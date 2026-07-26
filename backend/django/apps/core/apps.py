from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core'

    def ready(self) -> None:
        """Initialise MongoDB connection on Django startup.

        The connection is lazily created via ``MongoConnectionManager``
        and gracefully closed at interpreter exit via ``atexit``.

        This mirrors the pattern used by ``apps.users`` for signal
        registration — see ``apps/users/apps.py``.
        """
        from apps.core.mongodb import initialise_mongodb  # noqa: F811

        try:
            initialise_mongodb()
        except Exception:
            # Log but do not crash Django startup if MongoDB is unreachable.
            # The connection will be retried on first actual use.
            import logging
            logging.getLogger("jolhub.mongodb").warning(
                "MongoDB initialisation deferred — will retry on first use.",
                exc_info=True,
            )

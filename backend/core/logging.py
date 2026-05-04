import logging
import logging.handlers
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)


def setup_logging():
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Konsol
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Genel log dosyasi (gunluk rotate)
    file_handler = logging.handlers.TimedRotatingFileHandler(
        LOG_DIR / "aidep.log",
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    # Hata logu ayri dosyaya
    error_handler = logging.handlers.TimedRotatingFileHandler(
        LOG_DIR / "error.log",
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

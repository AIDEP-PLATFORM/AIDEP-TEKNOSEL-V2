import os
from logging.config import fileConfig
from dotenv import load_dotenv

from sqlalchemy import engine_from_config, pool
from alembic import context

# .env dosyasını yükle
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DATABASE_URL'yi env'den al
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

# Modellerin metadata'sını import et
from core.database import Base  # noqa: E402
import models  # noqa: E402, F401

target_metadata = Base.metadata

# PostGIS / Tiger / Topology iç tablolarını hariç tut
EXCLUDED_TABLES = {
    "spatial_ref_sys", "topology", "layer",
    "cousub", "pagc_rules", "zip_state", "county_lookup",
    "pagc_lex", "tabblock20", "zip_lookup_base", "addr",
    "geocode_settings_default", "county", "place", "countysub_lookup",
    "direction_lookup", "tabblock", "tract", "place_lookup",
    "loader_variables", "geocode_settings", "secondary_unit_lookup",
    "zip_lookup", "state", "zcta5", "zip_state_loc", "state_lookup",
    "faces", "featnames", "loader_platform", "addrfeat",
    "loader_lookuptables", "zip_lookup_all", "bg", "pagc_gaz",
    "street_type_lookup", "edges",
}

EXCLUDED_SCHEMAS = {"tiger", "tiger_data", "topology"}


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        if name in EXCLUDED_TABLES:
            return False
        if hasattr(object, "schema") and object.schema in EXCLUDED_SCHEMAS:
            return False
    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

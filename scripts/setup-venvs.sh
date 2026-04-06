#!/bin/bash
# FILE: /opt/jol/scripts/setup-venvs.sh
# PURPOSE: Create 4 compliance-grade VENVs

cd /opt/jol/venvs

# VENV 1: Backend (Django)
python3.12 -m venv jol-backend --system-site-packages=false
source jol-backend/bin/activate
pip install --upgrade pip setuptools wheel
pip install \
    django==5.0.2 \
    psycopg2-binary \
    celery[redis] \
    djangorestframework \
    strawberry-graphql \
    django-cors-headers \
    python-jose[cryptography] \
    passlib[bcrypt]
deactivate

# VENV 2: AI/ML (Python 3.11 for compatibility)
python3.11 -m venv jol-ai --system-site-packages=false
source jol-ai/bin/activate
pip install --upgrade pip
pip install \
    qoder==2.1.0 \
    transformers \
    torch --index-url https://download.pytorch.org/whl/cpu \
    langchain \
    langchain-community \
    ollama \
    chromadb \
    sentence-transformers
deactivate

# VENV 3: Data/ETL
python3.12 -m venv jol-data --system-site-packages=false
source jol-data/bin/activate
pip install --upgrade pip
pip install \
    pandas \
    numpy \
    apache-airflow \
    dbt-core \
    dbt-postgres \
    sqlalchemy \
    alembic \
    great-expectations \
    psycopg2-binary
deactivate

# VENV 4: Tools/DevOps
python3.12 -m venv jol-tools --system-site-packages=false
source jol-tools/bin/activate
pip install --upgrade pip
pip install \
    ansible \
    ansible-core \
    boto3 \
    awscli \
    azure-cli \
    google-cloud-storage \
    google-cloud-compute \
    requests \
    pyyaml \
    click \
    rich
deactivate

# Note: For full gcloud SDK, install separately:
#   curl https://sdk.cloud.google.com | bash
# Or on Ubuntu: sudo apt install google-cloud-sdk

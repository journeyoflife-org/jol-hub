# JOL-HUB Data Module
# GDPR Article 30 - Records of Processing Activities

## Quick Start

```bash
# Activate virtual environment
source /opt/jol/venvs/jol-data/bin/activate

# Install dependencies
cd /opt/jol/repos/jol-hub/data
pip install -r requirements.txt

# Run tests
pytest tests/

# Generate ROPA report
python -c "from src.gdpr import ROPAGenerator; ROPAGenerator().save_report()"
```

## Directory Structure

```
data/
├── src/
│   ├── pipelines/          # ETL pipelines
│   │   ├── country_sync/   # 27 country data sync
│   │   ├── entity_import/  # Bulk entity onboarding
│   │   └── donation_analytics/  # Financial aggregation
│   ├── transformations/    # dbt SQL models
│   ├── quality/           # Great Expectations
│   └── gdpr/              # GDPR utilities
├── airflow/               # Airflow DAGs
├── dbt/                   # dbt configuration
├── sql/                   # SQL scripts
└── tests/                 # pytest suite
```

## GDPR Compliance

All data processing follows GDPR Article 30 requirements:
- k-anonymity (k=5) for aggregated data
- 7-year retention for financial records
- Automated consent validation
- Full audit logging

## Usage

### Run Daily ETL
```bash
airflow dags trigger jol_daily_sync
```

### Generate Compliance Report
```bash
python -m src.cli compliance_report --days 30
```

### Validate Data Quality
```bash
python -m src.cli run_checks --checkpoint entity_completeness
```

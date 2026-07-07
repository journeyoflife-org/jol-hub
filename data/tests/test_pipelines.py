"""
JOL-HUB Data Pipeline Tests
"""

import pytest


class TestPipelines:
    """Test ETL pipelines."""
    
    def test_country_sync_template(self):
        """Country sync template should be importable."""
        from src.pipelines.country_sync.template_sync import CountrySyncTemplate
        
        assert CountrySyncTemplate is not None
    
    def test_bulk_loader_config(self):
        """Bulk loader should have default config."""
        from src.pipelines.entity_import.bulk_loader import ImportConfig
        
        config = ImportConfig()
        assert config.batch_size == 100
        assert config.enable_rollback == True


class TestValidators:
    """Test data validators."""
    
    def test_csv_validator_schema(self):
        """CSV validator should have schemas."""
        from src.pipelines.entity_import.csv_validator import ENTITY_SCHEMAS
        
        assert "parish" in ENTITY_SCHEMAS
        assert "donation" in ENTITY_SCHEMAS
        assert "priest" in ENTITY_SCHEMAS


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

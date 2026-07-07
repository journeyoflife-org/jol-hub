#!/usr/bin/env python3
"""
JOL-HUB Compliance MCP Server
GDPR Article 25/32 and Canon Law CIC 1300-1307 validation
"""
import sys
import json
import re

def handle_list_tools():
    """Define available tools"""
    return {
        "tools": [
            {
                "name": "check_gdpr_compliance",
                "description": "Check code for GDPR Article 25/32 compliance",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "description": "Source code to check"},
                        "language": {"enum": ["python", "typescript", "sql"]},
                        "data_types": {"type": "array", "items": {"enum": ["pii", "financial", "sacramental"]}}
                    },
                    "required": ["code", "language"]
                }
            },
            {
                "name": "check_canon_law",
                "description": "Validate donation/financial code against Canon Law CIC 1300-1307",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string"},
                        "feature_type": {"enum": ["donation", "sacramental_record", "financial_report"]}
                    },
                    "required": ["code", "feature_type"]
                }
            }
        ]
    }

def check_gdpr_compliance(code, language, data_types):
    """Check code for GDPR issues"""
    issues = []
    
    # Check for hardcoded PII
    if re.search(r'(email|phone|ssn|password)\s*=\s*["\'][^"\']+["\']', code, re.IGNORECASE):
        issues.append("WARNING: Possible hardcoded PII detected")
    
    # Check for SQL injection (parameterized queries)
    if language == "python":
        if re.search(r'execute\s*\(\s*["\'].*%s.*["\']', code):
            issues.append("CRITICAL: Possible SQL injection - use parameterized queries")
    
    # Check for encryption
    if "pii" in data_types or "financial" in data_types:
        if "encrypt" not in code.lower() and "hash" not in code.lower():
            issues.append("WARNING: Sensitive data should be encrypted/hashed")
    
    # Check data retention
    if "retention" not in code.lower() and "delete" not in code.lower():
        issues.append("INFO: Consider adding data retention policy (GDPR Article 5)")
    
    if not issues:
        return "✓ No obvious GDPR violations detected. Remember to implement data subject rights (access, erasure, portability)."
    
    return "\n".join(issues)

def check_canon_law(code, feature_type):
    """Validate against Canon Law"""
    issues = []
    
    if feature_type == "donation":
        # CIC 1300: Pious foundations require Bishop's permission
        if "bishop" not in code.lower() and "diocese" not in code.lower() and "recognitio" not in code.lower():
            issues.append("WARNING: CIC 1300 - Donation handling should include Episcopal oversight mechanism")
        
        # CIC 1301: Purpose must be respected
        if "restricted" not in code.lower() and "purpose" not in code.lower():
            issues.append("INFO: CIC 1301 - Consider implementing restricted fund tracking")
        
        # CIC 1304: Transparency
        if "audit" not in code.lower() and "transparent" not in code.lower():
            issues.append("INFO: CIC 1304 - Ensure donation transparency for donors")
    
    elif feature_type == "sacramental_record":
        # Canon 535: Parish records
        if "permanent" not in code.lower():
            issues.append("WARNING: Canon 535 - Sacramental records should be permanent/immutable")
    
    if not issues:
        return "✓ No obvious Canon Law violations. Ensure Bishop's recognitio obtained for canonical entities."
    
    return "\n".join(issues)

def handle_call_tool(name, arguments):
    """Execute tool calls"""
    code = arguments.get("code", "")
    
    if name == "check_gdpr_compliance":
        language = arguments.get("language", "python")
        data_types = arguments.get("data_types", [])
        result = check_gdpr_compliance(code, language, data_types)
        return {"content": [{"type": "text", "text": result}]}
    
    elif name == "check_canon_law":
        feature_type = arguments.get("feature_type", "donation")
        result = check_canon_law(code, feature_type)
        return {"content": [{"type": "text", "text": result}]}
    
    else:
        return {"content": [{"type": "text", "text": f"Unknown tool: {name}"}]}

def main():
    """Main MCP server loop"""
    for line in sys.stdin:
        try:
            message = json.loads(line)
            method = message.get("method")
            params = message.get("params", {})
            
            if method == "initialize":
                response = {
                    "jsonrpc": "2.0",
                    "id": message.get("id"),
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "serverInfo": {"name": "jol-compliance", "version": "1.0.0"}
                    }
                }
                print(json.dumps(response), flush=True)
                
            elif method == "tools/list":
                response = {
                    "jsonrpc": "2.0",
                    "id": message.get("id"),
                    "result": handle_list_tools()
                }
                print(json.dumps(response), flush=True)
                
            elif method == "tools/call":
                result = handle_call_tool(params.get("name"), params.get("arguments", {}))
                response = {
                    "jsonrpc": "2.0",
                    "id": message.get("id"),
                    "result": result
                }
                print(json.dumps(response), flush=True)
                
        except json.JSONDecodeError:
            continue
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": message.get("id"),
                "error": {"code": -32603, "message": str(e)}
            }
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    main()

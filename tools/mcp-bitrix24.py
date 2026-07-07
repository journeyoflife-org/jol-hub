#!/usr/bin/env python3
"""
JOL-HUB Bitrix24 MCP Server
Provides CRM data access for Qoder agentic coding
"""
import os
import sys
import json
import requests
from urllib.parse import urljoin

BITRIX_WEBHOOK = os.getenv("BITRIX_WEBHOOK_URL", "https://journeyoflife.bitrix24.ru/rest/1/")

def handle_list_tools():
    """Define available tools"""
    return {
        "tools": [
            {
                "name": "get_entity_by_id",
                "description": "Retrieve entity (church/funeral home) from Bitrix24",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_id": {"type": "string"},
                        "entity_type": {"enum": ["company", "contact", "deal"]}
                    },
                    "required": ["entity_id"]
                }
            },
            {
                "name": "search_entities",
                "description": "Search entities by name or criteria",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "country": {"type": "string", "description": "ISO country code (lt, lv, ee)"},
                        "entity_type": {"enum": ["catholic_parish", "funeral_home", "cemetery"]}
                    },
                    "required": ["query", "country"]
                }
            }
        ]
    }

def handle_call_tool(name, arguments):
    """Execute tool calls"""
    if name == "get_entity_by_id":
        entity_id = arguments.get("entity_id")
        entity_type = arguments.get("entity_type", "company")
        
        # Call Bitrix24 API
        url = f"{BITRIX_WEBHOOK}crm.{entity_type}.get"
        try:
            response = requests.get(url, params={"id": entity_id}, timeout=10)
            data = response.json()
            
            # GDPR: Remove PII before returning
            if "result" in data:
                result = data["result"]
                # Mask sensitive fields
                if "EMAIL" in result:
                    result["EMAIL"] = "***@***.***"
                if "PHONE" in result:
                    result["PHONE"] = "***"
                    
                return {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}
            else:
                return {"content": [{"type": "text", "text": f"Error: {data.get('error_description', 'Unknown')}"}]}
                
        except Exception as e:
            return {"content": [{"type": "text", "text": f"API Error: {str(e)}"}]}
    
    elif name == "search_entities":
        query = arguments.get("query")
        country = arguments.get("country")
        
        # Validate country (GDPR residency check)
        valid_countries = ["lt", "lv", "ee", "de", "fr", "it", "pl", "es", "pt", "nl", "be", "at", 
                          "si", "hr", "cz", "sk", "hu", "bg", "ro", "gr", "cy", "mt", "dk", "fi", "se", "ie"]
        
        if country not in valid_countries:
            return {"content": [{"type": "text", "text": f"Error: Invalid country code '{country}'. Use ISO 3166-1 alpha-2."}]}
        
        url = f"{BITRIX_WEBHOOK}crm.company.list"
        try:
            response = requests.get(url, params={
                "filter[UF_CRM_COUNTRY_ISO]": country,
                "filter[TITLE]": query,
                "select[]": ["ID", "TITLE", "UF_CRM_ENTITY_TYPE", "UF_CRM_CANON_STATUS"]
            }, timeout=10)
            
            data = response.json()
            results = data.get("result", [])
            
            return {"content": [{"type": "text", "text": f"Found {len(results)} entities:\n" + json.dumps(results, indent=2)}]}
            
        except Exception as e:
            return {"content": [{"type": "text", "text": f"Search Error: {str(e)}"}]}
    
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
                        "serverInfo": {"name": "jol-bitrix24", "version": "1.0.0"}
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

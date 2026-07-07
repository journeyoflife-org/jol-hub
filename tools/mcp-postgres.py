#!/usr/bin/env python3
"""
JOL-HUB PostgreSQL MCP Server
Schema introspection for 27-country data warehouse
READ-ONLY - No modifications allowed
"""
import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor

PGHOST = os.getenv("PGHOST", "192.168.8.51")
PGPORT = os.getenv("PGPORT", "5432")
PGUSER = os.getenv("PGUSER", "jol_readonly")
# PGPASSWORD from environment

def get_connection(country_code):
    """Get database connection for specific country"""
    dbname = f"jol_{country_code}_warehouse"
    conn = psycopg2.connect(
        host=PGHOST,
        port=PGPORT,
        dbname=dbname,
        user=PGUSER,
        password=os.getenv("PGPASSWORD"),
        sslmode="require",
        options="-c statement_timeout=30000"  # 30s timeout
    )
    return conn

def handle_list_tools():
    """Define available tools"""
    return {
        "tools": [
            {
                "name": "get_schema_info",
                "description": "Get database schema for a country (tables, columns)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "country": {"type": "string", "description": "ISO country code"},
                        "schema": {"type": "string", "default": "analytics", "enum": ["analytics", "staging"]}
                    },
                    "required": ["country"]
                }
            },
            {
                "name": "execute_read_query",
                "description": "Execute SELECT query (read-only)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "country": {"type": "string"},
                        "query": {"type": "string", "description": "SELECT statement only"},
                        "limit": {"type": "integer", "default": 100, "maximum": 1000}
                    },
                    "required": ["country", "query"]
                }
            }
        ]
    }

def handle_call_tool(name, arguments):
    """Execute tool calls - STRICTLY READ-ONLY"""
    country = arguments.get("country", "").lower()
    
    # Validate country
    valid_countries = ["lt", "lv", "ee", "de", "fr", "it", "pl", "es", "pt", "nl", "be", "at",
                      "si", "hr", "cz", "sk", "hu", "bg", "ro", "gr", "cy", "mt", "dk", "fi", "se", "ie"]
    
    if country not in valid_countries:
        return {"content": [{"type": "text", "text": f"Error: Invalid country '{country}'"}]}
    
    try:
        conn = get_connection(country)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if name == "get_schema_info":
            schema = arguments.get("schema", "analytics")
            
            cursor.execute("""
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = %s
                ORDER BY table_name, ordinal_position
            """, (schema,))
            
            results = cursor.fetchall()
            conn.close()
            
            return {"content": [{"type": "text", "text": json.dumps([dict(r) for r in results], indent=2)}]}
        
        elif name == "execute_read_query":
            query = arguments.get("query", "").strip()
            limit = arguments.get("limit", 100)
            
            # SAFETY: Only allow SELECT
            if not query.upper().startswith("SELECT"):
                return {"content": [{"type": "text", "text": "Error: Only SELECT queries allowed"}]}
            
            # Add safety limit
            if "LIMIT" not in query.upper():
                query = f"{query} LIMIT {limit}"
            
            cursor.execute(query)
            results = cursor.fetchall()
            conn.close()
            
            return {"content": [{"type": "text", "text": json.dumps([dict(r) for r in results], indent=2)}]}
        
        else:
            return {"content": [{"type": "text", "text": f"Unknown tool: {name}"}]}
            
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Database Error: {str(e)}"}]}

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
                        "serverInfo": {"name": "jol-postgres", "version": "1.0.0"}
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

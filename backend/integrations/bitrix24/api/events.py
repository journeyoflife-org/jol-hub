"""
Bitrix24 Calendar Events API
Handles mass scheduling, sacraments, and church events.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from ..client import Bitrix24Client


class EventType(str, Enum):
    """Types of church events."""
    MASS = "mass"
    SACRAMENT = "sacrament"
    FUNERAL = "funeral"
    WEDDING = "wedding"
    BAPTISM = "baptism"
    CONFESSION = "confession"
    ADORATION = "adoration"
    PROCESSION = "procession"
    PARISH_MEETING = "parish_meeting"
    SPECIAL_EVENT = "special_event"


class SacramentType(str, Enum):
    """Types of sacraments."""
    BAPTISM = "baptism"
    FIRST_COMMUNION = "first_communion"
    CONFIRMATION = "confirmation"
    MATRIMONY = "matrimony"
    HOLY_ORDERS = "holy_orders"
    ANOINTING_SICK = "anointing_sick"
    RECONCILIATION = "reconciliation"


@dataclass
class Bitrix24Event:
    """Bitrix24 calendar event."""
    id: str
    name: str
    date_from: datetime
    date_to: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    owner_id: Optional[str] = None
    created: Optional[datetime] = None
    modified: Optional[datetime] = None
    
    # JOL-HUB custom fields
    event_type: Optional[str] = None
    sacrament_type: Optional[str] = None
    parish_code: Optional[str] = None
    celebrant: Optional[str] = None
    intention: Optional[str] = None
    language: Optional[str] = None
    
    @classmethod
    def from_api(cls, data: Dict[str, Any]) -> "Bitrix24Event":
        """Create event from API response."""
        return cls(
            id=str(data.get("ID", "")),
            name=data.get("NAME", ""),
            date_from=cls._parse_datetime(data.get("DATE_FROM")),
            date_to=cls._parse_datetime(data.get("DATE_TO")),
            description=data.get("DESCRIPTION"),
            location=data.get("LOCATION"),
            owner_id=data.get("OWNER_ID"),
            created=cls._parse_datetime(data.get("CREATED")),
            modified=cls._parse_datetime(data.get("MODIFIED")),
            event_type=data.get("UF_EVENT_TYPE"),
            sacrament_type=data.get("UF_SACRAMENT_TYPE"),
            parish_code=data.get("UF_PARISH_CODE"),
            celebrant=data.get("UF_CELEBRANT"),
            intention=data.get("UF_INTENTION"),
            language=data.get("UF_LANGUAGE"),
        )
    
    @staticmethod
    def _parse_datetime(value: Optional[str]) -> datetime:
        if not value:
            return datetime.now()
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return datetime.now()


@dataclass
class CreateEventParams:
    """Parameters for creating an event."""
    name: str
    date_from: datetime
    date_to: datetime
    event_type: EventType
    description: Optional[str] = None
    location: Optional[str] = None
    
    # Church-specific fields
    parish_code: Optional[str] = None
    sacrament_type: Optional[SacramentType] = None
    celebrant: Optional[str] = None
    intention: Optional[str] = None
    language: str = "lt"
    
    def to_api(self) -> Dict[str, Any]:
        """Convert to API format."""
        fields = {
            "NAME": self.name,
            "DATE_FROM": self.date_from.isoformat(),
            "DATE_TO": self.date_to.isoformat(),
            "UF_EVENT_TYPE": self.event_type.value,
            "UF_LANGUAGE": self.language,
        }
        
        if self.description:
            fields["DESCRIPTION"] = self.description
        if self.location:
            fields["LOCATION"] = self.location
        if self.parish_code:
            fields["UF_PARISH_CODE"] = self.parish_code
        if self.sacrament_type:
            fields["UF_SACRAMENT_TYPE"] = self.sacrament_type.value
        if self.celebrant:
            fields["UF_CELEBRANT"] = self.celebrant
        if self.intention:
            fields["UF_INTENTION"] = self.intention
        
        return fields


@dataclass
class MassSchedule:
    """Mass schedule for a parish."""
    parish_code: str
    weekday_times: List[str]
    sunday_times: List[str]
    holy_day_times: List[str]
    language: str = "lt"
    
    def to_events(self, start_date: datetime, days: int = 30) -> List[CreateEventParams]:
        """Generate event params for scheduled masses."""
        events = []
        
        for day_offset in range(days):
            current_date = start_date.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            current_date = datetime.fromordinal(
                current_date.toordinal() + day_offset
            )
            
            # Determine if Sunday or weekday
            is_sunday = current_date.weekday() == 6
            times = self.sunday_times if is_sunday else self.weekday_times
            
            for time_str in times:
                hour, minute = map(int, time_str.split(":"))
                mass_time = current_date.replace(hour=hour, minute=minute)
                
                events.append(CreateEventParams(
                    name=f"Mass - {self.parish_code}",
                    date_from=mass_time,
                    date_to=mass_time.replace(hour=hour + 1),
                    event_type=EventType.MASS,
                    parish_code=self.parish_code,
                    language=self.language,
                ))
        
        return events


class EventApi:
    """
    Bitrix24 Calendar Events API.
    
    Handles church events, mass schedules, and sacraments.
    """
    
    def __init__(self, client: Bitrix24Client):
        self._client = client
    
    async def get(self, event_id: str) -> Bitrix24Event:
        """Get an event by ID."""
        response = await self._client.get(
            "calendar.event.getbyid",
            {"id": event_id},
            entity_id=event_id,
            entity_type="event",
        )
        return Bitrix24Event.from_api(response.result)
    
    async def list(
        self,
        filter_params: Optional[Dict[str, Any]] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> List[Bitrix24Event]:
        """List events with optional filtering."""
        params = {}
        
        if filter_params:
            params["filter"] = filter_params
        if start:
            params["from"] = start.isoformat()
        if end:
            params["to"] = end.isoformat()
        
        response = await self._client.get("calendar.event.get", params)
        
        events = []
        for item in response.result or []:
            events.append(Bitrix24Event.from_api(item))
        
        return events
    
    async def add(self, params: CreateEventParams) -> str:
        """Create a new event."""
        response = await self._client.post(
            "calendar.event.add",
            {"fields": params.to_api()},
            entity_type="event",
        )
        
        event_id = str(response.result)
        
        await self._client.audit.log_data_operation(
            operation="event_created",
            entity_type="event",
            entity_id=event_id,
            details={
                "event_type": params.event_type.value,
                "parish_code": params.parish_code,
            },
        )
        
        return event_id
    
    async def update(
        self,
        event_id: str,
        fields: Dict[str, Any],
    ) -> bool:
        """Update an existing event."""
        response = await self._client.post(
            "calendar.event.update",
            {"id": event_id, "fields": fields},
            entity_id=event_id,
            entity_type="event",
        )
        
        return bool(response.result)
    
    async def delete(self, event_id: str) -> bool:
        """Delete an event."""
        response = await self._client.post(
            "calendar.event.delete",
            {"id": event_id},
            entity_id=event_id,
            entity_type="event",
        )
        
        return bool(response.result)
    
    async def get_parish_events(
        self,
        parish_code: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> List[Bitrix24Event]:
        """Get all events for a parish."""
        return await self.list(
            filter_params={"UF_PARISH_CODE": parish_code},
            start=start,
            end=end,
        )
    
    async def get_mass_schedule(
        self,
        parish_code: str,
        date: Optional[datetime] = None,
    ) -> List[Bitrix24Event]:
        """Get mass schedule for a specific date."""
        target_date = date or datetime.now()
        start = target_date.replace(hour=0, minute=0, second=0)
        end = target_date.replace(hour=23, minute=59, second=59)
        
        return await self.list(
            filter_params={
                "UF_PARISH_CODE": parish_code,
                "UF_EVENT_TYPE": EventType.MASS.value,
            },
            start=start,
            end=end,
        )
    
    async def create_sacrament_event(
        self,
        parish_code: str,
        sacrament_type: SacramentType,
        date: datetime,
        celebrant: Optional[str] = None,
        participant_name: Optional[str] = None,
    ) -> str:
        """Create a sacrament event (baptism, wedding, etc.)."""
        sacrament_names = {
            SacramentType.BAPTISM: "Baptism",
            SacramentType.FIRST_COMMUNION: "First Holy Communion",
            SacramentType.CONFIRMATION: "Confirmation",
            SacramentType.MATRIMONY: "Wedding",
            SacramentType.HOLY_ORDERS: "Holy Orders",
            SacramentType.ANOINTING_SICK: "Anointing of the Sick",
            SacramentType.RECONCILIATION: "Confession",
        }
        
        name = sacrament_names.get(sacrament_type, "Sacrament")
        if participant_name:
            name = f"{name} - {participant_name}"
        
        params = CreateEventParams(
            name=name,
            date_from=date,
            date_to=date.replace(hour=date.hour + 1),
            event_type=EventType.SACRAMENT,
            parish_code=parish_code,
            sacrament_type=sacrament_type,
            celebrant=celebrant,
        )
        
        return await self.add(params)
    
    async def batch_create_masses(
        self,
        schedule: MassSchedule,
        start_date: Optional[datetime] = None,
        days: int = 30,
    ) -> List[str]:
        """Create multiple mass events from a schedule."""
        events = schedule.to_events(start_date or datetime.now(), days)
        
        event_ids = []
        for event in events:
            event_id = await self.add(event)
            event_ids.append(event_id)
        
        return event_ids

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Country
from .serializers import CountrySerializer


class CountryListView(generics.ListAPIView):
    """GET /api/v1/countries/ — list all supported countries."""

    serializer_class = CountrySerializer
    permission_classes = [IsAuthenticated]
    queryset = Country.objects.filter(is_active=True)


class CountryDetailView(generics.RetrieveAPIView):
    """GET /api/v1/countries/{code}/ — retrieve by ISO code."""

    serializer_class = CountrySerializer
    permission_classes = [IsAuthenticated]
    queryset = Country.objects.filter(is_active=True)
    lookup_field = 'code'
    lookup_url_kwarg = 'code'
